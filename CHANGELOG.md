# Changelog

## [Unreleased] - 2024-12-14

### 🔒 Security

#### Critical (P0)
- **FIXED:** XSS vulnerability from localStorage token storage - migrated to httpOnly cookies
- **FIXED:** Missing CSRF protection - added csurf middleware and token validation
- **FIXED:** Input sanitization missing - added DOMPurify for all user inputs
- **FIXED:** SQL injection in session variables - replaced string interpolation with parameterized queries

#### High (P1)
- **FIXED:** Unvalidated redirect after 401 - now stores and validates redirect paths
- **FIXED:** Socket authentication race condition - improved initialization and error handling

### 🐛 Bug Fixes

#### High Priority (P1)
- **FIXED:** Missing error boundary - app no longer crashes completely on React errors
- **FIXED:** Unsafe date handling - added validation and fallback for invalid dates
- **FIXED:** Missing loading states - prevents double login submissions

#### Medium Priority (P2)
- **FIXED:** Memory leak in export function - blob URLs now properly revoked
- **FIXED:** Unhandled promise rejections in auth flow - improved error handling

### ⚡ Performance

- **IMPROVED:** Query caching configuration - reduced unnecessary API calls
- **IMPROVED:** Added pagination to reports list - limits to 50 results per page
- **IMPROVED:** Optimized React Query with staleTime and cacheTime settings

### 🎨 Code Quality

- **IMPROVED:** Centralized constants - removed magic strings and numbers
- **IMPROVED:** Added input validation helpers
- **IMPROVED:** Created date formatting utilities
- **IMPROVED:** Consistent error handling patterns

### 📦 Dependencies

#### Backend
- Added `cookie-parser@^1.4.6` - Cookie parsing middleware
- Added `csurf@^1.11.0` - CSRF protection

#### Frontend
- Added `dompurify@^3.0.6` - XSS protection via HTML sanitization

### 📝 Documentation

- Added `SECURITY_FIXES.md` - Comprehensive security fix documentation
- Added code annotations for all major fixes
- Improved inline comments for security-critical code

### 🔄 Breaking Changes

- **Web Dashboard:** Now requires cookies to be enabled (httpOnly cookies for auth)
- **Session Persistence:** Existing users will need to log in again after update
- **Mobile Apps:** No changes - continue using Bearer token authentication

### 🧪 Testing

- Added error boundary component with development error details
- Improved error logging throughout application
- Added validation for all user inputs

### 📋 Migration Guide

1. **Update Dependencies:**
   ```bash
   cd backend && npm install
   cd ../web && npm install
   ```

2. **No Database Changes Required**

3. **Environment Variables:** No new variables needed

4. **User Impact:**
   - Users will be logged out and need to log in again
   - Cookies must be enabled in browser
   - Mobile apps unaffected

### 🔮 Future Improvements

- [ ] Add unit tests for new utilities
- [ ] Add integration tests for auth flow
- [ ] Implement rate limiting per user
- [ ] Add 2FA support
- [ ] Implement Content Security Policy
- [ ] Set up error tracking (Sentry)
- [ ] Add automated security scanning

---

## [1.0.0] - 2024-12-14

### Added
- Initial release with web dashboard
- React Native mobile app
- Backend API with PostgreSQL
- Multi-tenancy with RLS
- Real-time features with Socket.io
- Export functionality (PDF, Excel, CSV, XML, JSON)
- Form builder for custom fields
- User management with RBAC
