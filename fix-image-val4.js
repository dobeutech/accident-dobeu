const fs = require('fs');

const filePath = 'backend/src/__tests__/services/imageValidationService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// The original file was using `mockRekognition` properly, BUT it wasn't working because
// in `imageValidationService.js` it instantiates `new AWS.Rekognition()` dynamically or locally instead of globally?
// Let's check `imageValidationService.js`.
