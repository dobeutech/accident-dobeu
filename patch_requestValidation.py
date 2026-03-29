import sys

file_path = "backend/src/middleware/requestValidation.js"
with open(file_path, "r") as f:
    content = f.read()

# [WARNING] File: backend/src/middleware/requestValidation.js, Line: 202
# Message: Unexpected unnamed function
content = content.replace("function (req, res, next)", "function validateDynamicFields(req, res, next)")

with open(file_path, "w") as f:
    f.write(content)

print("requestValidation Patched successfully")
