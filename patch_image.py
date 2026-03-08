import sys

file_path = "backend/src/__tests__/services/imageValidationService.test.js"
with open(file_path, "r") as f:
    content = f.read()

old_mock_aws = """// Mock AWS SDK
jest.mock('aws-sdk');"""

new_mock_aws = """// Mock AWS SDK
jest.mock('aws-sdk', () => {
  const mRekognition = {
    detectLabels: jest.fn(),
    detectText: jest.fn(),
    detectModerationLabels: jest.fn(),
    detectFaces: jest.fn(),
  };
  const mS3 = {
    headObject: jest.fn(),
  };
  return {
    Rekognition: jest.fn(() => mRekognition),
    S3: jest.fn(() => mS3),
  };
});"""

content = content.replace(old_mock_aws, new_mock_aws)

with open(file_path, "w") as f:
    f.write(content)

print("imageValidationService.test.js Patched successfully")
