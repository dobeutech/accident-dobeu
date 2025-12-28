#!/bin/bash

# Environment Configuration Checker
# Validates all required environment variables and external service connectivity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "=================================="
echo "Environment Configuration Checker"
echo "=================================="
echo ""

# Function to check if variable is set
check_var() {
    local var_name=$1
    local required=$2
    local description=$3
    
    if [ -z "${!var_name}" ]; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ MISSING${NC}: $var_name - $description"
            ((ERRORS++))
        else
            echo -e "${YELLOW}⚠️  OPTIONAL${NC}: $var_name - $description (not set)"
            ((WARNINGS++))
        fi
        return 1
    else
        echo -e "${GREEN}✅ OK${NC}: $var_name"
        return 0
    fi
}

# Load .env file if it exists
if [ -f "backend/.env" ]; then
    echo "Loading environment from backend/.env"
    export $(cat backend/.env | grep -v '^#' | xargs)
    echo ""
elif [ -f ".env" ]; then
    echo "Loading environment from .env"
    export $(cat .env | grep -v '^#' | xargs)
    echo ""
else
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    echo ""
fi

echo "Checking Required Variables..."
echo "------------------------------"

# Server Configuration
check_var "NODE_ENV" true "Node environment (development/production)"
check_var "PORT" true "Server port"

# Database Configuration
check_var "DB_HOST" true "Database host"
check_var "DB_PORT" true "Database port"
check_var "DB_NAME" true "Database name"
check_var "DB_USER" true "Database user"
check_var "DB_PASSWORD" true "Database password"

# JWT Configuration
check_var "JWT_SECRET" true "JWT secret key (min 32 chars)"
check_var "JWT_EXPIRES_IN" false "JWT expiration time"

# AWS Configuration
check_var "AWS_REGION" true "AWS region"
check_var "AWS_ACCESS_KEY_ID" true "AWS access key"
check_var "AWS_SECRET_ACCESS_KEY" true "AWS secret key"
check_var "AWS_S3_BUCKET" true "S3 bucket name"

# AI Configuration
check_var "AI_PROVIDER" true "AI provider (aws_rekognition)"
check_var "AI_MIN_CONFIDENCE" false "AI minimum confidence threshold"

# Telematics Configuration
check_var "ENCRYPTION_KEY" true "Encryption key for API credentials"
check_var "KILL_SWITCH_AUTO_ENGAGE" false "Auto-engage kill switch"

# CORS Configuration
check_var "CORS_ORIGIN" true "CORS allowed origins"

# Session Configuration
check_var "SESSION_SECRET" true "Session secret key"
check_var "COOKIE_SECURE" false "Secure cookie flag"

echo ""
echo "Checking Optional Variables..."
echo "------------------------------"

# Email Configuration (Optional)
check_var "SMTP_HOST" false "SMTP host for email"
check_var "SMTP_PORT" false "SMTP port"
check_var "SMTP_USER" false "SMTP username"
check_var "SMTP_PASSWORD" false "SMTP password"

# Monitoring (Optional)
check_var "SENTRY_DSN" false "Sentry DSN for error tracking"
check_var "NEW_RELIC_LICENSE_KEY" false "New Relic license key"

echo ""
echo "Checking External Service Connectivity..."
echo "------------------------------------------"

