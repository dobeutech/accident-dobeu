# Production Deployment Guide

## Prerequisites

### System Requirements
- **OS:** Ubuntu 20.04 LTS or later
- **Node.js:** 18.x or later
- **PostgreSQL:** 14.x or later
- **Memory:** Minimum 2GB RAM (4GB recommended)
- **Storage:** Minimum 20GB (SSD recommended)
- **Network:** Static IP with open ports 80, 443, 3000

### Required Services
- PostgreSQL database
- AWS S3 bucket for file storage
- Domain name with SSL certificate
- (Optional) CDN for static assets
- (Optional) Load balancer for high availability

### Required Credentials
- Database credentials
- AWS access keys
- JWT secret (min 32 characters)
- Session secret (min 32 characters)
- SSL certificates

---

## Initial Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 14
sudo apt install -y postgresql-14 postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE accident_app;
CREATE USER accident_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE accident_app TO accident_user;
ALTER DATABASE accident_app OWNER TO accident_user;

# Enable required extensions
\c accident_app
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Exit psql
\q
```

### 3. Application Deployment

```bash
# Create application directory
sudo mkdir -p /opt/accident-app
sudo chown $USER:$USER /opt/accident-app

# Clone repository
cd /opt/accident-app
git clone https://github.com/yourusername/accident-app.git .

# Install backend dependencies
cd backend
npm ci --production

# Create environment file
cp .env.example .env
nano .env  # Edit with production values

# Run database migrations
npm run migrate

# Create log directories
mkdir -p logs uploads backups
```

### 4. Environment Configuration

Edit `/opt/accident-app/backend/.env`:

```bash
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=accident_app
DB_USER=accident_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_very_long_random_secret_key_here_min_32_chars
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=https://yourdomain.com

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-bucket-name

# Security
SESSION_SECRET=your_session_secret_here_min_32_chars
COOKIE_SECURE=true
```

### 5. Start Backend with PM2

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
pm2 logs accident-app-backend
```

### 6. Build and Deploy Frontend

```bash
cd /opt/accident-app/web

# Install dependencies
npm ci

# Create environment file
cp .env.example .env
nano .env  # Edit with production values

# Build production bundle
npm run build

# Copy to nginx directory
sudo cp -r dist/* /var/www/accident-app/
```

### 7. Configure Nginx

```bash
# Copy nginx configuration
sudo cp /opt/accident-app/nginx/nginx.conf /etc/nginx/sites-available/accident-app

# Update domain name in config
sudo nano /etc/nginx/sites-available/accident-app

# Enable site
sudo ln -s /etc/nginx/sites-available/accident-app /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 8. Setup SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Deployment Process

### Standard Deployment

```bash
# 1. Pull latest code
cd /opt/accident-app
git pull origin main

# 2. Install dependencies
cd backend
npm ci --production

# 3. Run migrations
npm run migrate

# 4. Reload PM2
pm2 reload accident-app-backend

# 5. Build frontend
cd ../web
npm ci
npm run build

# 6. Deploy frontend
sudo cp -r dist/* /var/www/accident-app/

# 7. Clear nginx cache (if applicable)
sudo nginx -s reload

# 8. Verify deployment
curl https://yourdomain.com/health
```

### Zero-Downtime Deployment

```bash
# Use PM2 reload instead of restart
pm2 reload accident-app-backend --update-env

# This performs a graceful reload without downtime
```

---

## Monitoring

### Health Checks

```bash
# Backend health
curl https://yourdomain.com/health

# Detailed health
curl https://yourdomain.com/health/detailed

# Readiness check
curl https://yourdomain.com/health/ready

# Metrics
curl https://yourdomain.com/health/metrics
```

### PM2 Monitoring

```bash
# View logs
pm2 logs accident-app-backend

# Monitor resources
pm2 monit

# View detailed info
pm2 info accident-app-backend

# View metrics
pm2 describe accident-app-backend
```

### Database Monitoring

```bash
# Check connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='accident_app';"

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('accident_app'));"

# Check slow queries
sudo -u postgres psql accident_app -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

---

## Backup and Restore

### Automated Backups

```bash
# Setup daily backup cron job
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /opt/accident-app/backend/scripts/backup-database.sh >> /opt/accident-app/backend/logs/backup.log 2>&1
```

### Manual Backup

```bash
cd /opt/accident-app/backend
./scripts/backup-database.sh backup_$(date +%Y%m%d)
```

### Restore from Backup

```bash
cd /opt/accident-app/backend
./scripts/restore-database.sh ./backups/backup_20240101_120000.sql.gz
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs accident-app-backend --lines 100

# Check environment variables
pm2 env accident-app-backend

# Restart with fresh environment
pm2 delete accident-app-backend
pm2 start ecosystem.config.js --env production
```

### Database Connection Issues

```bash
# Test database connection
psql -h localhost -U accident_user -d accident_app

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart with memory limit
pm2 restart accident-app-backend --max-memory-restart 500M

# Check for memory leaks
node --inspect src/server.js
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## Rollback Procedure

### Quick Rollback

```bash
# 1. Revert to previous commit
cd /opt/accident-app
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>

# 2. Reinstall dependencies
cd backend
npm ci --production

# 3. Reload application
pm2 reload accident-app-backend

# 4. Rebuild frontend
cd ../web
npm ci
npm run build
sudo cp -r dist/* /var/www/accident-app/
```

### Database Rollback

```bash
# Restore from backup
cd /opt/accident-app/backend
./scripts/restore-database.sh ./backups/backup_before_deployment.sql.gz
```

---

## Security Checklist

- [ ] Firewall configured (UFW or iptables)
- [ ] SSH key-based authentication only
- [ ] Database not exposed to internet
- [ ] Environment variables secured
- [ ] SSL certificate installed and auto-renewing
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Regular backups automated
- [ ] Monitoring and alerting setup
- [ ] Log rotation configured
- [ ] Fail2ban installed and configured

---

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_reports_fleet_id ON accident_reports(fleet_id);
CREATE INDEX idx_reports_status ON accident_reports(status);
CREATE INDEX idx_reports_created_at ON accident_reports(created_at);

-- Analyze tables
ANALYZE accident_reports;
ANALYZE users;
ANALYZE fleets;
```

### Nginx Caching

```nginx
# Add to nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
}
```

### PM2 Cluster Mode

Already configured in `ecosystem.config.js` to use all CPU cores.

---

## Maintenance Windows

### Planned Maintenance

1. Notify users 24 hours in advance
2. Schedule during low-traffic hours (typically 2-4 AM)
3. Create backup before maintenance
4. Follow deployment procedure
5. Monitor for 30 minutes post-deployment
6. Notify users when complete

### Emergency Maintenance

1. Assess severity
2. Create immediate backup
3. Apply fix
4. Test thoroughly
5. Document incident
6. Post-mortem review

---

## Support Contacts

- **DevOps:** devops@yourdomain.com
- **Database:** dba@yourdomain.com
- **Security:** security@yourdomain.com
- **On-Call:** +1-XXX-XXX-XXXX

---

## Additional Resources

- [Health Check Endpoints](./HEALTH_CHECKS.md)
- [Monitoring Setup](./MONITORING.md)
- [Security Best Practices](./SECURITY.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
