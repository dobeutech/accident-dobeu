const fs = require('fs');

const filePath = 'backend/src/__tests__/services/telematicsService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// Mock telematicsService.decrypt to return 'mock_decrypted_key'
content = content.replace(
  "jest.mock('axios');",
  "jest.mock('axios');\ntelematicsService.decrypt = jest.fn().mockReturnValue('mock_decrypted_key');"
);

// We need to fix the test where kill_switch_enabled is false, but it somehow passes?
// Let's check "should throw error if kill switch not enabled"
content = content.replace(
  "kill_switch_enabled: true,",
  "kill_switch_enabled: false,"
);

// Wait, doing simple string replace on "kill_switch_enabled: true" will replace all of them.
// Let's do it in a smarter way.
