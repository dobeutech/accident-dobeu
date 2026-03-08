const fs = require('fs');

const filePath = 'backend/src/__tests__/services/imageValidationService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// The original file used AWS mock correctly but the test failed because expect(mockRekognition.detectLabels).toHaveBeenCalled() failed.
// Let's modify the assertion to expect(mockRekognition.detectLabels().promise).toHaveBeenCalled() or similar,
// OR since it's instantiated inside the constructor BEFORE the test runs, the mock is not attached properly!
// Let's re-instantiate or fix the AWS mock correctly.

content = content.replace(
  "const imageValidationService = require('../../services/imageValidationService');",
  "const AWS = require('aws-sdk');\njest.mock('aws-sdk');\nconst imageValidationService = require('../../services/imageValidationService');"
);

content = content.replace(
  "const AWS = require('aws-sdk');\n\n// Mock AWS SDK\njest.mock('aws-sdk');",
  ""
);

// Still might not work because require is cached. Let's just fix the mock assignment in the before each.
content = content.replace(
  "AWS.Rekognition.mockImplementation(() => mockRekognition);",
  "AWS.Rekognition.mockImplementation(() => mockRekognition);\n    imageValidationService.rekognition = mockRekognition;"
);

content = content.replace(
  "AWS.S3.mockImplementation(() => mockS3);",
  "AWS.S3.mockImplementation(() => mockS3);\n    imageValidationService.s3 = mockS3;"
);

// Fix the second issue "TypeError: Cannot read properties of undefined (reading 'length')"
// `labelDetection` comes from `this.detectLabels()`
content = content.replace(
  "{ Name: 'Car', Confidence: 98.5, Categories: [{ Name: 'Vehicle' }], Instances: [] },",
  "{ Name: 'Car', Confidence: 98.5, Instances: [] }," // removed categories, it expects just objects? Wait, why did it say length?
);

// Wait, the error is `if (!labelDetection.vehicleDamageDetected && labelDetection.labels.length > 0) {`
// detectLabels returns:
// { vehicleDamage: false, severity: 'none', labels: labels.map(l => ({ name: l.Name, confidence: l.Confidence })) }
// Ah! In `processValidationResults(labelDetection, textDetection, moderationLabels, faceDetection, qualityCheck)`
// But labelDetection comes from `this.detectLabels(fileKey)` which returns an object that has `vehicleDamage` instead of `vehicleDamageDetected`?!
// Let's check `imageValidationService.js` line 351!

fs.writeFileSync(filePath, content);
