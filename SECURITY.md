# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Email security concerns to: security@fleetguard.app
3. Include detailed information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Resolution Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2-4 weeks
  - Low: Next release cycle

### Security Measures

FleetGuard implements the following security measures:

#### Authentication & Authorization
- JWT-based authentication with secure token handling
- Role-based access control (RBAC)
- Multi-tenant data isolation via PostgreSQL RLS
- Rate limiting on authentication endpoints

#### Data Protection
- All data encrypted in transit (TLS 1.3)
- Database credentials stored securely
- Sensitive configuration via environment variables
- No sensitive data in logs

#### API Security
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- XSS protection via content security policies
- CORS configuration for authorized origins

#### Infrastructure
- Security headers (X-Frame-Options, CSP, etc.)
- Regular dependency updates
- Container security best practices
- Principle of least privilege

### Security Best Practices for Users

1. Use strong, unique passwords
2. Keep JWT tokens secure; don't share or expose them
3. Report suspicious activity immediately
4. Keep the application updated to the latest version

## Disclosure Policy

We follow responsible disclosure:

1. Reporter submits vulnerability privately
2. We acknowledge and investigate
3. We develop and test a fix
4. We release the fix and notify affected users
5. After 90 days (or fix release), public disclosure may occur

Thank you for helping keep FleetGuard secure!
