# Production Runbook

## Quick Reference

### Emergency Contacts
- **On-Call Engineer:** +1-XXX-XXX-XXXX
- **DevOps Lead:** devops@yourdomain.com
- **Database Admin:** dba@yourdomain.com

### Critical URLs
- **Production:** https://yourdomain.com
- **API:** https://yourdomain.com/api
- **Health Check:** https://yourdomain.com/health
- **Monitoring Dashboard:** https://monitoring.yourdomain.com

---

## Common Incidents

### 1. Application Down

**Symptoms:**
- Health check returns 503 or times out
- Users cannot access the application
- PM2 shows app as stopped

**Diagnosis:**
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs accident-app-backend --lines 50

# Check system resources
free -h
df -h
top
```

**Resolution:**
```bash
# Restart application
pm2 restart accident-app-backend

# If restart fails, check logs and fix issue
pm2 logs accident-app-backend --err

# Force restart if needed
pm2 delete accident-app-backend
pm2 start /opt/accident-app/backend/ecosystem.config.js --env production
```

**Escalation:** If restart doesn't resolve, contact DevOps Lead

---

### 2. Database Connection Failures

**Symptoms:**
- "Connection refused" errors in logs
- "Too many connections" errors
- Slow query performance

**Diagnosis:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check max connections
sudo -u postgres psql -c "SHOW max_connections;"
```

**Resolution:**
```bash
# Restart PostgreSQL if needed
sudo systemctl restart postgresql

# Kill idle connections
sudo -u postgres psql accident_app -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'accident_app' 
AND state = 'idle' 
AND state_change < NOW() - INTERVAL '10 minutes';"

# Increase max connections (if needed)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: max_connections = 200
sudo systemctl restart postgresql
```

**Escalation:** If database corruption suspected, contact Database Admin immediately

---

### 3. High Memory Usage

**Symptoms:**
- PM2 shows high memory usage
- Application restarts frequently
- System becomes unresponsive

**Diagnosis:**
```bash
# Check memory usage
free -h
pm2 monit

# Check for memory leaks
pm2 logs accident-app-backend | grep "memory"

# Check process memory
ps aux --sort=-%mem | head -10
```

**Resolution:**
```bash
# Restart application
pm2 restart accident-app-backend

# If issue persists, reload with memory limit
pm2 delete accident-app-backend
pm2 start ecosystem.config.js --env production --max-memory-restart 500M

# Clear system cache if needed
sudo sync && sudo sysctl -w vm.drop_caches=3
```

**Prevention:**
- Monitor memory trends
- Investigate memory leaks in code
- Consider increasing server resources

---

### 4. SSL Certificate Expired

**Symptoms:**
- Browser shows "Your connection is not private"
- SSL certificate warnings
- HTTPS not working

**Diagnosis:**
```bash
# Check certificate expiry
sudo certbot certificates

# Check certificate details
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout
```

**Resolution:**
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Reload nginx
sudo systemctl reload nginx

# Verify
curl -I https://yourdomain.com
```

**Prevention:**
- Certbot auto-renewal should be configured
- Monitor certificate expiry dates

---

### 5. Disk Space Full

**Symptoms:**
- "No space left on device" errors
- Application cannot write logs
- Database writes fail

**Diagnosis:**
```bash
# Check disk usage
df -h

# Find large files
sudo du -h /opt/accident-app | sort -rh | head -20

