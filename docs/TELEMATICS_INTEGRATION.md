# Telematics Integration & Kill Switch System

## Overview

The Fleet Accident Reporting System now includes telematics integration with automatic kill switch functionality. When a driver is involved in an accident, the system can automatically immobilize the vehicle until the accident reporting workflow is completed or a supervisor provides an override.

## Features

### 1. Telematics Provider Integration

Supports multiple telematics providers:
- **Geotab** - Industry-leading fleet telematics
- **Samsara** - Cloud-based fleet management
- **Verizon Connect** - GPS fleet tracking
- **Fleet Complete** - Fleet management solutions
- **Teletrac Navman** - GPS tracking and fleet management
- **Custom** - Configurable custom provider integration

### 2. Kill Switch Control

- **Automatic Engagement**: Kill switch engages when accident report is created
- **Workflow-Based Release**: Automatically releases when workflow is 100% complete
- **Manual Control**: Fleet admins can manually engage/disengage
- **Supervisor Override**: Emergency override system for urgent situations

### 3. AI Image Validation

All accident photos are automatically validated using AWS Rekognition:

**Detection Capabilities:**
- Vehicle damage detection and severity assessment
- License plate recognition (OCR)
- Text extraction from documents
- Image quality checks (blur, darkness)
- Inappropriate content detection
- Face detection and counting

**Validation Statuses:**
- `pending` - Awaiting validation
- `processing` - AI analysis in progress
- `valid` - Photo passed all checks
- `invalid` - Photo failed validation
- `flagged` - Inappropriate content detected
- `manual_review` - Requires human review

### 4. Workflow Completion Tracking

**Required Steps:**
1. Basic Information
2. Location Data
3. Accident Photos (minimum 2)
4. Photo Validation (AI)
5. Incident Description
6. Report Submission

**Optional Steps:**
- Witness Information
- Police Report Number

## Configuration

### Environment Variables

Add to `.env`:

```bash
# AI Image Validation
AI_PROVIDER=aws_rekognition
AI_MIN_CONFIDENCE=70

# Telematics & Kill Switch
ENCRYPTION_KEY=your_encryption_key_min_32_chars_here
KILL_SWITCH_AUTO_ENGAGE=true
KILL_SWITCH_TIMEOUT_HOURS=24

# AWS Rekognition (uses existing AWS credentials)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### Database Migration

Run the new migration to add telematics tables:

```bash
cd backend
npm run migrate
```

This creates:
- `telematics_providers` - Provider configurations
- `vehicles` - Vehicle/truck registry with kill switch status
- `kill_switch_events` - Event log for all kill switch actions
- `image_validations` - AI validation results
- `workflow_completions` - Workflow tracking
- `supervisor_override_requests` - Override request management

## API Endpoints

### Telematics & Vehicles

#### Get All Vehicles
```http
GET /api/telematics/vehicles
Authorization: Bearer {token}
```

Query Parameters:
- `status` - Filter by active/inactive
- `kill_switch_enabled` - Filter by kill switch capability

#### Get Vehicle by ID
```http
GET /api/telematics/vehicles/:id
Authorization: Bearer {token}
```

#### Create Vehicle
```http
POST /api/telematics/vehicles
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicle_number": "TRUCK-001",
  "vin": "1HGBH41JXMN109186",
  "make": "Freightliner",
  "model": "Cascadia",
  "year": 2023,
  "license_plate": "ABC1234",
  "telematics_device_id": "device-12345",
  "telematics_provider_id": "uuid",
  "kill_switch_enabled": true
}
```

#### Update Vehicle
```http
PUT /api/telematics/vehicles/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_driver_id": "uuid",
  "kill_switch_enabled": true
}
```

### Kill Switch Control

#### Engage Kill Switch
```http
POST /api/telematics/vehicles/:id/kill-switch/engage
Authorization: Bearer {token}
Content-Type: application/json

{
  "report_id": "uuid",
  "reason": "Accident workflow incomplete"
}
```

#### Disengage Kill Switch
```http
POST /api/telematics/vehicles/:id/kill-switch/disengage
Authorization: Bearer {token}
Content-Type: application/json

{
  "report_id": "uuid",
  "reason": "Workflow completed"
}
```

#### Get Kill Switch Events
```http
GET /api/telematics/vehicles/:id/kill-switch/events?limit=50
Authorization: Bearer {token}
```

### Telematics Providers

#### Get Providers
```http
GET /api/telematics/providers
Authorization: Bearer {token}
```

#### Create Provider
```http
POST /api/telematics/providers
Authorization: Bearer {token}
Content-Type: application/json

