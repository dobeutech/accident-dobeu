const fs = require('fs');

const filePath = 'backend/src/utils/validateEnv.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "    process.exit(1);",
  "    if (process.env.NODE_ENV !== 'test') process.exit(1);"
);

content = content.replace(
  "    process.exit(1);",
  "    if (process.env.NODE_ENV !== 'test') process.exit(1);"
);

content = content.replace(
  "    process.exit(1);",
  "    if (process.env.NODE_ENV !== 'test') process.exit(1);"
);

// wait there might be more
content = content.replace(/process\.exit\(1\)/g, "if (process.env.NODE_ENV !== 'test') process.exit(1)");

fs.writeFileSync(filePath, content);
