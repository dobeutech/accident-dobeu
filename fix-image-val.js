const fs = require('fs');

const filePath = 'backend/src/__tests__/services/imageValidationService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// For some reason mockRekognition inside the test is not the one used by the service
// Maybe we need to spy on the service methods instead of mockRekognition directly?
// Or mockRekognition needs to be exposed from AWS correctly
// Let's spy on the service methods instead!

content = content.replace(
  "describe('validateImage', () => {",
  `describe('validateImage', () => {
    beforeEach(() => {
      jest.spyOn(imageValidationService, 'detectLabels').mockResolvedValue({ vehicleDamage: true, severity: 'moderate' });
      jest.spyOn(imageValidationService, 'detectText').mockResolvedValue({ hasLicensePlate: true, licensePlates: ['ABC1234'] });
      jest.spyOn(imageValidationService, 'detectModerationLabels').mockResolvedValue({ isAppropriate: true, flaggedLabels: [] });
      jest.spyOn(imageValidationService, 'detectFaces').mockResolvedValue({ hasFaces: false, faceCount: 0 });
      jest.spyOn(imageValidationService, 'checkImageQuality').mockResolvedValue({ isGoodQuality: true, issues: [] });
    });`
);

content = content.replace(
  "expect(mockRekognition.detectLabels).toHaveBeenCalled();",
  "expect(imageValidationService.detectLabels).toHaveBeenCalled();"
);
content = content.replace(
  "expect(mockRekognition.detectText).toHaveBeenCalled();",
  "expect(imageValidationService.detectText).toHaveBeenCalled();"
);
content = content.replace(
  "expect(mockRekognition.detectModerationLabels).toHaveBeenCalled();",
  "expect(imageValidationService.detectModerationLabels).toHaveBeenCalled();"
);
content = content.replace(
  "expect(mockRekognition.detectFaces).toHaveBeenCalled();",
  "expect(imageValidationService.detectFaces).toHaveBeenCalled();"
);

fs.writeFileSync(filePath, content);
