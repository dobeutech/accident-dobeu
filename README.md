# Fleet Accident Reporting System

A comprehensive fleet accident reporting system with React Native mobile apps (iOS/Android) for drivers, a web dashboard for fleet managers, and a robust backend. Designed to compete with commercial solutions like [Axikit](https://www.axikit.com/).

## 🎯 Purpose

This application enables:
- **Drivers** to document accidents/incidents immediately at the scene using company-issued or personal mobile devices
- **Fleet Managers/Supervisors** to receive real-time reports, review incidents, and export data
- **Integration** with Risk Management Information Systems (RMIS) like Origami Risk

## ✨ Features

### Mobile App (React Native/Expo)
- 📱 Cross-platform iOS and Android support
- 🔄 Offline-first architecture with automatic sync
- 📍 Automatic GPS location capture
- 📷 Photo capture with guided prompts
- 🎙️ Voice recording for driver statements
- ✍️ Digital signature capture
- 🧭 Step-by-step accident reporting wizard
- 🌐 Multi-language support ready

### Web Dashboard (React)
- 📊 Real-time dashboard with live statistics
- 📹 Live photo feed as drivers capture scene photos
- 📝 Form builder for customizable report fields
- 👥 User and driver management
- 📥 Multi-format export (PDF, XLSX, CSV, XML, JSON, ZIP)
- 🔔 Real-time notifications via WebSocket

### Backend (Node.js/Express)
- 🔒 PostgreSQL with Row-Level Security for multi-tenancy
- 🔐 JWT authentication with role-based access control
- 📡 WebSocket support for real-time features
- ☁️ AWS S3 integration for file storage
- 🔄 RMIS integration (Origami Risk, Riskonnect, Custom API)
- 📝 Comprehensive audit logging

### Security
- Row-Level Security (RLS) for complete fleet data isolation
- 5 user roles: Super Admin, Fleet Admin, Fleet Manager, Viewer, Driver
- Encrypted data in transit and at rest
- Secure file storage with signed URLs

## 📁 Project Structure

```
fleet-accident-reporting/
├── backend/                 # Node.js/Express API
│   └── src/
│       ├── database/        # PostgreSQL connection & migrations
│       ├── middleware/      # Auth, RLS, Socket auth
│       ├── routes/          # API endpoints
│       ├── services/        # Business logic (export, RMIS, socket)
│       └── utils/           # JWT, logging, password utilities
├── mobile/                  # React Native/Expo app
│   └── src/
│       ├── config/          # API configuration
│       ├── navigation/      # React Navigation setup
│       ├── screens/         # UI screens & wizard steps
│       ├── services/        # API, Location, Sync services
│       ├── stores/          # Zustand state management
│       ├── theme/           # Colors & styling
│       └── types/           # TypeScript definitions
├── web/                     # React web dashboard
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── lib/             # API client & socket service
│       ├── pages/           # Dashboard pages
│       ├── stores/          # Zustand state management
│       └── types/           # TypeScript definitions
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- AWS S3 account (for file storage)
- React Native development environment (for mobile)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/accident_app

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:8081

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the server:
```bash
npm run dev
```

### Web Dashboard Setup

1. Navigate to web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Mobile App Setup

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Update API URL in `src/config/api.ts`

4. Start Expo:
```bash
npm start
```

5. Run on device/simulator:
```bash
npm run ios     # iOS
npm run android # Android
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Reports
- `GET /api/reports` - Get reports (paginated, filterable)
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get report details
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Form Configuration
- `GET /api/form-configs` - Get form fields
- `POST /api/form-configs` - Create form field
- `PUT /api/form-configs/:id` - Update form field
- `DELETE /api/form-configs/:id` - Delete form field

### File Uploads
- `POST /api/uploads/photos/:reportId` - Upload photo
- `POST /api/uploads/audio/:reportId` - Upload audio
- `GET /api/uploads/signed-url/:fileKey` - Get signed URL

### Exports
- `GET /api/exports/reports?format=pdf&report_ids=...` - Export reports

### RMIS Integration
- `GET /api/rmis/integrations` - Get configured integrations
- `POST /api/rmis/integrations` - Configure integration
- `POST /api/rmis/integrations/:type/test` - Test connection
- `POST /api/rmis/push/:reportId` - Push report to RMIS
- `GET /api/rmis/logs` - Get integration logs

### Administration
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - All users
- `GET /api/admin/audit-logs` - Audit logs

## 🔄 RMIS Integration

### Supported Platforms
- **Origami Risk** - Enterprise risk management platform
- **Riskonnect** - Integrated risk management solution
- **Custom API** - Connect to any REST API

### Configuration Example (Origami Risk)
```json
{
  "integration_type": "origami_risk",
  "config": {
    "baseUrl": "https://api.origamirisk.com",
    "apiKey": "your-api-key",
    "clientId": "your-client-id",
    "autoPush": true
  }
}
```

## 📊 Report Wizard Flow

The mobile app guides drivers through a comprehensive 9-step wizard:

1. **Incident Type** - Accident, Injury/Incident, or Near Miss
2. **Location** - Auto GPS capture + manual address entry
3. **Photos** - Scene photos with guided prompts
4. **Your Vehicle** - Vehicle info and damage assessment
5. **Other Party** - Other driver, vehicle, and insurance info
6. **Witnesses** - Witness contact information
7. **Statement** - Written or audio statement
8. **Signature** - Digital signature capture
9. **Review** - Review and submit

## 🔐 User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| Super Admin | Full platform access, manage all fleets |
| Fleet Admin | Full fleet access, manage users, configure forms |
| Fleet Manager | View/edit reports, export data |
| Fleet Viewer | View reports only |
| Driver | Create/view own reports |

## 🆚 Comparison with Axikit

| Feature | This System | Axikit |
|---------|-------------|--------|
| Mobile Apps | ✅ React Native | ✅ Native |
| Offline Support | ✅ | ✅ |
| Custom Forms | ✅ Full builder | ✅ Templates |
| Real-time Photos | ✅ WebSocket | ⚠️ Limited |
| RMIS Integration | ✅ Origami, Riskonnect | ✅ Pre-built |
| Multi-tenancy | ✅ PostgreSQL RLS | ✅ |
| Self-hosted Option | ✅ | ❌ |
| Export Formats | ✅ 6 formats | ✅ PDF, CSV |
| Open Source | ✅ | ❌ |

## 📦 Technology Stack

- **Backend**: Node.js, Express.js, PostgreSQL, Sequelize
- **Mobile**: React Native, Expo, Zustand
- **Web**: React, Vite, TailwindCSS, Zustand, React Query
- **Real-time**: Socket.io
- **File Storage**: AWS S3
- **Authentication**: JWT
- **Export**: PDFKit, ExcelJS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

ISC License
