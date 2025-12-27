# Fleet Accident Reporting System

## Overview

A production-ready fleet accident reporting system with React Native mobile apps (iOS/Android) for drivers, a React web dashboard for fleet managers, and a Node.js/Express backend. The system enables drivers to report accidents with photos, GPS location, and audio recordings, while fleet managers can monitor reports in real-time and export data in multiple formats.

Key capabilities include:
- Telematics integration with multiple providers (Geotab, Samsara, Verizon Connect)
- Kill switch functionality for automatic vehicle immobilization until reports are complete
- AI-powered image validation using AWS Rekognition
- Workflow management with supervisor override system
- Offline-first mobile architecture with sync queue
- Multi-tenant architecture with Row-Level Security (RLS)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Web Dashboard (React/Vite)**
- Located in `/web`
- Uses React 18 with Vite for bundling
- State management via React Query (@tanstack/react-query)
- Form handling with react-hook-form
- Real-time updates via Socket.io client
- Input sanitization with DOMPurify for XSS protection
- Charts/analytics using Recharts

**Mobile App (React Native/Expo)**
- Located in `/mobile`
- Built with Expo SDK 50
- Offline-first with SQLite local database
- AsyncStorage for persistent data
- Camera, location, and audio recording capabilities
- Multi-language support (i18n-js)

### Backend Architecture

**API Server (Node.js/Express)**
- Located in `/backend`
- RESTful API with JWT authentication
- WebSocket support via Socket.io for real-time features
- PM2 cluster mode for production scaling
- Swagger/OpenAPI documentation at `/api-docs`

**Core Services:**
- `imageValidationService.js` - AWS Rekognition integration for AI image analysis
- `telematicsService.js` - Multi-provider telematics integration with encrypted credentials
- `workflowService.js` - Accident report workflow and progress tracking

**Security Middleware:**
- CSRF protection with custom token generation
- Rate limiting (general API and auth-specific)
- Account lockout after failed login attempts
- Helmet.js for security headers
- httpOnly cookies for JWT storage

### Data Storage

**PostgreSQL Database**
- Row-Level Security (RLS) for multi-tenant data isolation
- Connection pooling via Sequelize
- Key tables: users, fleets, accident_reports, report_photos, vehicles, kill_switch_events, telematics_providers, workflow_completions

**File Storage**
- AWS S3 for photos, audio recordings, and documents
- Signed URLs for secure access

### Authentication & Authorization

- JWT tokens stored in httpOnly cookies (web) or Authorization header (mobile)
- Role-based access control: Super Admin, Fleet Admin, Fleet Manager, Fleet Viewer, Driver
- Fleet context enforcement middleware prevents cross-tenant data access
- Session variables set in PostgreSQL for RLS policy enforcement

### Key Design Patterns

- Environment configuration via dotenv with validation at startup
- Centralized logging with Winston (rotation, security events)
- Graceful shutdown handling for zero-downtime deployments
- Request validation using express-validator
- Standardized error handling with error boundaries (React) and global handlers (Express)

## External Dependencies

### Cloud Services
- **AWS S3** - File storage for photos, audio, documents
- **AWS Rekognition** - AI image analysis for damage detection, OCR, content moderation

### Telematics Providers (Configurable)
- Geotab, Samsara, Verizon Connect, Fleet Complete, Teletrac Navman, or custom providers
- API credentials encrypted with AES-256-CBC

### Database
- **PostgreSQL 14+** - Primary database with RLS enabled
- **Redis** (optional) - Caching and session storage for production

### Monitoring & Observability
- **Prometheus** - Metrics collection (configs in `/monitoring`)
- **Grafana** - Dashboard visualization

### CI/CD
- **GitHub Actions** - Automated testing, security scanning, deployment
- **PM2** - Process management and clustering
- **Docker** - Containerization support

### Development Tools
- ESLint with Airbnb config for code quality
- Prettier for formatting
- Husky for pre-commit hooks
- Jest for testing
- Autocannon for load testing