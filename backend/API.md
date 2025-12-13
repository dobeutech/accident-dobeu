# FleetGuard API Documentation

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.fleetguard.app/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### POST /auth/login

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "fleet_admin",
    "fleetId": "uuid",
    "fleetName": "ABC Trucking"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/register

Register a new user (typically done by fleet admin).

**Request Body:**
```json
{
  "email": "driver@example.com",
  "password": "securepassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "driver",
  "fleetId": "uuid"
}
```

### GET /auth/me

Get current authenticated user's information.

---

## Reports

### GET /reports

Get paginated list of reports.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| status | string | Filter by status: draft, submitted, under_review, closed |
| incident_type | string | Filter by type: accident, incident, near_miss |
| driver_id | uuid | Filter by driver |
| start_date | date | Filter from date |
| end_date | date | Filter to date |

**Response:**
```json
{
  "reports": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### POST /reports

Create a new accident report.

**Request Body:**
```json
{
  "incidentType": "accident",
  "incidentDate": "2024-01-15T14:30:00Z",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "123 Main St, New York, NY",
  "description": "Detailed description...",
  "vehicleInfo": {
    "unitId": "TRUCK-001",
    "make": "Freightliner",
    "model": "Cascadia",
    "year": 2022,
    "licensePlate": "ABC-1234"
  },
  "customFields": {},
  "inputLanguage": "en"
}
```

### GET /reports/:id

Get a single report with full details.

### PUT /reports/:id

Update a report.

### PUT /reports/:id/status

Update report status only.

**Request Body:**
```json
{
  "status": "under_review"
}
```

### DELETE /reports/:id

Delete a report (admin only).

---

## File Uploads

### POST /uploads/photos/:reportId

Upload a photo to a report.

**Request:**
- Content-Type: multipart/form-data
- Field name: "photo"
- Max size: 10MB
- Accepted formats: JPEG, PNG, WebP

**Response:**
```json
{
  "id": "uuid",
  "s3Key": "photos/report-uuid/photo-uuid.jpg",
  "url": "https://bucket.s3.amazonaws.com/...",
  "createdAt": "2024-01-15T14:35:00Z"
}
```

### POST /uploads/audio/:reportId

Upload an audio recording to a report.

### GET /uploads/signed-url/:fileKey

Get a temporary signed URL for a private file.

---

## Form Configuration

### GET /form-configs

Get all custom form fields for the fleet.

**Response:**
```json
{
  "fields": [
    {
      "id": "uuid",
      "fieldKey": "cargo_type",
      "fieldType": "dropdown",
      "label": "Cargo Type",
      "isRequired": true,
      "placeholder": "Select cargo type",
      "options": ["Dry goods", "Refrigerated", "Hazmat"],
      "displayOrder": 1
    }
  ]
}
```

### POST /form-configs

Create a new custom form field.

### PUT /form-configs/:id

Update a form field.

### DELETE /form-configs/:id

Delete a form field.

---

## RMIS Integration

### GET /rmis/integrations

Get configured RMIS integrations.

### POST /rmis/integrations

Configure a new RMIS integration.

**Request Body (Origami Risk):**
```json
{
  "integration_type": "origami_risk",
  "config": {
    "baseUrl": "https://api.origamirisk.com",
    "apiKey": "your-api-key",
    "clientId": "your-client-id",
    "autoPush": true
  }
}
```

**Request Body (Custom API):**
```json
{
  "integration_type": "custom_api",
  "config": {
    "endpointUrl": "https://your-api.com/incidents",
    "method": "POST",
    "headers": {
      "X-API-Key": "your-key"
    },
    "authType": "api_key",
    "fieldMapping": {
      "incident_id": "reportNumber",
      "description": "driverStatement"
    },
    "autoPush": false
  }
}
```

### POST /rmis/integrations/:type/test

Test an RMIS connection.

### POST /rmis/push/:reportId

Manually push a report to configured RMIS systems.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Optional: origami_risk, riskonnect, custom_api |

---

## Exports

### GET /exports/reports

Export reports in various formats.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | pdf, xlsx, csv, xml, json, zip |
| report_ids | string | Comma-separated report IDs |

**Response:** File download with appropriate content type.

---

## Users

### GET /users

Get all users in the fleet.

### POST /users

Create a new user.

### PUT /users/:id

Update a user.

### DELETE /users/:id

Deactivate a user.

---

## Admin Endpoints

### GET /admin/stats

Get platform-wide statistics (super_admin only).

### GET /admin/audit-logs

Get audit logs.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| action | string | Filter by action type |
| user_id | uuid | Filter by user |
| start_date | date | From date |
| end_date | date | To date |

---

## WebSocket Events

Connect to WebSocket at `/socket.io` with JWT token.

### Incoming Events (Server → Client)

| Event | Description |
|-------|-------------|
| `report:new` | New report created |
| `report:photo:new` | New photo uploaded |
| `report:status:updated` | Report status changed |

### Outgoing Events (Client → Server)

| Event | Description |
|-------|-------------|
| `report:started` | Driver started a new report |
| `report:photo:uploaded` | Photo upload completed |

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or expired token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting

- 100 requests per 15-minute window per IP
- Headers returned:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
