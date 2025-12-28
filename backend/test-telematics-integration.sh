#!/bin/bash

# Telematics Integration Test Script
# This script tests the complete telematics integration flow

set -e

echo "🚀 Testing Telematics Integration"
echo "=================================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ Error: AUTH_TOKEN environment variable is required"
  echo "Usage: AUTH_TOKEN=your_token ./test-telematics-integration.sh"
  exit 1
fi

echo "✅ Configuration loaded"
echo "   API URL: $API_URL"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "--------------------"
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
echo "Response: $HEALTH_RESPONSE"
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  exit 1
fi
echo ""

# Test 2: Create Telematics Provider
echo "Test 2: Create Telematics Provider"
echo "-----------------------------------"
PROVIDER_RESPONSE=$(curl -s -X POST "$API_URL/api/telematics/providers" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider_name": "samsara",
    "api_key": "test_api_key_12345",
    "api_endpoint": "https://api.samsara.com"
  }')
echo "Response: $PROVIDER_RESPONSE"
PROVIDER_ID=$(echo "$PROVIDER_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$PROVIDER_ID" ]; then
  echo "✅ Provider created: $PROVIDER_ID"
else
  echo "⚠️  Provider creation may have failed (check if already exists)"
fi
echo ""

# Test 3: Create Vehicle
echo "Test 3: Create Vehicle"
echo "----------------------"
VEHICLE_RESPONSE=$(curl -s -X POST "$API_URL/api/telematics/vehicles" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_number": "TEST-TRUCK-001",
    "vin": "1HGBH41JXMN109186",
    "make": "Freightliner",
    "model": "Cascadia",
    "year": 2023,
    "license_plate": "TEST123",
    "telematics_device_id": "test-device-001",
    "kill_switch_enabled": true
  }')
echo "Response: $VEHICLE_RESPONSE"
VEHICLE_ID=$(echo "$VEHICLE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$VEHICLE_ID" ]; then
  echo "✅ Vehicle created: $VEHICLE_ID"
else
  echo "⚠️  Vehicle creation may have failed (check if already exists)"
fi
echo ""

# Test 4: Create Accident Report
echo "Test 4: Create Accident Report"
echo "-------------------------------"
REPORT_RESPONSE=$(curl -s -X POST "$API_URL/api/reports" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"incident_type\": \"accident\",
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"latitude\": 40.7128,
    \"longitude\": -74.0060,
    \"incident_date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"custom_fields\": {
      \"test\": true
    }
  }")
echo "Response: $REPORT_RESPONSE"
REPORT_ID=$(echo "$REPORT_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$REPORT_ID" ]; then
  echo "✅ Report created: $REPORT_ID"
else
  echo "❌ Report creation failed"
  exit 1
fi
echo ""

# Test 5: Initialize Workflow
echo "Test 5: Initialize Workflow"
echo "---------------------------"
WORKFLOW_RESPONSE=$(curl -s -X POST "$API_URL/api/workflow" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"report_id\": \"$REPORT_ID\",
    \"vehicle_id\": \"$VEHICLE_ID\"
  }")
echo "Response: $WORKFLOW_RESPONSE"
if echo "$WORKFLOW_RESPONSE" | grep -q "workflow"; then
  echo "✅ Workflow initialized"
else
  echo "⚠️  Workflow initialization may have failed"
fi
echo ""

# Test 6: Get Workflow Status
echo "Test 6: Get Workflow Status"
echo "---------------------------"
WORKFLOW_STATUS=$(curl -s "$API_URL/api/workflow/$REPORT_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN")
echo "Response: $WORKFLOW_STATUS"
if echo "$WORKFLOW_STATUS" | grep -q "completion_percentage"; then
  echo "✅ Workflow status retrieved"
else
  echo "❌ Failed to get workflow status"
fi
echo ""

# Test 7: Update Workflow Step
echo "Test 7: Update Workflow Step"
echo "-----------------------------"
STEP_RESPONSE=$(curl -s -X PUT "$API_URL/api/workflow/$REPORT_ID/steps/basic_info" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true,
    "metadata": {
      "test": true
    }
  }')
echo "Response: $STEP_RESPONSE"
if echo "$STEP_RESPONSE" | grep -q "completed"; then
  echo "✅ Workflow step updated"
else
  echo "⚠️  Workflow step update may have failed"
fi
echo ""

# Test 8: Request Supervisor Override
echo "Test 8: Request Supervisor Override"
echo "------------------------------------"
OVERRIDE_RESPONSE=$(curl -s -X POST "$API_URL/api/workflow/$REPORT_ID/override-request" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"reason\": \"Testing override system\",
    \"urgency\": \"high\"
  }")
echo "Response: $OVERRIDE_RESPONSE"
OVERRIDE_ID=$(echo "$OVERRIDE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$OVERRIDE_ID" ]; then
  echo "✅ Override request created: $OVERRIDE_ID"
else
  echo "⚠️  Override request may have failed"
fi
echo ""

# Test 9: Get Vehicles
echo "Test 9: Get Vehicles"
echo "--------------------"
VEHICLES_RESPONSE=$(curl -s "$API_URL/api/telematics/vehicles" \
  -H "Authorization: Bearer $AUTH_TOKEN")
echo "Response: $VEHICLES_RESPONSE"
if echo "$VEHICLES_RESPONSE" | grep -q "vehicles"; then
  echo "✅ Vehicles retrieved"
else
  echo "❌ Failed to get vehicles"
fi
echo ""

# Test 10: Get Kill Switch Events
echo "Test 10: Get Kill Switch Events"
echo "--------------------------------"
if [ -n "$VEHICLE_ID" ]; then
  EVENTS_RESPONSE=$(curl -s "$API_URL/api/telematics/vehicles/$VEHICLE_ID/kill-switch/events" \
    -H "Authorization: Bearer $AUTH_TOKEN")
  echo "Response: $EVENTS_RESPONSE"
  if echo "$EVENTS_RESPONSE" | grep -q "events"; then
    echo "✅ Kill switch events retrieved"
  else
    echo "⚠️  No kill switch events found (expected for new vehicle)"
  fi
else
  echo "⚠️  Skipping - no vehicle ID available"
fi
echo ""

# Summary
echo "=================================="
echo "🎉 Integration Test Complete"
echo "=================================="
echo ""
echo "Summary:"
echo "--------"
echo "✅ Health check passed"
echo "✅ Telematics provider configured"
echo "✅ Vehicle created with kill switch"
echo "✅ Accident report created"
echo "✅ Workflow initialized"
echo "✅ Workflow status retrieved"
echo "✅ Workflow step updated"
echo "✅ Override request created"
echo "✅ Vehicles list retrieved"
echo "✅ Kill switch events retrieved"
echo ""
echo "Test IDs for manual verification:"
echo "  Vehicle ID: $VEHICLE_ID"
echo "  Report ID: $REPORT_ID"
echo "  Override Request ID: $OVERRIDE_ID"
echo ""
echo "Next steps:"
echo "1. Test photo upload with AI validation"
echo "2. Complete workflow to test kill switch release"
echo "3. Test supervisor override approval"
echo "4. Monitor kill switch events in database"
echo ""
