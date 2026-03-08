const fs = require('fs');

const filePath = 'backend/src/server.js';
let content = fs.readFileSync(filePath, 'utf8');

// There's a missing brace for the if statement!
content = content.replace(
  "if (process.env.NODE_ENV !== 'test') {\n  httpServer.listen(PORT, () => {\n  logger.info(`Server running on port ${PORT}`);\n  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);\n  logger.info(`Process ID: ${process.pid}`);\n  \n  // Send ready signal to PM2\n  if (process.send) {\n    process.send('ready');\n  }\n});",
  "if (process.env.NODE_ENV !== 'test') {\n  httpServer.listen(PORT, () => {\n  logger.info(`Server running on port ${PORT}`);\n  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);\n  logger.info(`Process ID: ${process.pid}`);\n  \n  // Send ready signal to PM2\n  if (process.send) {\n    process.send('ready');\n  }\n});\n}"
);

fs.writeFileSync(filePath, content);
