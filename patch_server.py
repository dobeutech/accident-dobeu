import sys

file_path = "backend/src/server.js"
with open(file_path, "r") as f:
    content = f.read()

old_listen = """httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Process ID: ${process.pid}`);

  // Send ready signal to PM2
  if (process.send) {
    process.send('ready');
  }
});"""

new_listen = """if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Process ID: ${process.pid}`);

    // Send ready signal to PM2
    if (process.send) {
      process.send('ready');
    }
  });
}"""

content = content.replace(old_listen, new_listen)

with open(file_path, "w") as f:
    f.write(content)

print("server.js Patched successfully")
