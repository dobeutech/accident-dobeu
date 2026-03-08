import sys

file_path = "backend/src/middleware/performanceMonitoring.js"
with open(file_path, "r") as f:
    content = f.read()

# [WARNING] File: backend/src/middleware/performanceMonitoring.js, Line: 23
# Message: Unexpected unnamed function
content = content.replace("function (req, res, next)", "function monitorPerformance(req, res, next)")

with open(file_path, "w") as f:
    f.write(content)

print("performanceMonitoring Patched successfully")
