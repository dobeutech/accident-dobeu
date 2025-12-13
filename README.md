# FleetGuard Accident Reporter

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0">
  <img src="https://img.shields.io/badge/license-ISC-green.svg" alt="License ISC">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node >= 18.0.0">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

**FleetGuard** is a comprehensive fleet accident and incident reporting system designed for commercial fleets. It enables drivers to document accidents immediately at the scene while providing fleet managers with real-time visibility, customizable forms, and RMIS integration capabilities.

> 🎯 **Purpose**: Walk drivers through collecting all necessary information at the scene of an accident so that a complete, accurate accident report can be filed.

## 🌟 Key Features

### 📱 Mobile App (React Native/Expo)
- **Cross-Platform**: Native iOS and Android support
- **Offline-First**: Full functionality without internet, automatic sync when connected
- **GPS Location**: Automatic capture with reverse geocoding
- **Photo Documentation**: Guided prompts for comprehensive scene capture
- **Voice Recording**: Audio statements for detailed driver accounts
- **Digital Signature**: Legally binding signature capture
- **9-Step Wizard**: Guided workflow ensures complete reports
- **Multi-Language**: English, Spanish, and French support

### 🖥️ Web Dashboard (React + Vite)
- **Real-Time Updates**: Live photo feed and instant notifications via WebSocket
- **Dark/Light/System Themes**: Full theme support with high contrast mode
- **Form Builder**: Drag-and-drop customizable report fields
- **User Management**: Role-based access control for teams
- **Export Center**: PDF, XLSX, CSV, XML, JSON, and ZIP formats
- **RMIS Integration**: Origami Risk, Riskonnect, and custom API support
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation

### ⚙️ Backend (Node.js/Express)
- **PostgreSQL**: Enterprise-grade database with Row-Level Security
- **Multi-Tenancy**: Complete fleet data isolation
- **JWT Authentication**: Secure token-based auth with RBAC
- **WebSocket**: Real-time bidirectional communication
- **AWS S3**: Secure file storage with signed URLs
- **Rate Limiting**: Protection against abuse
- **Audit Logging**: Complete activity trail

## 🔐 Security Architecture

| Layer | Implementation |
|-------|----------------|
| Data Isolation | PostgreSQL Row-Level Security (RLS) |
| Authentication | JWT tokens with refresh capability |
| Authorization | 5-tier role-based access control |
| Transport | TLS 1.3 encryption |
| File Storage | S3 with signed URLs, 15-minute expiry |
| Password | bcrypt with cost factor 12 |
| Rate Limiting | 100 requests per 15-minute window |

### User Roles

| Role | Access Level |
|------|-------------|
| **Super Admin** | Full platform access, manage all fleets |
| **Fleet Admin** | Full fleet access, user management, form configuration |
| **Fleet Manager** | View/edit reports, export data |
| **Fleet Viewer** | Read-only access to reports |
| **Driver** | Create and view own reports only |

## 🌐 Internationalization (i18n)

FleetGuard supports multiple languages out of the box:

| Language | Coverage | Status |
|----------|----------|--------|
| 🇺🇸 English | 100% | Default |
| 🇪🇸 Spanish | 100% | Complete |
| 🇫🇷 French | 100% | Complete |

**Language tracking**: The system tracks which language each user inputs data in while storing standardized English translations in the backend for consistent reporting and RMIS integration.

## 🎨 Theme Support

- **System**: Follows OS preference automatically
- **Light Mode**: Clean, professional appearance
- **Dark Mode**: Reduced eye strain for night use
- **High Contrast**: WCAG AAA compliant for accessibility

## 📁 Project Structure

