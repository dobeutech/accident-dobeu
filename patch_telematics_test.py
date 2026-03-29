import sys

file_path = "backend/src/__tests__/services/telematicsService.test.js"
with open(file_path, "r") as f:
    content = f.read()

# Replace 'encrypted_key' with a proper mocked encrypted key
content = content.replace("'encrypted_key'", "telematicsService.encrypt('test-api-key')")

with open(file_path, "w") as f:
    f.write(content)

print("telematicsService.test.js Patched successfully")
