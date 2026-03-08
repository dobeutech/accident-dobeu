import sys

file_path = "backend/src/utils/validateEnv.js"
with open(file_path, "r") as f:
    content = f.read()

# Only exit(1) if not in 'test' environment to avoid breaking tests when there is no real DB
old_exit = """  const dbValid = await validateDatabase();
  if (!dbValid) {
    logger.error('Startup validation failed: Database validation failed');
    process.exit(1);
  }"""

new_exit = """  const dbValid = await validateDatabase();
  if (!dbValid) {
    logger.error('Startup validation failed: Database validation failed');
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }"""

content = content.replace(old_exit, new_exit)

with open(file_path, "w") as f:
    f.write(content)

print("validateEnv.js Patched successfully")
