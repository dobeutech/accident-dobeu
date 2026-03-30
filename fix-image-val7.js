const fs = require('fs');

const filePath = 'backend/src/__tests__/services/imageValidationService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// In batchValidateImages tests, the mock Rekognition method might be returning the mocked promise ONLY ONCE
// Let's ensure it's mocked to always return a valid promise
// Wait! I spyOn inside describe('validateImage') beforeEach, which doesn't apply to describe('batchValidateImages')!
content = content.replace(
  "describe('batchValidateImages', () => {",
  `describe('batchValidateImages', () => {
    beforeEach(() => {
      jest.spyOn(imageValidationService, 'detectLabels').mockResolvedValue({ vehicleDamageDetected: true, vehicleDamage: true, severity: 'moderate', labels: [] });
      jest.spyOn(imageValidationService, 'detectText').mockResolvedValue({ hasLicensePlate: true, licensePlates: ['ABC1234'] });
      jest.spyOn(imageValidationService, 'detectModerationLabels').mockResolvedValue({ isAppropriate: true, flaggedLabels: [] });
      jest.spyOn(imageValidationService, 'detectFaces').mockResolvedValue({ hasFaces: false, faceCount: 0 });
      jest.spyOn(imageValidationService, 'checkImageQuality').mockResolvedValue({ isGoodQuality: true, issues: [] });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });`
);

fs.writeFileSync(filePath, content);
