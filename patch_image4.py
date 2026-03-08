import sys

file_path = "backend/src/__tests__/services/imageValidationService.test.js"
with open(file_path, "r") as f:
    content = f.read()

# For batchValidateImages to work correctly, each validateImage call requires 3 db calls in the service if successful:
# 1. INSERT INTO image_validations (returns [validationRecord])
# 2. UPDATE image_validations (in updateValidationRecord)
# 3. UPDATE photos (in updatePhotoValidationStatus)
# So each mockResolvedValue needs to account for this.

old_block1 = """      sequelize.query
        .mockResolvedValueOnce([[{ id: 'validation-1' }]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([[{ id: 'validation-2' }]])
        .mockResolvedValueOnce([]);"""

new_block1 = """      sequelize.query
        .mockResolvedValueOnce([[{ id: 'validation-1' }]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([[{ id: 'validation-2' }]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);"""

old_block2 = """      sequelize.query
        .mockResolvedValueOnce([[{ id: 'validation-1' }]])
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Validation failed'));"""

new_block2 = """      sequelize.query
        .mockResolvedValueOnce([[{ id: 'validation-1' }]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Validation failed'));"""

content = content.replace(old_block1, new_block1)
content = content.replace(old_block2, new_block2)

with open(file_path, "w") as f:
    f.write(content)

print("imageValidationService.test.js Patched successfully 5")
