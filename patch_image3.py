import sys

file_path = "backend/src/__tests__/services/imageValidationService.test.js"
with open(file_path, "r") as f:
    content = f.read()

# Instead of relying on the AWS mock from AWS.Rekognition construction, just swap out the instance
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

# Replace where mockRekognition is assigned, add imageValidationService.rekognition = mockRekognition
old_rekog_setup = """      detectFaces: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          FaceDetails: [],
        }),
      }),
    };"""

new_rekog_setup = """      detectFaces: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
          FaceDetails: [],
        }),
      }),
    };

    imageValidationService.rekognition = mockRekognition;
"""

content = content.replace(old_rekog_setup, new_rekog_setup)

with open(file_path, "w") as f:
    f.write(content)

print("imageValidationService.test.js Patched successfully 4")
