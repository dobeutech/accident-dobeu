const fs = require('fs');
const filePath = 'backend/src/__tests__/setup.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "    const jwt = require('jsonwebtoken');\n    return jwt.sign(",
  "    // eslint-disable-next-line global-require\n    const jwt = require('jsonwebtoken');\n    return jwt.sign("
);

fs.writeFileSync(filePath, content);
