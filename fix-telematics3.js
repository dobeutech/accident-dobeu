const fs = require('fs');

const telematicsService = require('./backend/src/services/telematicsService.js');
const validEncrypted = telematicsService.encrypt('mock_decrypted_key');

const filePath = 'backend/src/__tests__/services/telematicsService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /api_key_encrypted: '.*',/g,
  `api_key_encrypted: '${validEncrypted}',`
);

fs.writeFileSync(filePath, content);