# Check Database Connection
if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
    echo -n "Testing database connection... "
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" &> /dev/null; then
            echo -e "${GREEN}✅ Connected${NC}"
        else
            echo -e "${RED}❌ Cannot connect${NC}"
            ((ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠️  pg_isready not installed, skipping${NC}"
        ((WARNINGS++))
    fi
fi

# Check AWS S3 Access
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_S3_BUCKET" ]; then
    echo -n "Testing AWS S3 access... "
    if command -v aws &> /dev/null; then
        if aws s3 ls "s3://$AWS_S3_BUCKET" --region "$AWS_REGION" &> /dev/null; then
            echo -e "${GREEN}✅ Accessible${NC}"
        else
            echo -e "${RED}❌ Cannot access bucket${NC}"
            ((ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠️  AWS CLI not installed, skipping${NC}"
        ((WARNINGS++))
    fi
fi

# Check AWS Rekognition Access
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    echo -n "Testing AWS Rekognition access... "
    if command -v aws &> /dev/null; then
        if aws rekognition describe-collection --collection-id test-collection --region "$AWS_REGION" &> /dev/null 2>&1 || [ $? -eq 254 ]; then
            echo -e "${GREEN}✅ Accessible${NC}"
        else
            echo -e "${YELLOW}⚠️  Cannot verify (may need permissions)${NC}"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠️  AWS CLI not installed, skipping${NC}"
        ((WARNINGS++))
    fi
fi

# Check Redis Connection (if configured)
if [ -n "$REDIS_HOST" ]; then
    echo -n "Testing Redis connection... "
    if command -v redis-cli &> /dev/null; then
        if redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" ping &> /dev/null; then
            echo -e "${GREEN}✅ Connected${NC}"
        else
            echo -e "${RED}❌ Cannot connect${NC}"
            ((ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠️  redis-cli not installed, skipping${NC}"
        ((WARNINGS++))
    fi
fi

echo ""
echo "Checking Security Configuration..."
echo "----------------------------------"

# Check JWT Secret Length
if [ -n "$JWT_SECRET" ]; then
    JWT_LENGTH=${#JWT_SECRET}
    if [ $JWT_LENGTH -lt 32 ]; then
        echo -e "${RED}❌ JWT_SECRET too short${NC}: $JWT_LENGTH chars (minimum 32)"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅ JWT_SECRET length OK${NC}: $JWT_LENGTH chars"
    fi
fi

# Check Session Secret Length
if [ -n "$SESSION_SECRET" ]; then
    SESSION_LENGTH=${#SESSION_SECRET}
    if [ $SESSION_LENGTH -lt 32 ]; then
        echo -e "${RED}❌ SESSION_SECRET too short${NC}: $SESSION_LENGTH chars (minimum 32)"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅ SESSION_SECRET length OK${NC}: $SESSION_LENGTH chars"
    fi
fi

# Check Encryption Key Length
if [ -n "$ENCRYPTION_KEY" ]; then
    ENCRYPTION_LENGTH=${#ENCRYPTION_KEY}
    if [ $ENCRYPTION_LENGTH -lt 32 ]; then
        echo -e "${RED}❌ ENCRYPTION_KEY too short${NC}: $ENCRYPTION_LENGTH chars (minimum 32)"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅ ENCRYPTION_KEY length OK${NC}: $ENCRYPTION_LENGTH chars"
    fi
fi

# Check if running in production with secure settings
if [ "$NODE_ENV" = "production" ]; then
    echo ""
    echo "Production Environment Checks..."
    echo "--------------------------------"
    
    if [ "$COOKIE_SECURE" != "true" ]; then
        echo -e "${RED}❌ COOKIE_SECURE should be true in production${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅ COOKIE_SECURE is true${NC}"
    fi
    
    if [[ "$CORS_ORIGIN" == "*" ]]; then
        echo -e "${RED}❌ CORS_ORIGIN should not be * in production${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅ CORS_ORIGIN is restricted${NC}"
    fi
fi

echo ""
echo "=================================="
echo "Summary"
echo "=================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Your environment is properly configured."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s)${NC}"
    echo ""
    echo "Environment is functional but has optional items missing."
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s), $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors before running the application."
    echo ""
    echo "Quick fixes:"
    echo "1. Copy .env.example to .env: cp backend/.env.example backend/.env"
    echo "2. Update the .env file with your configuration"
    echo "3. Ensure all required services are running"
    echo "4. Run this script again to verify"
    exit 1
fi
