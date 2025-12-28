# 🚀 Deploy Now - Immediate Deployment Guide

**Repository:** https://github.com/dobeutech/accident-dobeu.git  
**Branch:** master  
**Status:** Production Ready ✅  
**Last Updated:** 2025-12-16

---

## 📊 Deployment Status

✅ **Code:** All features complete and tested  
✅ **Docker:** Production-ready containers configured  
✅ **CI/CD:** GitHub Actions workflows ready  
✅ **Documentation:** Complete deployment guides available  
✅ **Security:** Security scans and best practices implemented  
✅ **Monitoring:** Prometheus + Grafana configured  

---

## 🎯 Choose Your Deployment Method

### Method 1: Docker Compose (Fastest - 10 minutes)
**Best for:** Quick deployment, testing, single server

### Method 2: GitHub Actions CI/CD (Automated - 15 minutes)
**Best for:** Production deployments with automation

### Method 3: Manual Server Deployment (Traditional - 30 minutes)
**Best for:** Custom server configurations

---

## 🐳 Method 1: Docker Compose Deployment

### Prerequisites
- Server with Docker and Docker Compose installed
- Domain name pointed to server IP
- SSL certificate (or use Let's Encrypt)

### Step 1: Clone Repository
```bash
# SSH into your server
ssh user@your-server-ip

# Clone the repository
git clone https://github.com/dobeutech/accident-dobeu.git
cd accident-dobeu
git checkout master
```

### Step 2: Configure Environment
```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp web/.env.example web/.env

# Edit backend environment
nano backend/.env
```

**Required backend/.env variables:**
```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=accident_app
DB_USER=accident_user
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING

# CORS
CORS_ORIGIN=https://yourdomain.com

# AWS S3 (for file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your-bucket-name

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING

# Encryption Key (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING
```

**Edit web/.env:**
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_ENV=production
```

### Step 3: Build and Deploy
```bash
# Build the web application
cd web
npm install
npm run build
cd ..

# Start all services with Docker Compose
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Step 4: Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

### Step 5: Verify Deployment
```bash
# Check backend health
curl https://api.yourdomain.com/health

# Check web application
curl https://yourdomain.com

# Check database connection
docker exec accident-app-backend node -e "require('./src/database/connection').testConnection()"
```

### Step 6: Setup Monitoring (Optional)
```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana at: http://your-server-ip:3001
# Default credentials: admin/admin (change immediately)
```

---

## ⚙️ Method 2: GitHub Actions CI/CD Deployment

### Prerequisites
- GitHub repository access
- Production server with SSH access
- AWS account (for S3 and CloudFront)

### Step 1: Configure GitHub Secrets
Go to: https://github.com/dobeutech/accident-dobeu/settings/secrets/actions

Add these secrets:

**Server Secrets:**
- `PRODUCTION_HOST` - Your server IP or hostname
- `PRODUCTION_USER` - SSH username
- `PRODUCTION_SSH_KEY` - Private SSH key for server access

**AWS Secrets:**
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `AWS_S3_BUCKET` - S3 bucket name for web hosting
- `CLOUDFRONT_DISTRIBUTION_ID` - CloudFront distribution ID

**Application Secrets:**
- `PRODUCTION_API_URL` - Backend API URL (e.g., https://api.yourdomain.com)
- `PRODUCTION_WEB_URL` - Web app URL (e.g., https://yourdomain.com)

### Step 2: Prepare Production Server
```bash
# SSH into server
ssh user@your-server-ip

# Create application directory
sudo mkdir -p /opt/accident-app/backend
sudo chown -R $USER:$USER /opt/accident-app

# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup
# Follow the command it outputs
```

### Step 3: Trigger Deployment
```bash
# Option A: Push to master branch (auto-deploys)
git push origin master

# Option B: Manual workflow dispatch
# Go to: https://github.com/dobeutech/accident-dobeu/actions/workflows/deploy-production.yml
# Click "Run workflow" button

# Option C: Create a release tag
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

### Step 4: Monitor Deployment
```bash
# Watch GitHub Actions
# Go to: https://github.com/dobeutech/accident-dobeu/actions

# Check deployment logs on server
ssh user@your-server-ip
pm2 logs accident-app-backend

# Check application status
pm2 status
```

---

## 🖥️ Method 3: Manual Server Deployment

### Step 1: Server Setup
```bash
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
```

### Step 2: Database Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE accident_app;
CREATE USER accident_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE accident_app TO accident_user;
ALTER DATABASE accident_app OWNER TO accident_user;

# Enable UUID extension
\c accident_app
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

### Step 3: Deploy Backend
```bash
# Clone repository
cd /opt
sudo git clone https://github.com/dobeutech/accident-dobeu.git accident-app
cd accident-app

# Setup backend
cd backend
cp .env.example .env
nano .env  # Edit with your configuration

# Install dependencies
npm ci --production

# Run migrations
npm run migrate

# Start with PM2
pm2 start src/server.js --name accident-app-backend
pm2 save
pm2 startup
```

### Step 4: Deploy Web Application
```bash
# Build web app
cd /opt/accident-app/web
cp .env.example .env
nano .env  # Edit with your configuration

npm ci
npm run build

# Copy to Nginx
sudo mkdir -p /var/www/accident-app
sudo cp -r dist/* /var/www/accident-app/
```

### Step 5: Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/accident-app
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Web application
    location / {
        root /var/www/accident-app;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/accident-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Setup SSL
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🔍 Post-Deployment Verification

### Health Checks
```bash
# Backend health
curl https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","timestamp":"2025-12-16T...","uptime":123}

# Database connection
curl https://api.yourdomain.com/api/health/db

# Web application
curl -I https://yourdomain.com
# Should return 200 OK
```

### Smoke Tests
```bash
# Test user registration
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Test login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Monitor Logs
```bash
# Backend logs (PM2)
pm2 logs accident-app-backend

# Backend logs (Docker)
docker logs -f accident-app-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 🔧 Troubleshooting

### Backend Won't Start
```bash
# Check logs
pm2 logs accident-app-backend --lines 100

# Common issues:
# 1. Database connection - verify DB_HOST, DB_USER, DB_PASSWORD in .env
# 2. Port already in use - check: sudo lsof -i :3000
# 3. Missing dependencies - run: npm install
```

### Database Connection Failed
```bash
# Test PostgreSQL connection
psql -h localhost -U accident_user -d accident_app

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Web App Shows Blank Page
```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify build files exist
ls -la /var/www/accident-app/

# Rebuild web app
cd /opt/accident-app/web
npm run build
sudo cp -r dist/* /var/www/accident-app/
```

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test SSL configuration
curl -vI https://yourdomain.com
```

---

## 📊 Monitoring & Maintenance

### Setup Monitoring Stack
```bash
cd /opt/accident-app
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana: http://your-server-ip:3001
# Access Prometheus: http://your-server-ip:9090
```

### Regular Maintenance Tasks
```bash
# Update application
cd /opt/accident-app
git pull origin master
cd backend && npm install && pm2 restart accident-app-backend
cd ../web && npm install && npm run build && sudo cp -r dist/* /var/www/accident-app/

# Backup database
pg_dump -U accident_user accident_app > backup_$(date +%Y%m%d).sql

# Clean up logs
pm2 flush
sudo find /var/log/nginx -name "*.log" -mtime +30 -delete

# Update system packages
sudo apt update && sudo apt upgrade -y
```

### Performance Monitoring
```bash
# Check PM2 metrics
pm2 monit

# Check system resources
htop

# Check disk space
df -h

# Check database size
psql -U accident_user -d accident_app -c "SELECT pg_size_pretty(pg_database_size('accident_app'));"
```

---

## 🆘 Support & Resources

### Documentation
- **Full Deployment Guide:** `DEPLOYMENT_QUICK_START.md`
- **Production Deployment:** `docs/PRODUCTION_DEPLOYMENT.md`
- **Operational Handbook:** `docs/OPERATIONAL_HANDBOOK.md`
- **Runbook:** `docs/RUNBOOK.md`
- **System Architecture:** `docs/SYSTEM_ARCHITECTURE.md`

### Quick Links
- **Repository:** https://github.com/dobeutech/accident-dobeu
- **GitHub Actions:** https://github.com/dobeutech/accident-dobeu/actions
- **Issues:** https://github.com/dobeutech/accident-dobeu/issues

### Emergency Contacts
- Check `docs/RUNBOOK.md` for incident response procedures
- Review `docs/OPERATIONAL_HANDBOOK.md` for operational guidelines

---

## ✅ Deployment Checklist

- [ ] Server provisioned and accessible
- [ ] Domain name configured and DNS propagated
- [ ] Environment variables configured
- [ ] Database created and migrations run
- [ ] Backend deployed and running
- [ ] Web application built and deployed
- [ ] SSL certificate installed
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Documentation reviewed
- [ ] Team notified

---

**🎉 Deployment Complete!**

Your Fleet Accident Reporting System is now live and ready for production use.

**Next Steps:**
1. Create admin user account
2. Configure organization settings
3. Import existing data (if applicable)
4. Train users on the system
5. Monitor performance and logs

For ongoing support, refer to the operational documentation in the `docs/` directory.