{
  "provider_name": "geotab",
  "api_key": "your_api_key",
  "api_secret": "your_api_secret",
  "api_endpoint": "https://my.geotab.com/apiv1",
  "additional_config": {
    "database": "your_database",
    "userName": "your_username"
  }
}
```

### Workflow Management

#### Get Workflow Status
```http
GET /api/workflow/:reportId
Authorization: Bearer {token}
```

Response:
```json
{
  "workflow": {
    "id": "uuid",
    "report_id": "uuid",
    "completion_percentage": 75,
    "is_complete": false,
    "kill_switch_engaged": true,
    "steps_required": [...],
    "steps_completed": [...],
    "pending_steps": [...]
  }
}
```

#### Initialize Workflow
```http
POST /api/workflow
Authorization: Bearer {token}
Content-Type: application/json

{
  "report_id": "uuid",
  "vehicle_id": "uuid",
  "driver_id": "uuid"
}
```

#### Update Workflow Step
```http
PUT /api/workflow/:reportId/steps/:stepId
Authorization: Bearer {token}
Content-Type: application/json

{
  "completed": true,
  "metadata": {
    "notes": "Step completed successfully"
  }
}
```

#### Validate Report Photos
```http
POST /api/workflow/:reportId/validate-photos
Authorization: Bearer {token}
```

### Supervisor Override

#### Request Override
```http
POST /api/workflow/:reportId/override-request
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicle_id": "uuid",
  "reason": "Emergency delivery - customer waiting",
  "urgency": "high"
}
```

Urgency levels: `low`, `medium`, `high`, `critical`

#### Get Pending Override Requests
```http
GET /api/workflow/override-requests/pending
Authorization: Bearer {token}
```

#### Approve Override
```http
POST /api/workflow/override-requests/:requestId/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Approved due to emergency situation"
}
```

#### Deny Override
```http
POST /api/workflow/override-requests/:requestId/deny
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Workflow must be completed first"
}
```

## Workflow Process

### 1. Accident Occurs

Driver creates accident report:
```javascript
POST /api/reports
{
  "incident_type": "accident",
  "vehicle_id": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "incident_date": "2024-01-15T10:30:00Z"
}
```

### 2. Workflow Initialized

System automatically initializes workflow:
```javascript
POST /api/workflow
{
  "report_id": "uuid",
  "vehicle_id": "uuid",
  "driver_id": "uuid"
}
```

### 3. Kill Switch Engaged

If vehicle has kill switch enabled, it's automatically engaged:
- Vehicle cannot start
- Driver receives notification
- Fleet manager alerted

### 4. Driver Completes Steps

Driver works through required steps:

**Upload Photos:**
```javascript
POST /api/uploads/photos/:reportId
FormData: { photo: file }
```

Photos are automatically validated by AI.

**Update Steps:**
```javascript
PUT /api/workflow/:reportId/steps/basic_info
{ "completed": true }

PUT /api/workflow/:reportId/steps/location
{ "completed": true }

