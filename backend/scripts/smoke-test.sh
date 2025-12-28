#!/bin/bash

# Smoke Tests - Quick validation after deployment
# Usage: ./scripts/smoke-test.sh [base_url]

set -e

BASE_URL="${1:-http://localhost:3000}"
FAILED=0
PASSED=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔥 Running Smoke Tests..."
echo "Target: $BASE_URL"
echo ""

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local method="${4:-GET}"
    
    echo -n "Testing: $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$url" 2>&1)
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $response)"
        FAILED=$((FAILED + 1))
    fi
}

# Test with JSON response
test_json_endpoint() {
    local name="$1"
    local url="$2"
    local expected_field="$3"
    
    echo -n "Testing: $name... "
    
    response=$(curl -s "$BASE_URL$url" 2>&1)
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✓ PASS${NC} (Found '$expected_field')"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Field '$expected_field' not found)"
        FAILED=$((FAILED + 1))
    fi
}

# Run tests
echo "=== Core Health Checks ==="
test_endpoint "Basic Health" "/health" 200
test_json_endpoint "Health Status" "/health" "status"
test_endpoint "Detailed Health" "/health/detailed" 200
test_endpoint "Readiness Check" "/health/ready" 200
test_endpoint "Liveness Check" "/health/live" 200
test_endpoint "Metrics Endpoint" "/health/metrics" 200

echo ""
echo "=== API Endpoints ==="
test_endpoint "CSRF Token" "/api/csrf-token" 200
test_endpoint "Auth - No Credentials" "/api/auth/me" 401
test_endpoint "Auth - Login (No Body)" "/api/auth/login" 400 POST

echo ""
echo "=== Static & CORS ==="
test_endpoint "CORS Preflight" "/api/health" 200 OPTIONS

echo ""
echo "=== Security Headers ==="
echo -n "Testing: Security Headers... "
headers=$(curl -s -I "$BASE_URL/health" 2>&1)

if echo "$headers" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✓ PASS${NC} (Security headers present)"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ WARN${NC} (Some security headers missing)"
fi

echo ""
echo "=== Performance Check ==="
echo -n "Testing: Response Time... "
start_time=$(date +%s%N)
curl -s "$BASE_URL/health" > /dev/null
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

if [ $duration -lt 1000 ]; then
    echo -e "${GREEN}✓ PASS${NC} (${duration}ms)"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ SLOW${NC} (${duration}ms)"
fi

# Summary
echo ""
echo "================================"
echo "Smoke Test Results:"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo "================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All smoke tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some smoke tests failed!${NC}"
    exit 1
fi
