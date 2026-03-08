const fs = require('fs');

const filePath = 'backend/src/__tests__/services/imageValidationService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// I should mock validateImage instead of internal methods for batchValidateImages tests!
content = content.replace(
  "  describe('batchValidateImages', () => {\n    beforeEach(() => {\n      jest.spyOn(imageValidationService, 'detectLabels').mockResolvedValue({ vehicleDamageDetected: true, vehicleDamage: true, severity: 'moderate', labels: [] });\n      jest.spyOn(imageValidationService, 'detectText').mockResolvedValue({ hasLicensePlate: true, licensePlates: ['ABC1234'] });\n      jest.spyOn(imageValidationService, 'detectModerationLabels').mockResolvedValue({ isAppropriate: true, flaggedLabels: [] });\n      jest.spyOn(imageValidationService, 'detectFaces').mockResolvedValue({ hasFaces: false, faceCount: 0 });\n      jest.spyOn(imageValidationService, 'checkImageQuality').mockResolvedValue({ isGoodQuality: true, issues: [] });\n    });",
  `  describe('batchValidateImages', () => {\n    beforeEach(() => {\n      jest.spyOn(imageValidationService, 'validateImage').mockResolvedValue({ validationId: 'test-id', status: 'valid' });\n    });`
);

content = content.replace(
  "      sequelize.query = jest.fn()\n        .mockResolvedValueOnce([[{ id: 'validation-1' }]])\n        .mockResolvedValueOnce([])\n        .mockRejectedValueOnce(new Error('Validation failed'));",
  "      jest.spyOn(imageValidationService, 'validateImage')\n        .mockResolvedValueOnce({ validationId: 'test-id', status: 'valid' })\n        .mockRejectedValueOnce(new Error('Validation failed'));"
);

fs.writeFileSync(filePath, content);
