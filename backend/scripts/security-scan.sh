#!/bin/bash

# Local Security Scan Script
# Run this before committing or deploying

set -e

echo "🔒 Running Security Scans..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES_FOUND=0

# 1. NPM Audit
echo "📦 Checking for vulnerable dependencies..."
cd backend
if npm audit --audit-level=high; then
    echo -e "${GREEN}✓ No high/critical vulnerabilities found${NC}"
else
    echo -e "${RED}✗ Vulnerabilities found in dependencies${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
cd ..

# 2. Check for secrets in code
echo ""
echo "🔑 Scanning for exposed secrets..."
if command -v gitleaks &> /dev/null; then
    if gitleaks detect --source . --verbose; then
        echo -e "${GREEN}✓ No secrets detected${NC}"
    else
        echo -e "${RED}✗ Potential secrets found${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${YELLOW}⚠ gitleaks not installed, skipping secret scan${NC}"
    echo "Install with: brew install gitleaks (macOS) or download from https://github.com/gitleaks/gitleaks"
fi

# 3. Check for common security issues
echo ""
echo "🛡️  Checking for common security issues..."

# Check for console.log in production code
if grep -r "console\.log" backend/src --exclude-dir=__tests__ --exclude-dir=node_modules > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ console.log statements found (should use logger)${NC}"
fi

# Check for eval usage
if grep -r "eval(" backend/src web/src --exclude-dir=node_modules > /dev/null 2>&1; then
    echo -e "${RED}✗ eval() usage found (security risk)${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check for SQL string concatenation
if grep -r "SELECT.*+\|INSERT.*+\|UPDATE.*+\|DELETE.*+" backend/src --exclude-dir=__tests__ --exclude-dir=node_modules > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Potential SQL injection risk (string concatenation in queries)${NC}"
fi

# Check for hardcoded credentials
if grep -rE "(password|secret|key)\s*=\s*['\"][^'\"]+['\"]" backend/src web/src --exclude-dir=node_modules --exclude=".env.example" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Potential hardcoded credentials found${NC}"
fi

# 4. Check environment configuration
echo ""
echo "⚙️  Checking environment configuration..."

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠ backend/.env not found (required for production)${NC}"
fi

if [ -f "backend/.env" ]; then
    # Check JWT_SECRET length
    JWT_SECRET=$(grep "^JWT_SECRET=" backend/.env | cut -d '=' -f2)
    if [ ${#JWT_SECRET} -lt 32 ]; then
        echo -e "${RED}✗ JWT_SECRET is too short (minimum 32 characters)${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Check SESSION_SECRET length
    SESSION_SECRET=$(grep "^SESSION_SECRET=" backend/.env | cut -d '=' -f2)
    if [ ${#SESSION_SECRET} -lt 32 ]; then
        echo -e "${RED}✗ SESSION_SECRET is too short (minimum 32 characters)${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

# 5. Check file permissions
echo ""
echo "🔐 Checking file permissions..."

# Check for world-writable files
if find . -type f -perm -002 ! -path "*/node_modules/*" ! -path "*/.git/*" | grep -q .; then
    echo -e "${YELLOW}⚠ World-writable files found${NC}"
    find . -type f -perm -002 ! -path "*/node_modules/*" ! -path "*/.git/*"
fi

# Check script permissions
if [ -f "backend/scripts/backup-database.sh" ] && [ ! -x "backend/scripts/backup-database.sh" ]; then
    echo -e "${YELLOW}⚠ Backup script is not executable${NC}"
fi

# 6. Check for outdated packages
echo ""
echo "📦 Checking for outdated packages..."
cd backend
OUTDATED=$(npm outdated --json 2>/dev/null || echo "{}")
if [ "$OUTDATED" != "{}" ]; then
    echo -e "${YELLOW}⚠ Outdated packages found${NC}"
    npm outdated
fi
cd ..

# Summary
echo ""
echo "================================"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ Security scan completed - No critical issues found${NC}"
    exit 0
else
    echo -e "${RED}✗ Security scan completed - $ISSUES_FOUND critical issue(s) found${NC}"
    echo "Please fix the issues before deploying to production"
    exit 1
fi
