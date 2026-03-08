import sys

file_path = "backend/src/__tests__/services/imageValidationService.test.js"
with open(file_path, "r") as f:
    content = f.read()

# Make the tests correctly use the aws-sdk mock.
# In beforeEach, the code defines mockRekognition manually but doesn't inject it into the aws-sdk mock
# We should instead have imageValidationService use the mockRekognition defined here, OR mock it such that AWS.Rekognition instances use this.

patch1 = """// Mock AWS SDK
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

patch2 = """// Mock AWS SDK
jest.mock('aws-sdk');"""

content = content.replace(patch1, patch2)

old_before_each = """  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Rekognition
    mockRekognition = {"""

new_before_each = """  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Rekognition
    mockRekognition = {"""

content = content.replace(old_before_each, new_before_each)

with open(file_path, "w") as f:
    f.write(content)

print("imageValidationService.test.js Patched successfully 3")
