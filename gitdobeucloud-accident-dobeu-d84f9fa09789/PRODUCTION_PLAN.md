# Production Deployment Plan

**Project:** Fleet Accident Reporting System
**Current Status:** 95/100 Production Ready
**Date:** December 14, 2024

---

## Overview

This document outlines the concrete steps required to deploy the Fleet Accident Reporting System to production. The codebase is mature with comprehensive security, monitoring, and deployment infrastructure already in place.

---

## Current State Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Backend API | Ready | Node.js/Express, fully secured |
| Web Dashboard | Ready | React/Vite, production build ready |
| Mobile App | Ready | React Native/Expo, requires app store submission |
| Database | Ready | PostgreSQL with RLS, migrations prepared |
| CI/CD Pipeline | Ready | GitHub Actions configured |
| Monitoring | Ready | Prometheus/Grafana configs provided |
| Documentation | Complete | 40+ pages of guides |

---

## Phase 1: Infrastructure Setup (Required First)

### 1.1 Production Server Requirements

**Minimum Specifications:**
- Ubuntu 20.04+ or similar Linux distribution
- 4GB RAM (2GB minimum)
- 2 CPU cores
- 40GB SSD storage
- Static IP address

**Recommended Providers:**
- AWS EC2 (t3.medium or larger)
- DigitalOcean Droplet ($24/mo)
- Google Cloud Compute Engine
- Azure VM

### 1.2 Required External Services

| Service | Purpose | Setup Required |
|---------|---------|----------------|
| PostgreSQL | Database | Create database + user |
| AWS S3 | File storage | Create bucket + IAM user |
| Domain | Web access | Point DNS to server IP |
| SSL Certificate | HTTPS | Let's Encrypt (free) |
| SMTP (optional) | Email notifications | Configure mail provider |

### 1.3 GitHub Secrets to Configure

For CI/CD deployment, add these secrets in GitHub repository settings:

```
PRODUCTION_HOST         # Server IP or hostname
PRODUCTION_USER         # SSH username (e.g., ubuntu)
PRODUCTION_SSH_KEY      # Private SSH key for deployment
PRODUCTION_API_URL      # https://api.yourdomain.com
PRODUCTION_WEB_URL      # https://yourdomain.com
AWS_S3_BUCKET          # S3 bucket name
AWS_ACCESS_KEY_ID      # AWS credentials
AWS_SECRET_ACCESS_KEY  # AWS credentials
AWS_REGION             # e.g., us-east-1
CLOUDFRONT_DISTRIBUTION_ID  # If using CloudFront CDN
```

---

## Phase 2: Server Preparation

### 2.1 Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git nginx postgresql-14 postgresql-contrib

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 process manager
sudo npm install -g pm2

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2.2 Create Application User (Security Best Practice)

```bash
# Create dedicated user
sudo useradd -m -s /bin/bash accidentapp
sudo usermod -aG sudo accidentapp

# Create application directory
sudo mkdir -p /opt/accident-app
sudo chown accidentapp:accidentapp /opt/accident-app
```

### 2.3 Configure Firewall

```bash
# Setup UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Phase 3: Database Setup

### 3.1 Create PostgreSQL Database

```bash
sudo -u postgres psql <<EOF
CREATE DATABASE accident_app;
CREATE USER accident_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE accident_app TO accident_user;
ALTER DATABASE accident_app OWNER TO accident_user;
\c accident_app
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF
```

### 3.2 Configure PostgreSQL for Production

Edit `/etc/postgresql/14/main/postgresql.conf`:
```conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 768MB
work_mem = 4MB
```

Edit `/etc/postgresql/14/main/pg_hba.conf` to allow local connections:
```conf
local   all   accident_user   md5
host    all   accident_user   127.0.0.1/32   md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## Phase 4: Application Deployment

### 4.1 Clone and Configure Backend

```bash
# Switch to app user
sudo su - accidentapp
cd /opt/accident-app

# Clone repository
git clone https://github.com/YOUR_ORG/accident-app.git .

# Install backend dependencies
cd backend
npm ci --production

# Create and configure environment
cp .env.example .env
```

### 4.2 Configure Environment Variables

Edit `/opt/accident-app/backend/.env`:

```bash
# Core Settings
NODE_ENV=production
PORT=3000

# Database (CHANGE THESE)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=accident_app
DB_USER=accident_user
DB_PASSWORD=YOUR_SECURE_PASSWORD

# Authentication (GENERATE NEW SECRETS)
JWT_SECRET=generate_a_64_character_random_string_here
JWT_EXPIRES_IN=24h
SESSION_SECRET=generate_another_64_character_random_string

# Security
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict

# CORS (your domain)
CORS_ORIGIN=https://yourdomain.com

# AWS S3 (CHANGE THESE)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your-bucket-name

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

### 4.3 Run Database Migrations

```bash
cd /opt/accident-app/backend
npm run migrate
```

### 4.4 Start Backend with PM2

```bash
cd /opt/accident-app/backend

# Start in cluster mode
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u accidentapp --hp /home/accidentapp
```

### 4.5 Build and Deploy Web Dashboard

```bash
cd /opt/accident-app/web

# Install dependencies
npm ci

# Create environment file
echo "VITE_API_URL=https://api.yourdomain.com" > .env

