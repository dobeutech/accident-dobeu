const fs = require('fs');

const filePath = 'backend/src/__tests__/services/imageValidationService.test.js';
let content = fs.readFileSync(filePath, 'utf8');

// Ensure that processValidationResults and validateImage are working in batch
content = content.replace(
  "        .mockResolvedValueOnce([[{ id: 'validation-1' }]])",
  "        .mockResolvedValueOnce([[{ id: 'validation-1' }]])"
);

// We should also replace the sequelize mock because validateImage uses TWO queries (INSERT and UPDATE)
// So for two photos, it needs FOUR queries mocked.
content = content.replace(
  "      sequelize.query\n        .mockResolvedValueOnce([[{ id: 'validation-1' }]])\n        .mockResolvedValueOnce([])\n        .mockResolvedValueOnce([[{ id: 'validation-2' }]])\n        .mockResolvedValueOnce([]);",
  `      sequelize.query = jest.fn()
        .mockResolvedValueOnce([[{ id: 'validation-1' }]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([[{ id: 'validation-2' }]])
        .mockResolvedValueOnce([]);`
);

content = content.replace(
  "      sequelize.query\n        .mockResolvedValueOnce([[{ id: 'validation-1' }]])\n        .mockResolvedValueOnce([])\n        .mockRejectedValueOnce(new Error('Validation failed'));",
  `      sequelize.query = jest.fn()
        .mockResolvedValueOnce([[{ id: 'validation-1' }]])
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Validation failed'));`
);

fs.writeFileSync(filePath, content);
