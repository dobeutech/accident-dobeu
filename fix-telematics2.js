const fs = require('fs');

const filePath = 'backend/src/__tests__/services/telematicsService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "jest.mock('../../database/connection');",
  "jest.mock('../../database/connection');\nconst originalDecrypt = telematicsService.decrypt;\ntelematicsService.decrypt = jest.fn().mockReturnValue('mock_decrypted_key');"
);

// We want to restore decrypt for the encryption test block
content = content.replace(
  "describe('Encryption/Decryption', () => {",
  "describe('Encryption/Decryption', () => {\n    beforeEach(() => { telematicsService.decrypt = originalDecrypt.bind(telematicsService); });\n    afterAll(() => { telematicsService.decrypt = jest.fn().mockReturnValue('mock_decrypted_key'); });"
);

// The test 'should throw error if kill switch not enabled' failed because we mocked kill_switch_enabled to true.
// Let's replace the kill_switch_enabled: true with false specifically for that test block.
// Let's find it.
