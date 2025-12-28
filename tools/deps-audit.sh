#!/bin/bash

# Dependency Security Audit Tool
# Checks for vulnerabilities in npm dependencies

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=================================="
echo "Dependency Security Audit"
echo "=================================="
echo ""

cd backend

echo "Running npm audit..."
echo "--------------------"
echo ""

# Run npm audit and capture output
if npm audit --production --json > /tmp/npm-audit.json 2>&1; then
    echo -e "${GREEN}✅ No vulnerabilities found!${NC}"
    AUDIT_PASSED=true
else
    AUDIT_PASSED=false
fi

# Parse and display results
if [ -f /tmp/npm-audit.json ]; then
    # Extract vulnerability counts
    CRITICAL=$(cat /tmp/npm-audit.json | grep -o '"critical":[0-9]*' | cut -d':' -f2 || echo "0")
    HIGH=$(cat /tmp/npm-audit.json | grep -o '"high":[0-9]*' | cut -d':' -f2 || echo "0")
    MODERATE=$(cat /tmp/npm-audit.json | grep -o '"moderate":[0-9]*' | cut -d':' -f2 || echo "0")
    LOW=$(cat /tmp/npm-audit.json | grep -o '"low":[0-9]*' | cut -d':' -f2 || echo "0")
    
    echo ""
    echo "Vulnerability Summary:"
    echo "----------------------"
    
    if [ "$CRITICAL" != "0" ]; then
        echo -e "${RED}Critical: $CRITICAL${NC}"
    fi
    if [ "$HIGH" != "0" ]; then
        echo -e "${RED}High: $HIGH${NC}"
    fi
    if [ "$MODERATE" != "0" ]; then
        echo -e "${YELLOW}Moderate: $MODERATE${NC}"
    fi
    if [ "$LOW" != "0" ]; then
        echo -e "${BLUE}Low: $LOW${NC}"
    fi
    
    if [ "$CRITICAL" = "0" ] && [ "$HIGH" = "0" ] && [ "$MODERATE" = "0" ] && [ "$LOW" = "0" ]; then
        echo -e "${GREEN}No vulnerabilities found${NC}"
    fi
fi

echo ""
echo "Checking for outdated packages..."
echo "----------------------------------"
echo ""

npm outdated || true

echo ""
echo "Checking package licenses..."
echo "----------------------------"
echo ""

if command -v license-checker &> /dev/null; then
    license-checker --summary
else
    echo -e "${YELLOW}⚠️  license-checker not installed${NC}"
    echo "Install with: npm install -g license-checker"
fi

echo ""
echo "Recommendations:"
echo "----------------"

if [ "$AUDIT_PASSED" = false ]; then
    echo "1. Review vulnerabilities: npm audit"
    echo "2. Fix automatically: npm audit fix"
    echo "3. Fix breaking changes: npm audit fix --force"
    echo "4. Review each fix: npm audit fix --dry-run"
fi

echo ""
echo "Additional Security Tools:"
echo "-------------------------"
echo "• Snyk: npm install -g snyk && snyk test"
echo "• OWASP Dependency Check"
echo "• GitHub Dependabot (already configured)"

echo ""

if [ "$CRITICAL" != "0" ] || [ "$HIGH" != "0" ]; then
    echo -e "${RED}❌ Critical or High vulnerabilities found!${NC}"
    echo "Please fix before deploying to production."
    exit 1
else
    echo -e "${GREEN}✅ No critical vulnerabilities${NC}"
    exit 0
fi
