# Contributing to FleetGuard

Thank you for your interest in contributing to FleetGuard! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Internationalization](#internationalization)
- [Accessibility](#accessibility)

## 📜 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report unacceptable behavior to the project maintainers

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/fleetguard.git`
3. Add upstream remote: `git remote add upstream https://github.com/fleetguard/fleetguard.git`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## 💻 Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional, for containerized development)

### Installation

```bash
# Install all dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local

# Run database migrations
npm run migrate

# Start development servers
npm run dev
```

### Using Docker

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

## 📁 Project Structure

```
fleetguard/
├── backend/           # Node.js/Express API
│   ├── src/
│   │   ├── database/  # Migrations and connection
│   │   ├── middleware/# Auth, error handling
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   └── utils/     # Helpers and utilities
│   └── package.json
├── web/               # React web dashboard
│   ├── src/
│   │   ├── components/# Reusable UI components
│   │   ├── lib/       # Utilities, stores, i18n
│   │   ├── pages/     # Page components
│   │   └── types/     # TypeScript definitions
│   └── package.json
├── mobile/            # React Native mobile app
│   ├── src/
│   │   ├── components/# Reusable UI components
│   │   ├── screens/   # Screen components
│   │   ├── stores/    # Zustand stores
│   │   └── services/  # API and sync services
│   └── package.json
└── package.json       # Root workspace configuration
```

## 📝 Coding Standards

### General

- Use TypeScript for new code when possible
- Follow existing code patterns and conventions
- Write self-documenting code with clear naming
- Add comments for complex logic

### Backend (Node.js)

- Use async/await for asynchronous operations
- Wrap async route handlers with `asyncHandler`
- Use the validation utilities for input validation
- Return consistent JSON responses

```javascript
// Good
const { asyncHandler } = require('../middleware/errorHandler');
const { createValidator } = require('../utils/validation');

router.post('/example', asyncHandler(async (req, res) => {
  const validator = createValidator(req);
  validator.field('email').required().email();
  validator.validate();
  
  // ... handle request
  
  res.json({ success: true, data: result });
}));
```

### Web (React/TypeScript)

- Use functional components with hooks
- Use Zustand for state management
- Use the `useI18n` hook for all user-facing text
- Apply dark mode classes consistently

```tsx
// Good
import { useI18n } from '../lib/i18n';

function MyComponent() {
  const { t } = useI18n();
  
  return (
    <div className="bg-white dark:bg-slate-800">
      <h1>{t('component.title')}</h1>
    </div>
  );
}
```

### Mobile (React Native/TypeScript)

- Use the `useI18n` hook for translations
- Include accessibility props on interactive elements
- Maintain minimum touch target sizes (44x44 points)

```tsx
// Good
import { useI18n } from '../lib/i18n';

function MyButton() {
  const { t } = useI18n();
  
  return (
    <TouchableOpacity
      style={{ minHeight: 44, minWidth: 44 }}
      accessibilityRole="button"
      accessibilityLabel={t('button.submit')}
    >
      <Text>{t('button.submit')}</Text>
    </TouchableOpacity>
  );
}
```

## 💾 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(web): add language selector to dashboard header
fix(backend): resolve SQL injection vulnerability in reports query
docs: update installation instructions in README
refactor(mobile): simplify report submission flow
```

## 🔀 Pull Request Process

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**
   ```bash
   npm run lint
   npm run type-check
   ```

3. **Create the PR**
   - Use a clear, descriptive title
   - Fill out the PR template completely
   - Link related issues
   - Add screenshots for UI changes

4. **Review process**
   - Address reviewer feedback promptly
   - Keep the PR focused on a single concern
   - Squash commits if requested

## 🌍 Internationalization (i18n)

All user-facing text must support English, Spanish, and French.

### Adding new translations

1. Add keys to translation files:
   - Web: `web/src/lib/i18n/index.ts`
   - Mobile: `mobile/src/lib/i18n.ts`

2. Use consistent key naming:
   ```
   section.subsection.element
   ```

3. Example:
   ```typescript
   // In translations
   'dashboard.reports.title': 'Recent Reports',
   'dashboard.reports.title': 'Reportes Recientes',  // es
   'dashboard.reports.title': 'Rapports Récents',    // fr
   ```

## ♿ Accessibility

FleetGuard targets WCAG 2.1 AA compliance.

### Requirements

- All images must have alt text
- Form fields must have labels
- Color contrast ratio must be at least 4.5:1
- Interactive elements must be keyboard accessible
- Touch targets must be at least 44x44 points

### Testing

- Test with keyboard navigation
- Test with screen readers (VoiceOver, TalkBack)
- Use browser accessibility tools
- Check color contrast ratios

## 🐛 Reporting Issues

- Check if the issue already exists
- Use the issue template
- Include reproduction steps
- Add screenshots/logs when relevant

## 📞 Getting Help

- Check the [README](README.md) for documentation
- Review the [API documentation](backend/API.md)
- Open a discussion for questions

---

Thank you for contributing to FleetGuard! 🚀
