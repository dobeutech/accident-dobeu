const fs = require('fs');
const filePath = 'backend/src/__tests__/auth.test.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "      // Make 6 failed attempts (limit is 5)\n      for (let i = 0; i < 6; i++) {\n        await request(app)\n          .post('/api/auth/login')\n          .send(credentials);\n      }",
  "      // Make 6 failed attempts (limit is 5)\n      // eslint-disable-next-line no-plusplus\n      for (let i = 0; i < 6; i += 1) {\n        // eslint-disable-next-line no-await-in-loop\n        await request(app)\n          .post('/api/auth/login')\n          .send(credentials);\n      }"
);

fs.writeFileSync(filePath, content);
