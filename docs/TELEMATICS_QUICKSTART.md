# Telematics Integration - Quick Start Guide

## Setup in 5 Minutes

### Step 1: Update Environment Variables

Add to `backend/.env`:

```bash
# AI Image Validation
AI_PROVIDER=aws_rekognition
AI_MIN_CONFIDENCE=70

# Telematics & Kill Switch
ENCRYPTION_KEY=your_32_char_encryption_key_here
KILL_SWITCH_AUTO_ENGAGE=true
KILL_SWITCH_TIMEOUT_HOURS=24
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

### Step 3: Run Database Migration

```bash
npm run migrate
```

This creates all necessary tables for telematics, vehicles, kill switch, and image validation.

### Step 4: Restart Server

```bash
npm run dev
# or for production
pm2 restart accident-app-backend
```

### Step 5: Configure Telematics Provider

**Option A: Using API**

```bash
curl -X POST http://localhost:3000/api/telematics/providers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider_name": "geotab",
    "api_key": "your_geotab_session_id",
    "api_endpoint": "https://my.geotab.com/apiv1",
    "additional_config": {
      "database": "your_database",
      "userName": "your_username"
    }
  }'
```

**Option B: Using SQL**

```sql
INSERT INTO telematics_providers (
  fleet_id, 
  provider_name, 
  api_key_encrypted, 
  api_endpoint
) VALUES (
  'your-fleet-uuid',
  'samsara',
  'encrypted_api_key',
  'https://api.samsara.com'
);
```

### Step 6: Add Vehicles

```bash
curl -X POST http://localhost:3000/api/telematics/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_number": "TRUCK-001",
    "vin": "1HGBH41JXMN109186",
    "make": "Freightliner",
    "model": "Cascadia",
    "year": 2023,
    "license_plate": "ABC1234",
    "telematics_device_id": "device-12345",
    "kill_switch_enabled": true
  }'
```

## Testing the Integration

### Test 1: Create Accident Report with Vehicle

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incident_type": "accident",
    "vehicle_id": "your-vehicle-uuid",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "incident_date": "2024-01-15T10:30:00Z"
  }'
```

### Test 2: Initialize Workflow

```bash
curl -X POST http://localhost:3000/api/workflow \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "report_id": "your-report-uuid",
    "vehicle_id": "your-vehicle-uuid",
    "driver_id": "your-driver-uuid"
  }'
```

**Expected Result:** Kill switch should engage automatically if enabled.

### Test 3: Upload Photo with AI Validation

```bash
curl -X POST http://localhost:3000/api/uploads/photos/your-report-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@/path/to/accident-photo.jpg"
```

**Expected Result:** Photo uploaded and AI validation starts automatically.

### Test 4: Check Workflow Status

```bash
curl -X GET http://localhost:3000/api/workflow/your-report-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "workflow": {
    "completion_percentage": 40,
    "is_complete": false,
    "kill_switch_engaged": true,
    "steps_completed": [
      { "id": "basic_info", "completedAt": "2024-01-15T10:35:00Z" },
      { "id": "photos", "completedAt": "2024-01-15T10:36:00Z" }
    ],
    "pending_steps": [
      { "id": "photo_validation", "name": "Photo Validation" },
      { "id": "description", "name": "Incident Description" },
      { "id": "submission", "name": "Report Submission" }
    ]
  }
}
```

### Test 5: Request Supervisor Override

```bash
curl -X POST http://localhost:3000/api/workflow/your-report-uuid/override-request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "your-vehicle-uuid",
    "reason": "Emergency delivery - testing override system",
    "urgency": "high"
  }'
```

### Test 6: Approve Override (as Supervisor)

```bash
curl -X POST http://localhost:3000/api/workflow/override-requests/request-uuid/approve \
  -H "Authorization: Bearer SUPERVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Approved for testing purposes"
  }'
```

**Expected Result:** Kill switch should disengage immediately.

## Common Use Cases

### Use Case 1: Standard Accident Flow

1. Driver creates accident report
2. Kill switch engages automatically
3. Driver uploads photos (AI validates)
4. Driver completes all workflow steps
5. Kill switch releases automatically
6. Driver continues route

### Use Case 2: Emergency Override

