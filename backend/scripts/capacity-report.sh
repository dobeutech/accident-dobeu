#!/bin/bash

# Capacity Planning Report
# Generates a report on system resource usage and projections

echo "📊 Capacity Planning Report"
echo "Generated: $(date)"
echo "========================================"
echo ""

# System Information
echo "=== System Information ==="
echo "Hostname: $(hostname)"
echo "OS: $(uname -s) $(uname -r)"
echo "Uptime: $(uptime -p 2>/dev/null || uptime)"
echo ""

# CPU Information
echo "=== CPU Capacity ==="
echo "CPU Cores: $(nproc)"
echo "CPU Model: $(lscpu | grep "Model name" | cut -d: -f2 | xargs)"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d% -f1)
echo "Current CPU Usage: ${cpu_usage}%"
echo ""

# Memory Information
echo "=== Memory Capacity ==="
free -h | head -2
total_mem=$(free -m | awk 'NR==2{print $2}')
used_mem=$(free -m | awk 'NR==2{print $3}')
mem_percent=$((used_mem * 100 / total_mem))
echo "Memory Usage: ${mem_percent}%"
echo ""

# Disk Information
echo "=== Disk Capacity ==="
df -h / | tail -1
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "Root Disk Usage: ${disk_usage}%"
echo ""

# Database Information
if command -v psql &> /dev/null; then
    echo "=== Database Capacity ==="
    
    # Load environment
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Database size
    db_size=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));" 2>/dev/null | xargs)
    echo "Database Size: $db_size"
    
    # Connection count
    conn_count=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='${DB_NAME}';" 2>/dev/null | xargs)
    max_conn=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SHOW max_connections;" 2>/dev/null | xargs)
    echo "Database Connections: $conn_count / $max_conn"
    
    # Table sizes
    echo ""
    echo "Top 5 Largest Tables:"
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -c "
        SELECT schemaname||'.'||tablename AS table,
               pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 5;
    " 2>/dev/null
    echo ""
fi

# Application Metrics
if command -v pm2 &> /dev/null; then
    echo "=== Application Metrics ==="
    pm2 jlist | jq -r '.[] | "\(.name): \(.monit.memory / 1024 / 1024 | floor)MB memory, \(.monit.cpu)% CPU"' 2>/dev/null || pm2 list
    echo ""
fi

# Network Information
echo "=== Network Capacity ==="
echo "Active Connections:"
netstat -an 2>/dev/null | grep ESTABLISHED | wc -l || ss -an | grep ESTABLISHED | wc -l
echo ""

# Capacity Warnings
echo "=== Capacity Warnings ==="
warnings=0

if [ "$cpu_usage" -gt 80 ]; then
    echo "⚠️  CPU usage is high (${cpu_usage}%)"
    warnings=$((warnings + 1))
fi

if [ "$mem_percent" -gt 85 ]; then
    echo "⚠️  Memory usage is high (${mem_percent}%)"
    warnings=$((warnings + 1))
fi

if [ "$disk_usage" -gt 85 ]; then
    echo "⚠️  Disk usage is high (${disk_usage}%)"
    warnings=$((warnings + 1))
fi

if [ $warnings -eq 0 ]; then
    echo "✓ No capacity warnings"
fi

echo ""

# Recommendations
echo "=== Recommendations ==="

if [ "$mem_percent" -gt 70 ]; then
    echo "• Consider increasing memory allocation"
fi

if [ "$disk_usage" -gt 70 ]; then
    echo "• Plan for disk space expansion"
    echo "• Review and clean up old logs and backups"
fi

if [ "$cpu_usage" -gt 70 ]; then
    echo "• Monitor CPU usage trends"
    echo "• Consider horizontal scaling"
fi

echo ""
echo "========================================"
echo "Report Complete"
