import sys

file_path = "backend/src/__tests__/auth.test.js"
with open(file_path, "r") as f:
    content = f.read()

old_loop = """      // Make 6 failed attempts (limit is 5)
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(credentials);
      }"""

new_loop = """      // Make 6 failed attempts (limit is 5)
      await Promise.all(
        Array.from({ length: 6 }).map(() =>
          request(app)
            .post('/api/auth/login')
            .send(credentials)
        )
      );"""

content = content.replace(old_loop, new_loop)

with open(file_path, "w") as f:
    f.write(content)

print("auth.test.js Patched successfully")