# Build production bundle
npm run build

# Copy to nginx directory
sudo mkdir -p /var/www/accident-app
sudo cp -r dist/* /var/www/accident-app/
sudo chown -R www-data:www-data /var/www/accident-app
```

---

## Phase 5: Nginx & SSL Configuration

### 5.1 Configure Nginx

```bash
# Copy provided nginx config
sudo cp /opt/accident-app/nginx/nginx.conf /etc/nginx/sites-available/accident-app

# Edit with your domain
sudo nano /etc/nginx/sites-available/accident-app
# Replace 'yourdomain.com' with your actual domain

# Enable the site
sudo ln -s /etc/nginx/sites-available/accident-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### 5.2 Obtain SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

---

## Phase 6: Post-Deployment Verification

### 6.1 Health Check Commands

```bash
# Basic health
curl https://api.yourdomain.com/health

# Detailed health
curl https://api.yourdomain.com/health/detailed

# Check PM2 status
pm2 status

# View logs
pm2 logs accident-app-backend --lines 50
```

### 6.2 Verification Checklist

- [ ] Backend API responds at `/health`
- [ ] Web dashboard loads and displays login page
- [ ] Database connections working (check `/health/detailed`)
- [ ] SSL certificate valid (check browser padlock)
- [ ] Rate limiting working (multiple rapid requests blocked)
- [ ] Logs being written to `/opt/accident-app/backend/logs/`
- [ ] PM2 showing all processes as "online"

### 6.3 Create Initial Admin User

```bash
# Connect to database
psql -h localhost -U accident_user -d accident_app

# Create initial fleet and admin user (passwords will need to be hashed)
# See docs/PRODUCTION_DEPLOYMENT.md for full SQL
```

---

## Phase 7: Setup Backups

### 7.1 Automated Daily Backups

```bash
# Add cron job for daily backups at 2 AM
crontab -e

# Add this line:
0 2 * * * /opt/accident-app/backend/scripts/backup-database.sh >> /opt/accident-app/backend/logs/backup.log 2>&1
```

### 7.2 Test Backup/Restore

```bash
# Create a backup
cd /opt/accident-app/backend
./scripts/backup-database.sh

# Verify backup exists
ls -la backups/
```

---

## Phase 8: Monitoring Setup (Optional but Recommended)

### 8.1 Deploy Monitoring Stack

```bash
cd /opt/accident-app

# Start Prometheus, Grafana, AlertManager
docker-compose -f docker-compose.monitoring.yml up -d
```

### 8.2 Access Dashboards

- Grafana: `http://your-server:3001` (default admin/admin)
- Prometheus: `http://your-server:9090`

---

## Remaining Improvements (Post-Launch)

These items are not blockers but would enhance the production setup:

| Item | Priority | Effort | Notes |
|------|----------|--------|-------|
| Swagger/OpenAPI docs | Medium | 2-3 days | Auto-generated API documentation |
| Sentry integration | Medium | 1 day | Error tracking and alerting |
| Feature flags service | Low | 1-2 days | Infrastructure ready, needs UI |
| CDN (CloudFront) | Low | 1 day | Improves static asset delivery |
| Database read replica | Low | 2-3 days | For scaling reads |
| 2FA support | Medium | 3-5 days | Enhanced security |
| APM integration | Low | 1 day | DataDog/New Relic integration |

---

## Mobile App Deployment

The React Native mobile app requires separate deployment:

### iOS (App Store)
1. Configure app.json with production bundle ID
2. Build with `eas build --platform ios`
3. Submit to App Store Connect
4. Apple review process (1-3 days)

### Android (Play Store)
1. Configure app.json with production package name
2. Build with `eas build --platform android`
3. Submit to Google Play Console
4. Google review process (1-2 days)

---

## Quick Reference Commands

```bash
# Application Control
pm2 status                    # View status
pm2 restart all              # Restart all
pm2 logs                     # View logs
pm2 monit                    # Real-time monitoring

# Deployment
pm2 reload accident-app-backend  # Zero-downtime reload

# Database
./scripts/backup-database.sh     # Create backup
./scripts/restore-database.sh    # Restore from backup

# Health Checks
curl localhost:3000/health           # Basic
curl localhost:3000/health/detailed  # Full details
curl localhost:3000/health/metrics   # Prometheus metrics

# Emergency
./scripts/incident-response.sh status   # Quick status
./scripts/incident-response.sh restart  # Emergency restart
```

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Infrastructure setup | 2-4 hours | Cloud provider account, domain |
| Server preparation | 1-2 hours | Server access |
| Database setup | 30 min | None |
| Application deployment | 1-2 hours | Database ready |
| SSL & Nginx | 30 min | Domain DNS configured |
| Verification | 1 hour | All above complete |
| Monitoring setup | 1 hour | Optional |

**Total: 6-10 hours for full production deployment**

---

## Support Resources

- **Deployment Guide:** `docs/PRODUCTION_DEPLOYMENT.md`
- **Operations Runbook:** `docs/RUNBOOK.md`
- **Testing Checklist:** `docs/PRODUCTION_TESTING_CHECKLIST.md`
- **Security Documentation:** `SECURITY_FIXES.md`

---

**Document Version:** 1.0
**Prepared:** December 14, 2024
**Status:** Ready for execution
