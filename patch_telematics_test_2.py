import sys

file_path = "backend/src/__tests__/services/telematicsService.test.js"
with open(file_path, "r") as f:
    content = f.read()

# Fix mock for 'should throw error if kill switch not enabled'
# Instead of returning [[mockVehicle]], it should return [[]] because the query filters out vehicles without kill switch enabled
old_block = """      const mockVehicle = {
        id: vehicleId,
        kill_switch_enabled: false,
      };

      sequelize.query.mockResolvedValueOnce([[mockVehicle]]);"""

new_block = """      const mockVehicle = {
        id: vehicleId,
        kill_switch_enabled: false,
      };

      // Query returns empty array if kill_switch_enabled is false in the actual DB query
      sequelize.query.mockResolvedValueOnce([[]]);"""

content = content.replace(old_block, new_block)

with open(file_path, "w") as f:
    f.write(content)

print("telematicsService.test.js Patched successfully 2")