PUT /api/workflow/:reportId/steps/photos
{ "completed": true }
```

### 5. Workflow Completion

When all required steps are complete:
- Workflow marked as 100% complete
- Kill switch automatically disengaged
- Vehicle becomes operational
- Driver can continue route

### 6. Emergency Override (Optional)

If driver needs vehicle immediately:

**Driver Requests Override:**
```javascript
POST /api/workflow/:reportId/override-request
{
  "vehicle_id": "uuid",
  "reason": "Emergency delivery",
  "urgency": "critical"
}
```

**Supervisor Reviews:**
```javascript
GET /api/workflow/override-requests/pending
```

**Supervisor Approves:**
```javascript
POST /api/workflow/override-requests/:requestId/approve
{
  "notes": "Approved - complete workflow within 2 hours"
}
```

Kill switch immediately disengaged.

## Provider-Specific Configuration

### Geotab

```json
{
  "provider_name": "geotab",
  "api_endpoint": "https://my.geotab.com/apiv1",
  "api_key": "session_id",
  "additional_config": {
    "database": "your_database",
    "userName": "your_username"
  }
}
```

### Samsara

```json
{
  "provider_name": "samsara",
  "api_endpoint": "https://api.samsara.com",
  "api_key": "bearer_token"
}
```

### Verizon Connect

```json
{
  "provider_name": "verizon_connect",
  "api_endpoint": "https://api.verizonconnect.com",
  "api_key": "username",
  "api_secret": "password"
}
```

### Custom Provider

```json
{
  "provider_name": "custom",
  "api_key": "your_api_key",
  "additional_config": {
    "endpoint": "https://api.yourprovider.com/vehicles/{deviceId}/immobilizer/{action}",
    "method": "POST",
    "headers": {
      "X-Custom-Header": "value"
    },
    "payload": {
      "custom_field": "value"
    }
  }
}
```

## AI Image Validation Details

### Automatic Validation

When a photo is uploaded, the system automatically:

1. **Detects Labels**: Identifies objects, vehicles, damage
2. **Extracts Text**: OCR for license plates, documents
3. **Checks Quality**: Blur, darkness, resolution
4. **Detects Faces**: Privacy and compliance
5. **Content Moderation**: Flags inappropriate content

### Validation Results

```json
{
  "validationId": "uuid",
  "status": "valid",
  "detected_labels": [
    { "name": "Car", "confidence": 98.5 },
    { "name": "Damage", "confidence": 92.3 }
  ],
  "is_vehicle_damage_detected": true,
  "damage_severity": "moderate",
  "extracted_text": "License Plate: ABC1234\nPolicy #: 12345",
  "text_confidence": 0.95,
  "detected_license_plates": [
    { "text": "ABC1234", "confidence": 96.2 }
  ],
  "image_quality_score": 0.88,
  "is_blurry": false,
  "is_dark": false,
  "has_faces": false
}
```

### Manual Review

If validation requires manual review:

```javascript
// Approve
POST /api/image-validations/:validationId/approve
{
  "reviewer_id": "uuid",
  "notes": "Damage clearly visible"
}

// Reject
POST /api/image-validations/:validationId/reject
{
  "reviewer_id": "uuid",
  "reason": "Photo too blurry, retake required"
}
```

## Security Considerations

### API Key Encryption

All telematics provider API keys are encrypted using AES-256-CBC:
- Keys encrypted before storage
- Decrypted only when needed for API calls
- Encryption key stored in environment variable

### Access Control

Permissions required:
- `vehicles:read` - View vehicles
- `vehicles:write` - Update vehicles
- `vehicles:create` - Create vehicles
- `kill_switch:read` - View kill switch status
- `kill_switch:write` - Control kill switch
- `override:request` - Request override (drivers)
- `override:approve` - Approve/deny overrides (supervisors)

### Audit Logging

All kill switch events are logged:
- Engagement/disengagement
- Override requests
- Override approvals/denials
- Includes user, timestamp, reason, location

## Monitoring & Alerts

### Key Metrics

Monitor these metrics:
- Kill switch engagement rate
- Average workflow completion time
- Override request frequency
- Image validation success rate
- Failed validation reasons

### Alerts

Set up alerts for:
- Kill switch engaged > 24 hours
- High override request rate
- Image validation failures
- Telematics API errors

## Troubleshooting

### Kill Switch Won't Engage

1. Check vehicle has `kill_switch_enabled = true`
2. Verify telematics provider is configured
3. Check `telematics_device_id` is correct
4. Review kill switch events log
5. Test provider API connectivity

### Kill Switch Won't Disengage

1. Verify workflow is 100% complete
2. Check all required photos are validated
3. Review pending workflow steps
4. Check for system errors in logs
5. Use supervisor override if urgent

### Image Validation Failing

1. Check AWS Rekognition credentials
2. Verify S3 bucket access
3. Review image quality (size, format)
4. Check AI confidence threshold
5. Review validation error logs

### Telematics API Errors

1. Verify API credentials are correct
2. Check provider API status
3. Review rate limits
4. Validate device IDs
5. Check network connectivity

## Best Practices

### For Fleet Managers

1. **Enable kill switch only on critical vehicles**
2. **Set reasonable workflow requirements**
3. **Monitor override requests closely**
4. **Review validation failures regularly**
5. **Train drivers on workflow process**

### For Drivers

1. **Take clear, well-lit photos**
2. **Capture multiple angles of damage**
3. **Include license plates in photos**
4. **Complete workflow promptly**
5. **Use override only for emergencies**

### For Supervisors

1. **Review override requests quickly**
2. **Document approval reasons**
3. **Follow up on approved overrides**
4. **Monitor workflow completion**
5. **Address recurring issues**

## Support

For issues or questions:
- Review logs: `pm2 logs accident-app-backend`
- Check health: `GET /health/detailed`
- Contact support with:
  - Vehicle ID
  - Report ID
  - Error messages
  - Kill switch event logs