```
fleetguard/
├── backend/                    # Node.js/Express API Server
│   ├── src/
│   │   ├── database/
│   │   │   ├── connection.js   # PostgreSQL connection pool
│   │   │   ├── migrate.js      # Migration runner
│   │   │   └── migrations/     # SQL migration files
│   │   │       ├── 001_create_tables.sql
│   │   │       ├── 002_create_rls_policies.sql
│   │   │       ├── 003_insert_default_permissions.sql
│   │   │       ├── 004_create_rmis_tables.sql
│   │   │       └── 005_add_language_support.sql
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT & RBAC middleware
│   │   │   ├── fleetContext.js # Fleet context injection
│   │   │   └── socketAuth.js   # WebSocket authentication
│   │   ├── routes/
│   │   │   ├── admin.js        # Admin endpoints
│   │   │   ├── auth.js         # Authentication
│   │   │   ├── exports.js      # Export functionality
│   │   │   ├── fleets.js       # Fleet management
│   │   │   ├── formConfigs.js  # Form builder API
│   │   │   ├── reports.js      # Report CRUD
│   │   │   ├── rmis.js         # RMIS integration
│   │   │   ├── uploads.js      # File uploads
│   │   │   └── users.js        # User management
│   │   ├── services/
│   │   │   ├── exportService.js   # PDF/Excel generation
│   │   │   ├── rmisService.js     # RMIS platform connectors
│   │   │   └── socketService.js   # WebSocket handler
│   │   ├── utils/
│   │   │   ├── jwt.js          # Token utilities
│   │   │   ├── logger.js       # Winston logging
│   │   │   └── password.js     # Password hashing
│   │   └── server.js           # Express app entry
│   ├── .eslintrc.cjs
│   └── package.json
│
├── mobile/                     # React Native/Expo App
│   ├── src/
│   │   ├── config/
│   │   │   └── api.ts          # API endpoints config
│   │   ├── lib/
│   │   │   └── i18n.ts         # Internationalization
│   │   ├── navigation/
│   │   │   └── RootNavigator.tsx
│   │   ├── screens/
│   │   │   ├── auth/           # Login screens
│   │   │   ├── main/           # Dashboard screens
│   │   │   └── wizard/         # 9-step report wizard
│   │   │       └── steps/
│   │   ├── services/
│   │   │   ├── ApiService.ts
│   │   │   ├── LocationService.ts
│   │   │   └── SyncService.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── reportStore.ts
│   │   │   └── syncStore.ts
│   │   ├── theme/
│   │   │   └── colors.ts
│   │   └── types/
│   │       └── index.ts
│   ├── App.tsx
│   ├── app.json
│   └── package.json
│
├── web/                        # React Web Dashboard
│   ├── public/
│   │   └── site.webmanifest    # PWA manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── DashboardLayout.tsx
│   │   │   └── ui/
│   │   │       ├── LanguageSelector.tsx
│   │   │       └── ThemeSelector.tsx
│   │   ├── lib/
│   │   │   ├── api.ts          # Axios client
│   │   │   ├── i18n/           # Translations
│   │   │   ├── socket.ts       # Socket.io client
│   │   │   └── theme.ts        # Theme store
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ExportsPage.tsx
│   │   │   ├── FormBuilderPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ReportDetailPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── UsersPage.tsx
│   │   ├── stores/
│   │   │   └── authStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── index.css           # Tailwind + theme CSS
│   │   └── main.tsx
│   ├── .eslintrc.cjs
│   ├── index.html              # SEO-optimized HTML
│   ├── netlify.toml            # Netlify configuration
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── .gitignore
├── netlify.toml                # Root Netlify config
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **AWS Account** with S3 bucket configured
- **Expo CLI** for mobile development

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure your .env file with:
# - DATABASE_URL
# - JWT_SECRET
# - AWS credentials
# - S3_BUCKET_NAME

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Web Dashboard Setup

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Run linting
npm run lint

# Start development server
npm run dev

# Build for production
npm run build
```

Access the dashboard at `http://localhost:5173`

### Mobile App Setup

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Update API URL in src/config/api.ts

