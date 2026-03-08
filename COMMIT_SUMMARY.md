# 🧪 Add tests for mobile syncService retry logic

## 🎯 What
Added missing unit tests for `mobile/src/services/syncService.js` focusing on the `syncAll` method's retry and error handling logic. Since testing this functionality requires mocking SQLite and network requests in a React Native context, the necessary Jest setup files and mocks were also added.

## 📊 Coverage
The new tests now cover the following scenarios in `syncAll`:
- **Happy Path:** Successfully processes pending items, calls the correct service methods, and updates the status to `'completed'`.
- **First/Second Failure:** Correctly increments `retry_count`, keeps the status as `'pending'`, and logs the error message when a sync operation fails.
- **Max Retries Reached:** Correctly marks the item status as `'failed'` when the `retry_count` reaches the maximum threshold of 3.
- **Undefined Retry Count:** Safely handles cases where `retry_count` is initially undefined, treating it as 0.

## ✨ Result
Increased test coverage and confidence in the offline-first synchronization process. By thoroughly mocking the SQLite database operations (`getDatabase()`) and external API calls (`reportService`, `uploadService`), these tests ensure the retry mechanism works deterministically without relying on actual device storage or network requests.