1. Driver creates accident report
2. Kill switch engages
3. Driver needs to move vehicle urgently
4. Driver requests supervisor override
5. Supervisor reviews and approves
6. Kill switch releases
7. Driver completes workflow later

### Use Case 3: Photo Validation Failure

1. Driver uploads blurry photo
2. AI marks as "manual_review"
3. Fleet manager reviews photo
4. Manager requests retake
5. Driver uploads new photo
6. AI validates successfully
7. Workflow continues

## Verification Checklist

- [ ] Database migration completed successfully
- [ ] New API routes accessible
- [ ] Telematics provider configured
- [ ] At least one vehicle added with kill switch enabled
- [ ] Test accident report created
- [ ] Workflow initialized
- [ ] Kill switch engaged automatically
- [ ] Photo uploaded and validated by AI
- [ ] Workflow status shows correct completion percentage
- [ ] Override request created and processed
- [ ] Kill switch released after workflow completion

## Troubleshooting Quick Fixes

### "Migration failed"
```bash
# Check database connection
psql -h localhost -U postgres -d accident_app

# Rollback and retry
npm run migrate
```

### "Kill switch not engaging"
```sql
-- Verify vehicle configuration
SELECT * FROM vehicles WHERE id = 'your-vehicle-uuid';

-- Check kill_switch_enabled = true
UPDATE vehicles SET kill_switch_enabled = true WHERE id = 'your-vehicle-uuid';
```

### "Image validation not working"
```bash
# Check AWS credentials
aws rekognition detect-labels --image "S3Object={Bucket=your-bucket,Name=test.jpg}" --region us-east-1

# Verify environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_REGION
```

### "Telematics API errors"
```bash
# Test provider API directly
curl -X POST https://api.samsara.com/fleet/vehicles/test \
  -H "Authorization: Bearer YOUR_API_KEY"

# Check encrypted credentials
SELECT provider_name, api_endpoint, is_active FROM telematics_providers;
```

## Next Steps

1. **Configure Mobile App**: Update mobile app to show workflow progress and kill switch status
2. **Set Up Monitoring**: Configure alerts for kill switch events
3. **Train Users**: Provide training on new workflow requirements
4. **Customize Workflow**: Adjust required steps based on your needs
5. **Review Policies**: Update company policies for kill switch usage

## Support Resources

- **Full Documentation**: [TELEMATICS_INTEGRATION.md](./TELEMATICS_INTEGRATION.md)
- **API Reference**: See API endpoints section in main docs
- **Logs**: `pm2 logs accident-app-backend`
- **Health Check**: `GET /health/detailed`

## Configuration Examples

### Minimal Configuration (Testing)

```bash
# .env
AI_PROVIDER=aws_rekognition
AI_MIN_CONFIDENCE=60
ENCRYPTION_KEY=test_key_for_development_only_32c
KILL_SWITCH_AUTO_ENGAGE=false
```

### Production Configuration

```bash
# .env
AI_PROVIDER=aws_rekognition
AI_MIN_CONFIDENCE=75
ENCRYPTION_KEY=your_secure_random_32_character_key
KILL_SWITCH_AUTO_ENGAGE=true
KILL_SWITCH_TIMEOUT_HOURS=24
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### High-Security Configuration

```bash
# .env
AI_PROVIDER=aws_rekognition
AI_MIN_CONFIDENCE=85
ENCRYPTION_KEY=your_very_secure_random_key_here
KILL_SWITCH_AUTO_ENGAGE=true
KILL_SWITCH_TIMEOUT_HOURS=12
# Require manual review for all validations
IMAGE_VALIDATION_REQUIRE_MANUAL_REVIEW=true
```

## Performance Tips

1. **Batch Photo Uploads**: Upload multiple photos at once
2. **Async Validation**: AI validation runs asynchronously
3. **Cache Results**: Validation results are cached
4. **Monitor API Limits**: AWS Rekognition has rate limits
5. **Optimize Images**: Compress photos before upload

## Security Best Practices

1. **Rotate API Keys**: Change telematics API keys regularly
2. **Audit Logs**: Review kill switch events weekly
3. **Access Control**: Limit override approval permissions
4. **Encryption**: Use strong encryption key (32+ characters)
5. **HTTPS Only**: Always use HTTPS in production

---

**Ready to go!** Your telematics integration is now active. Test thoroughly before production deployment.
