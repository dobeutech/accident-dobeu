const fs = require('fs');

const authFilePath = 'backend/src/__tests__/auth.test.js';
let authContent = fs.readFileSync(authFilePath, 'utf8');

authContent = authContent.replace(
  "jest.mock('../database/connection', () => ({\n  sequelize: {\n    query: jest.fn().mockResolvedValue([[]]),\n    QueryTypes: { SELECT: 'SELECT', INSERT: 'INSERT', UPDATE: 'UPDATE' },\n  },\n}));",
  "jest.mock('../database/connection', () => ({\n  sequelize: {\n    query: jest.fn().mockResolvedValue([[]]),\n    QueryTypes: { SELECT: 'SELECT', INSERT: 'INSERT', UPDATE: 'UPDATE' },\n    authenticate: jest.fn().mockResolvedValue(),\n    close: jest.fn().mockResolvedValue(),\n  },\n}));"
);

fs.writeFileSync(authFilePath, authContent);

const healthFilePath = 'backend/src/__tests__/health.test.js';
let healthContent = fs.readFileSync(healthFilePath, 'utf8');

healthContent = healthContent.replace(
  "jest.mock('../database/connection', () => ({\n  sequelize: {\n    query: jest.fn().mockResolvedValue([[]]),\n    QueryTypes: { SELECT: 'SELECT', INSERT: 'INSERT', UPDATE: 'UPDATE' },\n    authenticate: jest.fn().mockResolvedValue(),\n  },\n}));",
  "jest.mock('../database/connection', () => ({\n  sequelize: {\n    query: jest.fn().mockResolvedValue([[]]),\n    QueryTypes: { SELECT: 'SELECT', INSERT: 'INSERT', UPDATE: 'UPDATE' },\n    authenticate: jest.fn().mockResolvedValue(),\n    close: jest.fn().mockResolvedValue(),\n  },\n}));"
);
fs.writeFileSync(healthFilePath, healthContent);
