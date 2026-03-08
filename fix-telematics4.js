const fs = require('fs');

const filePath = 'backend/src/__tests__/services/telematicsService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "kill_switch_enabled: true,",
  "kill_switch_enabled: false,"
);
content = content.replace(
  "kill_switch_enabled: false,",
  "kill_switch_enabled: true,"
);
// Let's use string indexOf to be precise
const target = "it('should throw error if kill switch not enabled', async () => {\n      const vehicleId = 'vehicle-uuid';\n      const reportId = 'report-uuid';\n      const userId = 'user-uuid';\n\n      const mockVehicle = {\n        id: vehicleId,\n        kill_switch_enabled: true,\n      };";
content = content.replace(target, target.replace('kill_switch_enabled: true,', 'kill_switch_enabled: false,'));

// Another approach using regex
content = content.replace(
  /it\('should throw error if kill switch not enabled', async \(\) => \{\s+const vehicleId = 'vehicle-uuid';\s+const reportId = 'report-uuid';\s+const userId = 'user-uuid';\s+const mockVehicle = \{\s+id: vehicleId,\s+kill_switch_enabled: true,/,
  `it('should throw error if kill switch not enabled', async () => {
      const vehicleId = 'vehicle-uuid';
      const reportId = 'report-uuid';
      const userId = 'user-uuid';

      const mockVehicle = {
        id: vehicleId,
        kill_switch_enabled: false,`
);

fs.writeFileSync(filePath, content);