# Start Expo development server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android
```

## ☁️ Deployment

### Netlify (Web Dashboard)

The project includes `netlify.toml` for seamless deployment:

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `web/dist`
4. Add environment variables:
   - `BACKEND_URL`: Your API server URL

### Environment Variables

**Backend (.env)**
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/fleetguard

# Authentication
JWT_SECRET=your-256-bit-secret-key
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=fleetguard-files

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Web Dashboard (Netlify)**
```
BACKEND_URL=https://api.your-domain.com
```

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh token |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | List reports (paginated) |
| POST | `/api/reports` | Create new report |
| GET | `/api/reports/:id` | Get report details |
| PUT | `/api/reports/:id` | Update report |
| PUT | `/api/reports/:id/status` | Update status |
| DELETE | `/api/reports/:id` | Delete report |

### Form Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/form-configs` | Get form fields |
| POST | `/api/form-configs` | Create field |
| PUT | `/api/form-configs/:id` | Update field |
| DELETE | `/api/form-configs/:id` | Delete field |

### RMIS Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rmis/integrations` | List integrations |
| POST | `/api/rmis/integrations` | Configure integration |
| POST | `/api/rmis/integrations/:type/test` | Test connection |
| POST | `/api/rmis/push/:reportId` | Push to RMIS |

## 🔄 Report Wizard Flow

The mobile app guides drivers through a comprehensive 9-step wizard:

| Step | Name | Purpose |
|------|------|---------|
| 1 | **Incident Type** | Classify as Accident, Injury, or Near Miss |
| 2 | **Location** | GPS coordinates + address confirmation |
| 3 | **Photos** | Capture scene with guided prompts |
| 4 | **Your Vehicle** | Vehicle info and damage assessment |
| 5 | **Other Party** | Other driver, vehicle, insurance |
| 6 | **Witnesses** | Contact information for witnesses |
| 7 | **Statement** | Written or voice-recorded statement |
| 8 | **Signature** | Digital signature for authentication |
| 9 | **Review** | Final review before submission |

## 🔌 RMIS Integration

### Supported Platforms

- **Origami Risk** - Enterprise risk management
- **Riskonnect** - Integrated risk management
- **Custom API** - Any REST-compliant system

### Configuration Example

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

## 🆚 Comparison with Axikit

| Feature | FleetGuard | Axikit |
|---------|-----------|--------|
| Mobile Apps | ✅ React Native (iOS/Android) | ✅ Native |
| Offline Support | ✅ Full | ✅ Full |
| Custom Forms | ✅ Full builder UI | ✅ Templates |
| Real-time Photos | ✅ WebSocket live feed | ⚠️ Limited |
| RMIS Integration | ✅ Origami, Riskonnect, Custom | ✅ Pre-built |
| Multi-tenancy | ✅ PostgreSQL RLS | ✅ Proprietary |
| Multi-language | ✅ EN, ES, FR | ⚠️ EN only |
| Dark Mode | ✅ System/Light/Dark | ❌ No |
| Self-hosted | ✅ Yes | ❌ No |
| Export Formats | ✅ 6 formats | ✅ PDF, CSV |
| Open Source | ✅ Yes | ❌ No |
| Accessibility | ✅ WCAG 2.1 AA | ⚠️ Basic |

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express.js, PostgreSQL, Sequelize |
| **Mobile** | React Native, Expo, Zustand, TypeScript |
| **Web** | React, Vite, TailwindCSS, Zustand, React Query |
| **Real-time** | Socket.io |
| **Storage** | AWS S3 |
| **Auth** | JWT, bcrypt |
| **Export** | PDFKit, ExcelJS, Archiver |
| **Deployment** | Netlify (web), Docker (backend) |

## ♿ Accessibility

FleetGuard is committed to accessibility:

- **WCAG 2.1 AA** compliance
- **Keyboard Navigation** for all interactions
- **Screen Reader** compatibility
- **Focus Indicators** visible and clear
- **Color Contrast** minimum 4.5:1 ratio
- **Touch Targets** minimum 44x44 pixels
- **Reduced Motion** support
- **High Contrast Mode** option

## 📄 License

ISC License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run linting (`npm run lint`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

<p align="center">
  <strong>FleetGuard</strong> — Professional Fleet Accident Reporting
  <br>
  <em>Document. Report. Protect.</em>
</p>