# Check log sizes
du -sh /opt/accident-app/backend/logs/*
```

**Resolution:**
```bash
# Clean old logs
cd /opt/accident-app/backend/logs
find . -name "*.log" -mtime +30 -delete

# Clean old backups
cd /opt/accident-app/backend/backups
find . -name "*.sql.gz" -mtime +30 -delete

# Clean PM2 logs
pm2 flush

# Clean system logs
sudo journalctl --vacuum-time=7d

# Restart application
pm2 restart accident-app-backend
```

**Prevention:**
- Setup log rotation
- Automate old backup cleanup
- Monitor disk usage

---

### 6. High CPU Usage

**Symptoms:**
- Server becomes slow
- API response times increase
- Load average very high

**Diagnosis:**
```bash
# Check CPU usage
top
htop

# Check load average
uptime

# Check PM2 metrics
pm2 monit

# Check slow queries
sudo -u postgres psql accident_app -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;"
```

**Resolution:**
```bash
# Kill slow queries
sudo -u postgres psql accident_app -c "SELECT pg_terminate_backend(<pid>);"

# Restart application
pm2 restart accident-app-backend

# If database is the issue
sudo systemctl restart postgresql

# Check for infinite loops in code
pm2 logs accident-app-backend --lines 100
```

**Escalation:** If CPU usage remains high, investigate code performance

---

### 7. Failed Deployment

**Symptoms:**
- Application won't start after deployment
- New features not working
- Errors in logs after deployment

**Diagnosis:**
```bash
# Check PM2 logs
pm2 logs accident-app-backend --lines 100

# Check git status
cd /opt/accident-app
git log --oneline -5
git status

# Check environment variables
pm2 env accident-app-backend
```

**Resolution:**
```bash
# Rollback to previous version
cd /opt/accident-app
git log --oneline -10  # Find previous working commit
git checkout <previous-commit-hash>

# Reinstall dependencies
cd backend
npm ci --production

# Run migrations (if needed)
npm run migrate

# Restart application
pm2 restart accident-app-backend

# Verify
curl https://yourdomain.com/health
```

**Post-Incident:**
- Document what went wrong
- Fix issue in development
- Test thoroughly before redeploying

---

### 8. WebSocket Connection Issues

**Symptoms:**
- Real-time features not working
- Socket connection errors in browser console
- "Connection refused" for socket.io

**Diagnosis:**
```bash
# Check nginx configuration
sudo nginx -t

# Check WebSocket proxy settings
sudo cat /etc/nginx/sites-enabled/accident-app | grep -A 10 "socket.io"

# Check backend logs
pm2 logs accident-app-backend | grep "socket"

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://yourdomain.com/socket.io/
```

**Resolution:**
```bash
# Reload nginx
sudo systemctl reload nginx

# Restart backend
pm2 restart accident-app-backend

# Check firewall rules
sudo ufw status
```

---

### 9. Rate Limiting Triggered

**Symptoms:**
- Users getting "Too many requests" errors
- 429 status codes in logs
- Legitimate users blocked

**Diagnosis:**
```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log | grep "limiting"

# Check rate limit configuration
sudo cat /etc/nginx/sites-enabled/accident-app | grep "limit_req"

# Identify blocked IPs
sudo grep "limiting requests" /var/log/nginx/error.log | awk '{print $11}' | sort | uniq -c | sort -rn
```

**Resolution:**
```bash
# Temporarily increase rate limits (if legitimate traffic)
sudo nano /etc/nginx/sites-enabled/accident-app
# Increase burst value or rate

# Reload nginx
sudo systemctl reload nginx

# Whitelist specific IPs if needed
# Add to nginx config:
# geo $limit {
#     default 1;
#     10.0.0.0/8 0;  # Whitelist internal network
# }
```

---

### 10. S3 Upload Failures

**Symptoms:**
- File uploads failing
- "Access Denied" errors
- Photos not appearing in reports

**Diagnosis:**
```bash
# Check backend logs
pm2 logs accident-app-backend | grep "S3\|upload"

# Verify AWS credentials
aws s3 ls s3://your-bucket-name --profile default

# Check environment variables
pm2 env accident-app-backend | grep AWS
```

**Resolution:**
```bash
# Verify S3 bucket permissions
aws s3api get-bucket-policy --bucket your-bucket-name

# Test upload manually
aws s3 cp test.txt s3://your-bucket-name/test.txt

# Restart application with fresh environment
pm2 restart accident-app-backend --update-env

# If credentials expired, update .env and restart
cd /opt/accident-app/backend
nano .env  # Update AWS credentials
pm2 restart accident-app-backend
```

---

## Monitoring Checklist

### Daily Checks
- [ ] Check application health: `curl https://yourdomain.com/health`
- [ ] Review error logs: `pm2 logs accident-app-backend --err --lines 50`
- [ ] Check disk space: `df -h`
- [ ] Verify backups completed: `ls -lh /opt/accident-app/backend/backups/`

### Weekly Checks
- [ ] Review performance metrics
- [ ] Check database size and growth
- [ ] Review security logs
- [ ] Test backup restoration
- [ ] Check SSL certificate expiry
- [ ] Review and rotate logs

### Monthly Checks
- [ ] Update dependencies (security patches)
- [ ] Review and optimize database indexes
- [ ] Capacity planning review
- [ ] Disaster recovery drill
- [ ] Security audit

---

## Escalation Matrix

### Severity Levels

**P0 - Critical (Immediate Response)**
- Complete service outage
- Data loss or corruption
- Security breach
- **Response Time:** 15 minutes
- **Contact:** On-call engineer immediately

**P1 - High (1 Hour Response)**
- Partial service degradation
- Performance issues affecting multiple users
- Failed deployment
- **Response Time:** 1 hour
- **Contact:** DevOps team

**P2 - Medium (4 Hour Response)**
- Minor feature not working
- Single user issues
- Non-critical errors
- **Response Time:** 4 hours
- **Contact:** Support team

**P3 - Low (Next Business Day)**
- Enhancement requests
- Documentation updates
- Non-urgent improvements
- **Response Time:** Next business day
- **Contact:** Development team

---

## Post-Incident Checklist

After resolving any incident:

1. [ ] Document incident details
2. [ ] Document resolution steps
3. [ ] Update runbook if needed
4. [ ] Notify stakeholders
5. [ ] Schedule post-mortem (for P0/P1)
6. [ ] Implement preventive measures
7. [ ] Update monitoring/alerting

---

## Useful Commands Reference

```bash
# PM2
pm2 status
pm2 logs <app-name>
pm2 restart <app-name>
pm2 reload <app-name>
pm2 monit
pm2 describe <app-name>

# PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql
sudo -u postgres psql -d accident_app
\l  # List databases
\dt  # List tables
\q  # Quit

# Nginx
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System
free -h
df -h
top
htop
uptime
netstat -tulpn
ss -tulpn

# Logs
journalctl -u nginx -f
journalctl -u postgresql -f
tail -f /opt/accident-app/backend/logs/combined.log
```

---

## Emergency Procedures

### Complete System Failure

1. Check server accessibility: `ping yourdomain.com`
2. SSH into server: `ssh user@yourdomain.com`
3. Check all services: `sudo systemctl status nginx postgresql`
4. Check PM2: `pm2 status`
5. Review system logs: `sudo journalctl -xe`
6. Restart services in order:
   - PostgreSQL
   - Backend (PM2)
   - Nginx
7. Verify health: `curl https://yourdomain.com/health`
8. Monitor for 15 minutes
9. Notify stakeholders

### Data Corruption

1. **STOP** - Do not make changes
2. Create immediate backup: `./scripts/backup-database.sh emergency_$(date +%Y%m%d_%H%M%S)`
3. Contact Database Admin
4. Document corruption details
5. Assess impact
6. Plan restoration
7. Execute restoration with approval
8. Verify data integrity
9. Post-mortem analysis

---

## Contact Information

Update this section with your team's contact information:

- **On-Call Engineer:** [Phone/Email]
- **DevOps Lead:** [Email]
- **Database Admin:** [Email]
- **Security Team:** [Email]
- **Management:** [Email]
