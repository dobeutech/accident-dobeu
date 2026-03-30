const fs = require('fs');

const filePath = 'backend/src/server.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "httpServer.listen(PORT, () => {",
  "if (process.env.NODE_ENV !== 'test') {\n  httpServer.listen(PORT, () => {"
);

content = content.replace(
  "  logger.info(`Server initialized and running successfully`);\n});\n\nmodule.exports = { app, httpServer };",
  "    logger.info(`Server initialized and running successfully`);\n  });\n}\n\nmodule.exports = { app, httpServer };"
);

fs.writeFileSync(filePath, content);
