const imageValidationService = require('../../services/imageValidationService');
const { sequelize } = require('../../database/connection');
const AWS = require('aws-sdk');

// Mock AWS SDK
jest.mock('aws-sdk');

describe('ImageValidationService', () => {
  let mockRekognition;
  let mockS3;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Rekognition
    mockRekognition = {
      detectLabels: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Labels: [
            { Name: 'Car', Confidence: 98.5, Categories: [{ Name: 'Vehicle' }], Instances: [] },
            { Name: 'Damage', Confidence: 92.3, Categories: [], Instances: [] },
          ],
        }),
      }),
      detectText: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          TextDetections: [
            { Type: 'LINE', DetectedText: 'ABC1234', Confidence: 96.2, Geometry: { BoundingBox: { Top: 0.1 } } },
          ],
        }),
      }),
      detectModerationLabels: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          ModerationLabels: [],
        }),
      }),
      detectFaces: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          FaceDetails: [],
        }),
      }),
    };

    // Mock S3
    mockS3 = {
      headObject: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          ContentLength: 1024000,
          ContentType: 'image/jpeg',
        }),
      }),
      getObject: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          Body: Buffer.from('fake-image-data'),
        }),
      }),
    };

    AWS.Rekognition.mockImplementation(() => mockRekognition);
    AWS.S3.mockImplementation(() => mockS3);

    // Mock sequelize
    sequelize.query = jest.fn();
  });

  describe('validateImage', () => {
    it('should successfully validate an image with vehicle damage', async () => {
      const photoId = 'photo-uuid';
      const reportId = 'report-uuid';
      const fleetId = 'fleet-uuid';
      const fileKey = 'test-image.jpg';

      // Mock database responses
      sequelize.query
        .mockResolvedValueOnce([[{ id: 'validation-uuid' }]]) // INSERT validation record
        .mockResolvedValueOnce([]); // UPDATE validation record

      const result = await imageValidationService.validateImage(
        photoId,
        reportId,
        fleetId,
        fileKey
      );

      expect(result).toHaveProperty('validationId');
      expect(result).toHaveProperty('status');
      expect(mockRekognition.detectLabels).toHaveBeenCalled();
      expect(mockRekognition.detectText).toHaveBeenCalled();
      expect(mockRekognition.detectModerationLabels).toHaveBeenCalled();
      expect(mockRekognition.detectFaces).toHaveBeenCalled();
    });

    it('should detect vehicle damage from labels', async () => {
      const labels = [
        { Name: 'Car', Confidence: 98 },
        { Name: 'Damage', Confidence: 95 },
      ];

      const result = imageValidationService.detectVehicleDamage(labels);

      expect(result).toBe(true);
    });

    it('should not detect vehicle damage without vehicle keywords', async () => {
      const labels = [
        { Name: 'Tree', Confidence: 98 },
        { Name: 'Sky', Confidence: 95 },
      ];

      const result = imageValidationService.detectVehicleDamage(labels);

      expect(result).toBe(false);
    });

    it('should assess damage severity correctly', () => {
      const severeLabels = [{ Name: 'Shattered', Confidence: 95 }];
      const moderateLabels = [{ Name: 'Dent', Confidence: 90 }];
      const minorLabels = [{ Name: 'Scratch', Confidence: 85 }];

      expect(imageValidationService.assessDamageSeverity(severeLabels)).toBe('severe');
      expect(imageValidationService.assessDamageSeverity(moderateLabels)).toBe('moderate');
      expect(imageValidationService.assessDamageSeverity(minorLabels)).toBe('minor');
    });

    it('should extract license plates from text detections', () => {
      const textDetections = [
        {
          DetectedText: 'ABC1234',
          Confidence: 96.2,
          Geometry: { BoundingBox: {} },
        },
        {
          DetectedText: 'Not a plate',
          Confidence: 85,
          Geometry: { BoundingBox: {} },
        },
      ];

      const plates = imageValidationService.extractLicensePlates(textDetections);

      expect(plates).toHaveLength(1);
      expect(plates[0].normalized).toBe('ABC1234');
    });

    it('should handle validation errors gracefully', async () => {
      const photoId = 'photo-uuid';
      const reportId = 'report-uuid';
      const fleetId = 'fleet-uuid';
      const fileKey = 'test-image.jpg';

      // Mock database error
      sequelize.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        imageValidationService.validateImage(photoId, reportId, fleetId, fileKey)
      ).rejects.toThrow('Database error');
    });

    it('should flag inappropriate content', async () => {
      mockRekognition.detectModerationLabels = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          ModerationLabels: [
            { Name: 'Explicit Content', Confidence: 95, ParentName: 'Explicit' },
          ],
        }),
      });

      const photoId = 'photo-uuid';
      const reportId = 'report-uuid';
      const fleetId = 'fleet-uuid';
      const fileKey = 'test-image.jpg';

      sequelize.query
        .mockResolvedValueOnce([[{ id: 'validation-uuid' }]])
        .mockResolvedValueOnce([]);

      const result = await imageValidationService.validateImage(
        photoId,
        reportId,
        fleetId,
        fileKey
      );

      expect(result.status).toBe('flagged');
    });
  });

  describe('batchValidateImages', () => {
    it('should validate multiple images', async () => {
      const photos = [
        { id: 'photo-1', report_id: 'report-1', fleet_id: 'fleet-1', file_key: 'image1.jpg' },
        { id: 'photo-2', report_id: 'report-1', fleet_id: 'fleet-1', file_key: 'image2.jpg' },
      ];

      sequelize.query
        .mockResolvedValueOnce([[{ id: 'validation-1' }]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([[{ id: 'validation-2' }]])
        .mockResolvedValueOnce([]);

      const results = await imageValidationService.batchValidateImages(photos);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle partial failures in batch validation', async () => {
      const photos = [
        { id: 'photo-1', report_id: 'report-1', fleet_id: 'fleet-1', file_key: 'image1.jpg' },
        { id: 'photo-2', report_id: 'report-1', fleet_id: 'fleet-1', file_key: 'image2.jpg' },
      ];

      sequelize.query
        .mockResolvedValueOnce([[{ id: 'validation-1' }]])
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Validation failed'));

      const results = await imageValidationService.batchValidateImages(photos);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Validation failed');
    });
  });

  describe('getValidationResults', () => {
    it('should retrieve validation results for a photo', async () => {
      const photoId = 'photo-uuid';
      const mockResults = {
        id: 'validation-uuid',
        photo_id: photoId,
        validation_status: 'valid',
        is_vehicle_damage_detected: true,
      };

      sequelize.query.mockResolvedValueOnce([[mockResults]]);

      const results = await imageValidationService.getValidationResults(photoId);

      expect(results).toEqual(mockResults);
      expect(sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM image_validations'),
        expect.any(Object)
      );
    });

    it('should return null if no validation results found', async () => {
      const photoId = 'photo-uuid';

      sequelize.query.mockResolvedValueOnce([[]]);

      const results = await imageValidationService.getValidationResults(photoId);

      expect(results).toBeNull();
    });
  });

  describe('approveManualReview', () => {
    it('should approve a manual review', async () => {
      const validationId = 'validation-uuid';
      const reviewerId = 'reviewer-uuid';
      const notes = 'Damage clearly visible';

      sequelize.query.mockResolvedValueOnce([]);

      await imageValidationService.approveManualReview(validationId, reviewerId, notes);

      expect(sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining("validation_status = 'valid'"),
        expect.objectContaining({
          replacements: expect.objectContaining({
            validation_id: validationId,
            reviewer_id: reviewerId,
            notes,
          }),
        })
      );
    });
  });

  describe('rejectManualReview', () => {
    it('should reject a manual review', async () => {
      const validationId = 'validation-uuid';
      const reviewerId = 'reviewer-uuid';
      const reason = 'Photo too blurry';

      sequelize.query.mockResolvedValueOnce([]);

      await imageValidationService.rejectManualReview(validationId, reviewerId, reason);

      expect(sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining("validation_status = 'invalid'"),
        expect.objectContaining({
          replacements: expect.objectContaining({
            validation_id: validationId,
            reviewer_id: reviewerId,
            reason,
          }),
        })
      );
    });
  });
});
