#!/bin/bash

# SSL Certificate Monitoring Script
# Usage: ./scripts/check-ssl.sh [domain]

DOMAIN="${1:-yourdomain.com}"
WARN_DAYS=30
ALERT_DAYS=7

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "🔒 Checking SSL Certificate for: $DOMAIN"
echo ""

# Check if domain is reachable
if ! ping -c 1 "$DOMAIN" &> /dev/null; then
    echo -e "${RED}✗ Domain not reachable${NC}"
    exit 1
fi

# Get certificate expiry date
expiry_date=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

if [ -z "$expiry_date" ]; then
    echo -e "${RED}✗ Could not retrieve certificate${NC}"
    exit 1
fi

# Convert to epoch
expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null)
current_epoch=$(date +%s)
days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

echo "Certificate Information:"
echo "  Expiry Date: $expiry_date"
echo "  Days Until Expiry: $days_until_expiry"
echo ""

# Check certificate details
echo "Certificate Details:"
echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -subject -issuer 2>/dev/null

echo ""

# Status check
if [ $days_until_expiry -lt 0 ]; then
    echo -e "${RED}✗ EXPIRED${NC} - Certificate has expired!"
    exit 2
elif [ $days_until_expiry -lt $ALERT_DAYS ]; then
    echo -e "${RED}✗ CRITICAL${NC} - Certificate expires in $days_until_expiry days!"
    echo "Action required: Renew certificate immediately"
    exit 2
elif [ $days_until_expiry -lt $WARN_DAYS ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} - Certificate expires in $days_until_expiry days"
    echo "Action recommended: Plan certificate renewal"
    exit 1
else
    echo -e "${GREEN}✓ OK${NC} - Certificate is valid for $days_until_expiry days"
    exit 0
fi
