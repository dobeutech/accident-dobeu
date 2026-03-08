const fs = require('fs');

const filePath = 'backend/src/__tests__/services/telematicsService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "sequelize.query.mockResolvedValueOnce([[mockVehicle]]);",
  "sequelize.query.mockResolvedValueOnce([[]]); // Return empty array to simulate kill_switch_enabled = false"
);

fs.writeFileSync(filePath, content);
