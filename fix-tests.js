const fs = require('fs');

// Replace connection string since it's failing to connect to Postgres
// Just mock sequelize query in auth.test.js like the other tests do!
const authFilePath = 'backend/src/__tests__/auth.test.js';
let authContent = fs.readFileSync(authFilePath, 'utf8');

if (!authContent.includes('jest.mock')) {
  authContent = "jest.mock('../database/connection', () => ({\n  sequelize: {\n    query: jest.fn().mockResolvedValue([[]]),\n    QueryTypes: { SELECT: 'SELECT', INSERT: 'INSERT', UPDATE: 'UPDATE' },\n  },\n}));\n" + authContent;
}

fs.writeFileSync(authFilePath, authContent);

const healthFilePath = 'backend/src/__tests__/health.test.js';
let healthContent = fs.readFileSync(healthFilePath, 'utf8');

if (!healthContent.includes('jest.mock')) {
  healthContent = "jest.mock('../database/connection', () => ({\n  sequelize: {\n    query: jest.fn().mockResolvedValue([[]]),\n    QueryTypes: { SELECT: 'SELECT', INSERT: 'INSERT', UPDATE: 'UPDATE' },\n    authenticate: jest.fn().mockResolvedValue(),\n  },\n}));\n" + healthContent;
}
fs.writeFileSync(healthFilePath, healthContent);
