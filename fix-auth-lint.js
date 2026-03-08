const fs = require('fs');

function fixAuthTest() {
  const filePath = 'backend/src/__tests__/auth.test.js';
  let content = fs.readFileSync(filePath, 'utf8');

  // Let's replace the loop to use Promise.all to avoid the no-await-in-loop rule, or just add eslint-disable
  content = content.replace(
    /for \(let i = 0; i < 6; i \+= 1\) {\n\s*\/\/ eslint-disable-next-line no-await-in-loop\n\s*await request\(app\)\n\s*\.post\('\/api\/auth\/login'\)\n\s*\.send\(credentials\);\n\s*}/,
    `await Promise.all(
        Array.from({ length: 6 }).map(() =>
          request(app).post('/api/auth/login').send(credentials)
        )
      );`
  );

  fs.writeFileSync(filePath, content);
}

fixAuthTest();
