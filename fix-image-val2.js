const fs = require('fs');

const filePath = 'backend/src/__tests__/services/imageValidationService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "jest.spyOn(imageValidationService, 'detectLabels').mockResolvedValue({ vehicleDamage: true, severity: 'moderate' });",
  "jest.spyOn(imageValidationService, 'detectLabels').mockResolvedValue({ vehicleDamageDetected: true, vehicleDamage: true, severity: 'moderate', labels: [] });"
);

fs.writeFileSync(filePath, content);
