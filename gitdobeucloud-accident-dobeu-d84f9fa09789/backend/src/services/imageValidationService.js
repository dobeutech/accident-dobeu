const AWS = require('aws-sdk');
const { sequelize } = require('../database/connection');
const logger = require('../utils/logger');

class ImageValidationService {
  constructor() {
    this.rekognition = new AWS.Rekognition({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    this.minConfidence = parseFloat(process.env.AI_MIN_CONFIDENCE || '70');
    this.provider = process.env.AI_PROVIDER || 'aws_rekognition';
  }

  /**
   * Validate image with AI analysis
   */
  async validateImage(photoId, reportId, fleetId, fileKey) {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting image validation for photo ${photoId}`);
      
      // Create validation record
      const [validationRecord] = await sequelize.query(`
        INSERT INTO image_validations 
          (photo_id, report_id, fleet_id, validation_status, ai_provider)
        VALUES 
          (:photo_id, :report_id, :fleet_id, 'processing', :ai_provider)
        RETURNING *
      `, {
        replacements: {
          photo_id: photoId,
          report_id: reportId,
          fleet_id: fleetId,
          ai_provider: this.provider
        },
        type: sequelize.QueryTypes.INSERT
      });

      const validation = validationRecord[0];
      
      // Run all validations in parallel
      const [
        labelDetection,
        textDetection,
        moderationLabels,
        faceDetection,
        qualityCheck
      ] = await Promise.all([
        this.detectLabels(fileKey),
        this.detectText(fileKey),
        this.detectModerationLabels(fileKey),
        this.detectFaces(fileKey),
        this.checkImageQuality(fileKey)
      ]);

      // Process results
      const validationResults = this.processValidationResults({
        labelDetection,
        textDetection,
        moderationLabels,
        faceDetection,
        qualityCheck
      });

      // Update validation record
      const processingTime = Date.now() - startTime;
      await this.updateValidationRecord(validation.id, validationResults, processingTime);

      // Update photo validation status
      await this.updatePhotoValidationStatus(photoId, validationResults.validation_status);

      logger.info(`Image validation completed for photo ${photoId} in ${processingTime}ms`);
      
      return {
        validationId: validation.id,
        status: validationResults.validation_status,
        ...validationResults
      };
      
    } catch (error) {
      logger.error(`Image validation failed for photo ${photoId}:`, error);
      
      // Update validation record with error
      await sequelize.query(`
        UPDATE image_validations 
        SET validation_status = 'invalid',
            error_message = :error_message,
            processing_time_ms = :processing_time,
            updated_at = CURRENT_TIMESTAMP
        WHERE photo_id = :photo_id
      `, {
        replacements: {
          photo_id: photoId,
          error_message: error.message,
          processing_time: Date.now() - startTime
        },
        type: sequelize.QueryTypes.UPDATE
      });
      
      throw error;
    }
  }

  /**
   * Detect labels and objects in image
   */
  async detectLabels(fileKey) {
    try {
      const params = {
        Image: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET,
            Name: fileKey
          }
        },
        MaxLabels: 50,
        MinConfidence: this.minConfidence
      };

      const result = await this.rekognition.detectLabels(params).promise();
      
      return {
        labels: result.Labels.map(label => ({
          name: label.Name,
          confidence: label.Confidence,
          categories: label.Categories?.map(c => c.Name) || [],
          instances: label.Instances?.length || 0
        })),
        vehicleDamageDetected: this.detectVehicleDamage(result.Labels),
        damageSeverity: this.assessDamageSeverity(result.Labels)
      };
    } catch (error) {
      logger.error('Label detection failed:', error);
      return { labels: [], vehicleDamageDetected: false, damageSeverity: null };
    }
  }

  /**
   * Detect and extract text from image (OCR)
   */
  async detectText(fileKey) {
    try {
      const params = {
        Image: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET,
            Name: fileKey
          }
        }
      };

      const result = await this.rekognition.detectText(params).promise();
      
      const textDetections = result.TextDetections || [];
      const lines = textDetections.filter(t => t.Type === 'LINE');
      const words = textDetections.filter(t => t.Type === 'WORD');
      
      // Extract full text
      const extractedText = lines
        .sort((a, b) => a.Geometry.BoundingBox.Top - b.Geometry.BoundingBox.Top)
        .map(t => t.DetectedText)
        .join('\n');
      
      // Detect license plates
      const licensePlates = this.extractLicensePlates(words);
      
      // Calculate average confidence
      const avgConfidence = words.length > 0
        ? words.reduce((sum, w) => sum + w.Confidence, 0) / words.length
        : 0;

      return {
        extractedText,
        textConfidence: avgConfidence / 100,
        licensePlates,
        wordCount: words.length,
        lineCount: lines.length
      };
    } catch (error) {
      logger.error('Text detection failed:', error);
      return { extractedText: '', textConfidence: 0, licensePlates: [], wordCount: 0 };
    }
  }

  /**
   * Detect inappropriate content
   */
  async detectModerationLabels(fileKey) {
    try {
      const params = {
        Image: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET,
            Name: fileKey
          }
        },
        MinConfidence: this.minConfidence
      };

      const result = await this.rekognition.detectModerationLabels(params).promise();
      
      const inappropriateContent = result.ModerationLabels.length > 0;
      const flaggedCategories = result.ModerationLabels.map(label => ({
        name: label.Name,
        confidence: label.Confidence,
        parentName: label.ParentName
      }));

      return {
        inappropriateContent,
        flaggedCategories
      };
    } catch (error) {
      logger.error('Moderation detection failed:', error);
      return { inappropriateContent: false, flaggedCategories: [] };
    }
  }

  /**
   * Detect faces in image
   */
  async detectFaces(fileKey) {
    try {
      const params = {
        Image: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET,
            Name: fileKey
          }
        },
        Attributes: ['DEFAULT']
      };

      const result = await this.rekognition.detectFaces(params).promise();
      
      return {
        hasFaces: result.FaceDetails.length > 0,
        faceCount: result.FaceDetails.length,
        faceDetails: result.FaceDetails.map(face => ({
          confidence: face.Confidence,
          ageRange: face.AgeRange,
          emotions: face.Emotions?.map(e => ({ type: e.Type, confidence: e.Confidence }))
        }))
      };
    } catch (error) {
      logger.error('Face detection failed:', error);
      return { hasFaces: false, faceCount: 0, faceDetails: [] };
    }
  }

  /**
   * Check image quality
   */
  async checkImageQuality(fileKey) {
    try {
      // Get image metadata from S3
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileKey
      };

      const metadata = await this.s3.headObject(params).promise();
      const imageData = await this.s3.getObject(params).promise();
      
      // Use Rekognition to assess quality through face detection
      const faceParams = {
        Image: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET,
            Name: fileKey
          }
        },
        Attributes: ['ALL']
      };

      const faceResult = await this.rekognition.detectFaces(faceParams).promise();
      
      let qualityScore = 1.0;
      let isBlurry = false;
      let isDark = false;

      if (faceResult.FaceDetails.length > 0) {
        const face = faceResult.FaceDetails[0];
        const sharpness = face.Quality?.Sharpness || 100;
        const brightness = face.Quality?.Brightness || 100;
        
        qualityScore = (sharpness + brightness) / 200;
        isBlurry = sharpness < 50;
        isDark = brightness < 30;
      }

      return {
        qualityScore,
        isBlurry,
        isDark,
        fileSize: metadata.ContentLength,
        contentType: metadata.ContentType
      };
    } catch (error) {
      logger.error('Quality check failed:', error);
      return { qualityScore: 0.5, isBlurry: false, isDark: false };
    }
  }

  /**
   * Process all validation results
   */
  processValidationResults(results) {
    const {
      labelDetection,
      textDetection,
      moderationLabels,
      faceDetection,
      qualityCheck
    } = results;

    let validationStatus = 'valid';
    let requiresManualReview = false;
    let manualReviewReason = null;

    // Check for inappropriate content
    if (moderationLabels.inappropriateContent) {
      validationStatus = 'flagged';
      requiresManualReview = true;
      manualReviewReason = 'Inappropriate content detected';
    }

    // Check image quality
    if (qualityCheck.isBlurry || qualityCheck.isDark) {
      requiresManualReview = true;
      manualReviewReason = manualReviewReason 
        ? `${manualReviewReason}; Poor image quality`
        : 'Poor image quality';
    }

    // Check if vehicle damage is detected
    if (!labelDetection.vehicleDamageDetected && labelDetection.labels.length > 0) {
      requiresManualReview = true;
      manualReviewReason = manualReviewReason
        ? `${manualReviewReason}; No vehicle damage detected`
        : 'No vehicle damage detected in accident photo';
    }

    if (requiresManualReview && validationStatus === 'valid') {
      validationStatus = 'manual_review';
    }

    return {
      validation_status: validationStatus,
      detected_labels: JSON.stringify(labelDetection.labels),
      detected_objects: JSON.stringify(labelDetection.labels.filter(l => l.instances > 0)),
      scene_confidence: labelDetection.labels.length > 0 
        ? labelDetection.labels[0].confidence / 100 
        : 0,
      is_vehicle_damage_detected: labelDetection.vehicleDamageDetected,
      damage_severity: labelDetection.damageSeverity,
      extracted_text: textDetection.extractedText,
      text_confidence: textDetection.textConfidence,
      detected_license_plates: JSON.stringify(textDetection.licensePlates),
      image_quality_score: qualityCheck.qualityScore,
      is_blurry: qualityCheck.isBlurry,
      is_dark: qualityCheck.isDark,
      has_faces: faceDetection.hasFaces,
      face_count: faceDetection.faceCount,
      contains_inappropriate_content: moderationLabels.inappropriateContent,
      requires_manual_review: requiresManualReview,
      manual_review_reason: manualReviewReason,
      raw_response: JSON.stringify({
        labelDetection,
        textDetection,
        moderationLabels,
        faceDetection,
        qualityCheck
      })
    };
  }

  /**
   * Update validation record in database
   */
  async updateValidationRecord(validationId, results, processingTime) {
    const fields = Object.keys(results).map(key => `${key} = :${key}`).join(', ');
    
    await sequelize.query(`
      UPDATE image_validations 
      SET ${fields},
          processing_time_ms = :processing_time,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :validation_id
    `, {
      replacements: {
        validation_id: validationId,
        processing_time: processingTime,
        ...results
      },
      type: sequelize.QueryTypes.UPDATE
    });
  }

  /**
   * Update photo validation status
   */
  async updatePhotoValidationStatus(photoId, status) {
    await sequelize.query(`
      UPDATE report_photos 
      SET validation_status = :status,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :photo_id
    `, {
      replacements: { photo_id: photoId, status },
      type: sequelize.QueryTypes.UPDATE
    });
  }

  /**
   * Detect vehicle damage from labels
   */
  detectVehicleDamage(labels) {
    const damageKeywords = [
      'damage', 'dent', 'scratch', 'broken', 'cracked', 'shattered',
      'collision', 'crash', 'wreck', 'bent', 'crushed', 'smashed'
    ];
    
    const vehicleKeywords = [
      'car', 'vehicle', 'truck', 'automobile', 'van', 'suv', 'bus'
    ];

    const hasVehicle = labels.some(label => 
      vehicleKeywords.some(keyword => 
        label.Name.toLowerCase().includes(keyword)
      )
    );

    const hasDamage = labels.some(label =>
      damageKeywords.some(keyword =>
        label.Name.toLowerCase().includes(keyword)
      )
    );

    return hasVehicle && hasDamage;
  }

  /**
   * Assess damage severity
   */
  assessDamageSeverity(labels) {
    const severeDamageKeywords = ['shattered', 'crushed', 'totaled', 'destroyed'];
    const moderateDamageKeywords = ['dent', 'bent', 'cracked', 'broken'];
    const minorDamageKeywords = ['scratch', 'scuff', 'chip'];

    const labelNames = labels.map(l => l.Name.toLowerCase()).join(' ');

    if (severeDamageKeywords.some(keyword => labelNames.includes(keyword))) {
      return 'severe';
    } else if (moderateDamageKeywords.some(keyword => labelNames.includes(keyword))) {
      return 'moderate';
    } else if (minorDamageKeywords.some(keyword => labelNames.includes(keyword))) {
      return 'minor';
    }

    return null;
  }

  /**
   * Extract license plates from text detections
   */
  extractLicensePlates(textDetections) {
    const licensePlatePattern = /^[A-Z0-9]{2,8}$/;
    const plates = [];

    textDetections.forEach(detection => {
      const text = detection.DetectedText.replace(/[^A-Z0-9]/g, '');
      if (licensePlatePattern.test(text) && text.length >= 4) {
        plates.push({
          text: detection.DetectedText,
          normalized: text,
          confidence: detection.Confidence,
          boundingBox: detection.Geometry.BoundingBox
        });
      }
    });

    return plates;
  }

  /**
   * Batch validate multiple images
   */
  async batchValidateImages(photos) {
    const results = [];
    
    for (const photo of photos) {
      try {
        const result = await this.validateImage(
          photo.id,
          photo.report_id,
          photo.fleet_id,
          photo.file_key
        );
        results.push({ photoId: photo.id, success: true, result });
      } catch (error) {
        results.push({ photoId: photo.id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get validation results for a photo
   */
  async getValidationResults(photoId) {
    const [results] = await sequelize.query(`
      SELECT * FROM image_validations
      WHERE photo_id = :photo_id
      ORDER BY created_at DESC
      LIMIT 1
    `, {
      replacements: { photo_id: photoId },
      type: sequelize.QueryTypes.SELECT
    });

    return results[0] || null;
  }

  /**
   * Approve manual review
   */
  async approveManualReview(validationId, reviewerId, notes) {
    await sequelize.query(`
      UPDATE image_validations
      SET validation_status = 'valid',
          reviewed_by_user_id = :reviewer_id,
          reviewed_at = CURRENT_TIMESTAMP,
          manual_review_reason = :notes,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :validation_id
    `, {
      replacements: {
        validation_id: validationId,
        reviewer_id: reviewerId,
        notes
      },
      type: sequelize.QueryTypes.UPDATE
    });
  }

  /**
   * Reject manual review
   */
  async rejectManualReview(validationId, reviewerId, reason) {
    await sequelize.query(`
      UPDATE image_validations
      SET validation_status = 'invalid',
          reviewed_by_user_id = :reviewer_id,
          reviewed_at = CURRENT_TIMESTAMP,
          manual_review_reason = :reason,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :validation_id
    `, {
      replacements: {
        validation_id: validationId,
        reviewer_id: reviewerId,
        reason
      },
      type: sequelize.QueryTypes.UPDATE
    });
  }
}

module.exports = new ImageValidationService();
