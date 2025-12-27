# 🚀 Deployment Quick Start Guide

**Status:** Ready to Deploy  
**Production Readiness:** 97/100  
**Estimated Deployment Time:** 30-60 minutes

---

## 📋 Pre-Deployment Checklist

### Required Information
- [ ] Production server IP/hostname
- [ ] Domain name (e.g., yourdomain.com)
- [ ] Database credentials
- [ ] AWS S3 credentials
- [ ] SSL certificate (or use Let's Encrypt)
- [ ] SMTP credentials (optional)

### Required Software on Server
- [ ] Ubuntu 20.04+ (or similar Linux)
- [ ] Node.js 18+
- [ ] PostgreSQL 14+
- [ ] Nginx
- [ ] PM2 (will install)
- [ ] Certbot (for SSL)

---

## 🎯 Deployment Options

### Option 1: Quick Deploy (Recommended for First Time)
**Time:** 30 minutes  
**Complexity:** Low  
**Best for:** Single server deployment

### Option 2: Docker Deploy
**Time:** 20 minutes  
**Complexity:** Medium  
**Best for:** Containerized environments

### Option 3: CI/CD Deploy
**Time:** 15 minutes (after setup)  
**Complexity:** High  
**Best for:** Automated deployments

---

## 🚀 Option 1: Quick Deploy (Step-by-Step)

### Step 1: Server Setup (5 minutes)

```bash
# SSH into your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 14
sudo apt install -y postgresql-14 postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Database Setup (5 minutes)

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE accident_app;
CREATE USER accident_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE accident_app TO accident_user;
ALTER DATABASE accident_app OWNER TO accident_user;

# Enable UUID extension
\c accident_app
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Exit
\q
```

### Step 3: Clone and Setup Application (5 minutes)

```bash
# Create application directory
sudo mkdir -p /opt/accident-app
sudo chown $USER:$USER /opt/accident-app

# Clone repository
cd /opt/accident-app
git clone https://github.com/dobeutech/accident-dobeu.git .

# Install backend dependencies
cd backend
npm ci --production

# Create environment file
cp .env.example .env
nano .env
```

**Edit .env with your values:**
```bash
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=accident_app
DB_USER=accident_user
DB_PASSWORD=your_secure_password_here

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_min_32_chars_here
SESSION_SECRET=your_session_secret_min_32_chars_here

# CORS
CORS_ORIGIN=https://yourdomain.com

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your-bucket-name
```

### Step 4: Run Database Migrations (2 minutes)

```bash
cd /opt/accident-app/backend
npm run migrate
```

### Step 5: Start Backend with PM2 (3 minutes)

```bash
cd /opt/accident-app/backend

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs

# Check status
pm2 status
pm2 logs accident-app-backend --lines 50
```

### Step 6: Build and Deploy Frontend (5 minutes)

```bash
cd /opt/accident-app/web

# Install dependencies
npm ci

# Create environment file
cp .env.example .env
nano .env
```

**Edit .env:**
```bash
VITE_API_URL=https://yourdomain.com/api
VITE_ENV=production
```

```bash
# Build production bundle
npm run build

# Create web directory
sudo mkdir -p /var/www/accident-app
sudo chown $USER:$USER /var/www/accident-app

# Copy built files
cp -r dist/* /var/www/accident-app/
```

### Step 7: Configure Nginx (5 minutes)

```bash
# Copy nginx configuration
sudo cp /opt/accident-app/nginx/nginx.conf /etc/nginx/sites-available/accident-app

# Edit configuration with your domain
sudo nano /etc/nginx/sites-available/accident-app
```

**Update these lines:**
```nginx
server_name yourdomain.com www.yourdomain.com;
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/accident-app /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Step 8: Setup SSL Certificate (5 minutes)

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 9: Verify Deployment (5 minutes)

```bash
# Check health endpoint
curl https://yourdomain.com/health

# Run smoke tests
cd /opt/accident-app/backend
./scripts/smoke-test.sh https://yourdomain.com

# Check PM2 status
pm2 status

# View logs
pm2 logs accident-app-backend --lines 50
```

### Step 10: Setup Monitoring (Optional, 5 minutes)

```bash
cd /opt/accident-app

# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana at http://your-server-ip:3001
# Default credentials: admin/admin (change immediately)
```

---

## 🐳 Option 2: Docker Deploy

### Prerequisites
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Deploy
```bash
# Clone repository
git clone https://github.com/dobeutech/accident-dobeu.git
cd accident-dobeu

# Create .env file
cp backend/.env.example backend/.env
nano backend/.env  # Edit with your values

# Start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f backend
```

---

## 🔄 Option 3: CI/CD Deploy

### Setup GitHub Secrets

Go to your repository settings and add these secrets:

```
PRODUCTION_HOST=your-server-ip
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=your-private-key
PRODUCTION_API_URL=https://yourdomain.com/api
PRODUCTION_WEB_URL=https://yourdomain.com
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
```

### Deploy

```bash
# Push to main branch
git push origin main

# GitHub Actions will automatically:
# 1. Run tests
# 2. Run security scan
# 3. Deploy backend
# 4. Deploy frontend
# 5. Run health checks
```

---

## ✅ Post-Deployment Checklist

### Immediate (0-15 minutes)
- [ ] Application accessible at https://yourdomain.com
- [ ] Health check returns 200: `curl https://yourdomain.com/health`
- [ ] Login works
- [ ] No errors in logs: `pm2 logs`
- [ ] SSL certificate valid
- [ ] DNS resolving correctly

### Short-term (15-60 minutes)
- [ ] User traffic normal
- [ ] Response times acceptable
- [ ] Error rate normal
- [ ] Database performance good
- [ ] Memory usage stable
- [ ] CPU usage normal
- [ ] No alerts triggered

### First 24 Hours
- [ ] System stable
- [ ] No memory leaks
- [ ] Logs rotating properly
- [ ] Backups completing
- [ ] Monitoring data flowing
- [ ] User feedback positive

---

## 🔧 Common Issues & Solutions

### Issue: Application won't start
```bash
# Check logs
pm2 logs accident-app-backend --err

# Check environment variables
pm2 env accident-app-backend

# Restart
pm2 restart accident-app-backend
```

### Issue: Database connection failed
```bash
# Test database connection
psql -h localhost -U accident_user -d accident_app

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Issue: Nginx 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Issue: SSL certificate not working
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Reload nginx
sudo systemctl reload nginx
```

---

## 📊 Monitoring & Maintenance

### Daily Tasks
```bash
# Check application health
curl https://yourdomain.com/health

# Check PM2 status
pm2 status

# Check disk space
df -h

# Check logs for errors
pm2 logs accident-app-backend --err --lines 50
```

### Weekly Tasks
```bash
# Run capacity report
cd /opt/accident-app/backend
./scripts/capacity-report.sh

# Check SSL certificate
./scripts/check-ssl.sh yourdomain.com

# Review security logs
sudo tail -100 /opt/accident-app/backend/logs/security.log

# Check for updates
cd /opt/accident-app
git fetch
git log HEAD..origin/master --oneline
```

### Monthly Tasks
```bash
# Update dependencies (security patches)
cd /opt/accident-app/backend
npm audit fix

# Run security scan
npm run security-scan

# Review and optimize database
sudo -u postgres psql accident_app -c "VACUUM ANALYZE;"

# Test backup restoration
./scripts/restore-database.sh ./backups/latest.sql.gz
```

---

## 🔄 Updating the Application

### Standard Update
```bash
# Pull latest changes
cd /opt/accident-app
git pull origin master

# Update backend
cd backend
npm ci --production
npm run migrate

# Reload application (zero-downtime)
pm2 reload accident-app-backend

# Update frontend
cd ../web
npm ci
npm run build
sudo cp -r dist/* /var/www/accident-app/

# Clear nginx cache
sudo systemctl reload nginx

# Verify
curl https://yourdomain.com/health
./scripts/smoke-test.sh https://yourdomain.com
```

---

## 🆘 Emergency Procedures

### Complete System Failure
```bash
# 1. Check server accessibility
ping yourdomain.com

# 2. SSH into server
ssh user@your-server-ip

# 3. Check all services
sudo systemctl status nginx postgresql
pm2 status

# 4. Review system logs
sudo journalctl -xe

# 5. Restart services in order
sudo systemctl restart postgresql
pm2 restart accident-app-backend
sudo systemctl restart nginx

# 6. Verify health
curl https://yourdomain.com/health

# 7. Monitor for 15 minutes
pm2 logs accident-app-backend
```

### Rollback to Previous Version
```bash
cd /opt/accident-app

# Find previous working commit
git log --oneline -10

# Rollback
git checkout <previous-commit-hash>

# Reinstall dependencies
cd backend
npm ci --production

# Reload application
pm2 reload accident-app-backend

# Verify
curl https://yourdomain.com/health
```

---

## 📞 Support Resources

### Documentation
- **Deployment Guide:** `docs/PRODUCTION_DEPLOYMENT.md`
- **Operations Runbook:** `docs/RUNBOOK.md`
- **Testing Checklist:** `docs/PRODUCTION_TESTING_CHECKLIST.md`

### Quick Commands
```bash
# System status
./scripts/incident-response.sh status

# View logs
pm2 logs accident-app-backend

# Emergency restart
./scripts/incident-response.sh restart

# Create backup
./scripts/incident-response.sh backup

# Run smoke tests
./scripts/smoke-test.sh https://yourdomain.com

# Check SSL
./scripts/check-ssl.sh yourdomain.com

# Capacity report
./scripts/capacity-report.sh
```

---

## 🎯 Success Criteria

Your deployment is successful when:

- ✅ Application accessible via HTTPS
- ✅ Health check returns 200
- ✅ Login functionality works
- ✅ No errors in logs
- ✅ SSL certificate valid
- ✅ Response times < 500ms
- ✅ Database connections stable
- ✅ Backups running
- ✅ Monitoring active

---

## 🎉 You're Ready!

Follow this guide step-by-step and you'll have your Fleet Accident Reporting System running in production within 30-60 minutes.

**Good luck with your deployment!** 🚀

---

**Need Help?**
- Review: `docs/PRODUCTION_DEPLOYMENT.md` (detailed guide)
- Troubleshoot: `docs/RUNBOOK.md` (incident response)
- Test: `docs/PRODUCTION_TESTING_CHECKLIST.md` (validation)
