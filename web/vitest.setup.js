// vitest.setup.js
import { vi } from 'vitest';

// Mock DOMPurify as it's not fully supported in pure jsdom environment
vi.mock('dompurify', () => {
  return {
    default: {
      sanitize: (str) => {
        // Better implementation for testing, removes tags AND content for scripts
        let processed = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // Remove remaining HTML tags
        return processed.replace(/<[^>]+>/g, '');
      }
    }
  };
});
