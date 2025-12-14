#!/bin/bash

# Incident Response Automation Script
# Quick diagnostics and recovery actions

ACTION="${1:-status}"

case "$ACTION" in
  status)
    echo "=== System Status ==="
    pm2 status
    echo ""
    echo "=== Health Check ==="
    curl -s http://localhost:3000/health | jq .
    ;;
    
  restart)
    echo "Restarting application..."
    pm2 restart accident-app-backend
    sleep 5
    curl -s http://localhost:3000/health
    ;;
    
  logs)
    echo "=== Recent Error Logs ==="
    pm2 logs accident-app-backend --err --lines 50
    ;;
    
  memory)
    echo "=== Memory Usage ==="
    free -h
    echo ""
    pm2 monit
    ;;
    
  connections)
    echo "=== Database Connections ==="
    sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='accident_app';"
    ;;
    
  backup)
    echo "Creating emergency backup..."
    ./scripts/backup-database.sh "emergency_$(date +%Y%m%d_%H%M%S)"
    ;;
    
  *)
    echo "Usage: $0 {status|restart|logs|memory|connections|backup}"
    exit 1
    ;;
esac
