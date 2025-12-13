# Fleet Accident Reporting System

A comprehensive fleet accident reporting system with React Native mobile apps (iOS/Android) for drivers, a web dashboard for fleet managers, and a super admin backend. Includes offline support, customizable forms, multi-tenancy security, and comprehensive export capabilities.

## Features

### Mobile App (React Native)
- Offline-first architecture with sync queue
- Guided step-by-step accident reporting flow
- GPS location capture
- Photo and audio recording
- Dynamic form fields based on fleet configuration
- Multi-language support (English, Spanish, extensible)
- Real-time photo transmission to manager dashboard

### Web Dashboard
- Real-time report viewing and management
- Live photo monitoring as drivers capture them
- Comprehensive export capabilities (PDF, DOCX, XLSX, CSV, XML, JSON, ZIP)
- Custom form builder for fleet-specific fields
- Multi-user permission management
- Analytics and reporting dashboard

### Backend
- Node.js/Express REST API
- PostgreSQL with Row-Level Security (RLS) for multi-tenancy
- JWT authentication with role-based access control
- WebSocket support for real-time features
- AWS S3 integration for file storage
- Comprehensive export service

### Security
- Row-Level Security (RLS) for data isolation between fleets
- Fleet context enforcement middleware
- Role-based permissions (Super Admin, Fleet Admin, Fleet Manager, Fleet Viewer, Driver)
- Encrypted data in transit and at rest
- Secure file storage with signed URLs

## Project Structure

```
accident-app/
├── mobile/                 # React Native app
├── web/                    # React web dashboard
├── backend/                # Node.js backend
└── shared/                 # Shared types/utilities
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- AWS S3 account (for file storage)
- React Native development environment (for mobile app)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
   - Database credentials
   - JWT secret
   - AWS S3 credentials
   - CORS origins

5. Run database migrations:
```bash
npm run migrate
```

6. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

- `GET /api/fleets` - Get all fleets (super admin)
- `POST /api/fleets` - Create fleet (super admin)
- `GET /api/fleets/:id` - Get fleet details
- `PUT /api/fleets/:id` - Update fleet
- `DELETE /api/fleets/:id` - Delete fleet (super admin)

- `GET /api/users` - Get users in fleet
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

- `GET /api/reports` - Get reports
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get report details
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

- `GET /api/form-configs` - Get form configurations
- `POST /api/form-configs` - Create form field
- `PUT /api/form-configs/:id` - Update form field
- `DELETE /api/form-configs/:id` - Delete form field

- `GET /api/exports/reports?format=pdf&report_ids=...` - Export reports

- `GET /api/admin/stats` - Platform statistics (super admin)
- `GET /api/admin/users` - All users (super admin)
- `GET /api/admin/audit-logs` - Audit logs (super admin)

## Technology Stack

- **Backend**: Node.js, Express.js, PostgreSQL, Sequelize
- **Mobile**: React Native, Expo
- **Web**: React, TypeScript
- **Real-time**: Socket.io
- **File Storage**: AWS S3
- **Authentication**: JWT
- **Export**: PDFKit, ExcelJS, custom XML/JSON generators

## License

ISC

