# Telematics Integration - System Flow Diagrams

## 1. Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Fleet Accident Reporting System               │
│                     with Telematics Integration                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Driver     │         │   Fleet      │         │  Supervisor  │
│   Mobile     │         │   Manager    │         │   Dashboard  │
│     App      │         │   Dashboard  │         │              │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Backend API Server  │
                    │   (Node.js/Express)   │
                    └───────────┬───────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
    ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
    │  Image           │ │  Workflow    │ │  Telematics  │
    │  Validation      │ │  Service     │ │  Service     │
    │  Service         │ │              │ │              │
    └────────┬─────────┘ └──────┬───────┘ └──────┬───────┘
             │                  │                │
             ▼                  ▼                ▼
    ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
    │  AWS Rekognition │ │  PostgreSQL  │ │  Telematics  │
    │  (AI/ML)         │ │  Database    │ │  Provider    │
    │                  │ │              │ │  API         │
    └──────────────────┘ └──────────────┘ └──────────────┘
                                                  │
                                                  ▼
                                         ┌──────────────┐
                                         │   Vehicle    │
                                         │ Kill Switch  │
                                         │   Hardware   │
                                         └──────────────┘
```

## 2. Accident Report Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Accident Report Workflow                          │
└─────────────────────────────────────────────────────────────────────┘

START: Accident Occurs
         │
         ▼
┌─────────────────────┐
│ Driver Creates      │
│ Accident Report     │
│ (with vehicle_id)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ System Initializes  │
│ Workflow            │
│ - Required steps    │
│ - Completion %      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐      ┌──────────────────┐
│ Kill Switch         │─────▶│ Vehicle          │
│ ENGAGED             │      │ Immobilized      │
│ (if enabled)        │      │ Cannot Start     │
└──────────┬──────────┘      └──────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│              Driver Completes Workflow Steps            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Step 1: Basic Information                    [✓]      │
│  ├─ Incident type                                      │
│  ├─ Date/time                                          │
│  └─ Location                                           │
│                                                         │
│  Step 2: Upload Photos (min 2)               [✓]      │
│  ├─ Photo 1 → AI Validation → ✓ Valid                 │
│  ├─ Photo 2 → AI Validation → ✓ Valid                 │
│  └─ Photo 3 → AI Validation → ⚠ Manual Review         │
│                                                         │
│  Step 3: Photo Validation                     [✓]      │
│  └─ All photos validated                               │
│                                                         │
│  Step 4: Incident Description                 [✓]      │
│  └─ Detailed description entered                       │
│                                                         │
│  Step 5: Submit Report                        [✓]      │
│  └─ Final submission                                   │
│                                                         │
│  Progress: 100% Complete                               │
└─────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐      ┌──────────────────┐
│ Kill Switch         │─────▶│ Vehicle          │
│ RELEASED            │      │ Operational      │
│ (automatic)         │      │ Can Start        │
└──────────┬──────────┘      └──────────────────┘
           │
           ▼
        END: Driver Continues Route
```

## 3. Emergency Override Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Emergency Override Workflow                       │
└─────────────────────────────────────────────────────────────────────┘

START: Kill Switch Engaged
         │
         ▼
┌─────────────────────┐
│ Driver Needs        │
│ Vehicle Urgently    │
│ (Emergency)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Driver Requests     │
│ Supervisor Override │
│ - Reason            │
│ - Urgency Level     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐      ┌──────────────────┐
│ Notification Sent   │─────▶│ Supervisor       │
│ to Supervisor       │      │ Receives Alert   │
└─────────────────────┘      └────────┬─────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │ Supervisor       │
                             │ Reviews Request  │
                             │ - Driver info    │
                             │ - Reason         │
                             │ - Urgency        │
                             │ - Workflow %     │
                             └────────┬─────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
          ┌──────────────────┐              ┌──────────────────┐
          │ APPROVE          │              │ DENY             │
          │ - Add notes      │              │ - Add reason     │
          └────────┬─────────┘              └────────┬─────────┘
                   │                                 │
                   ▼                                 ▼
          ┌──────────────────┐              ┌──────────────────┐
          │ Kill Switch      │              │ Kill Switch      │
          │ RELEASED         │              │ REMAINS ENGAGED  │
          │ (immediate)      │              │                  │
          └────────┬─────────┘              └────────┬─────────┘
                   │                                 │
                   ▼                                 ▼
          ┌──────────────────┐              ┌──────────────────┐
          │ Driver Notified  │              │ Driver Notified  │
          │ - Can start      │              │ - Must complete  │
          │ - Complete later │              │   workflow       │
          └────────┬─────────┘              └──────────────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Audit Log        │
          │ - Override ID    │
          │ - Supervisor     │
          │ - Timestamp      │
          │ - Reason         │
          └──────────────────┘
                   │
                   ▼
                 END
```

## 4. AI Image Validation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI Image Validation Flow                          │
└─────────────────────────────────────────────────────────────────────┘

START: Photo Uploaded
         │
         ▼
┌─────────────────────┐
│ Photo Saved to S3   │
│ - Unique file key   │
│ - Fleet isolated    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Validation Record   │
│ Created             │
│ Status: PROCESSING  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│              AWS Rekognition Analysis                   │
│              (Parallel Processing)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Label Detection │  │ Text Detection  │             │
│  │ - Objects       │  │ - OCR           │             │
│  │ - Vehicles      │  │ - License plates│             │
│  │ - Damage        │  │ - Documents     │             │
│  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                       │
│  ┌────────▼────────┐  ┌────────▼────────┐             │
│  │ Face Detection  │  │ Content         │             │
│  │ - Count         │  │ Moderation      │             │
│  │ - Privacy       │  │ - Inappropriate │             │
│  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                       │
│           └──────────┬─────────┘                       │
│                      │                                 │
└──────────────────────┼─────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ Process Results│
              │ - Aggregate    │
              │ - Score        │
              │ - Flags        │
              └────────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   VALID      │ │ MANUAL       │ │   INVALID    │
│              │ │ REVIEW       │ │              │
│ - Clear      │ │ - Blurry     │ │ - No damage  │
│ - Damage     │ │ - Dark       │ │ - Wrong type │
│   detected   │ │ - Unclear    │ │ - Flagged    │
│ - Good       │ │ - Needs      │ │              │
│   quality    │ │   human      │ │              │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Workflow     │ │ Fleet Manager│ │ Driver       │
│ Step         │ │ Notified     │ │ Notified     │
│ Completed    │ │ for Review   │ │ to Retake    │
└──────────────┘ └──────────────┘ └──────────────┘
```

## 5. Kill Switch State Machine

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Kill Switch State Machine                         │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   INACTIVE   │
                    │              │
                    │ Vehicle can  │
                    │ start/drive  │
                    └──────┬───────┘
                           │
                           │ Accident Report Created
                           │ + Kill Switch Enabled
                           │
                           ▼
                    ┌──────────────┐
                    │    ACTIVE    │
                    │              │
                    │ Preparing to │
                    │   engage     │
                    └──────┬───────┘
                           │
                           │ Workflow Initialized
                           │
                           ▼
                    ┌──────────────┐
                    │   ENGAGED    │◀────────────┐
                    │              │             │
                    │ Vehicle      │             │
                    │ immobilized  │             │
                    └──────┬───────┘             │
                           │                     │
          ┌────────────────┼────────────────┐    │
          │                │                │    │
          │ Workflow       │ Supervisor     │    │ Override
          │ 100%           │ Override       │    │ Denied
          │ Complete       │ Approved       │    │
          │                │                │    │
          ▼                ▼                │    │
   ┌──────────────┐ ┌──────────────┐      │    │
   │  RELEASED    │ │  OVERRIDDEN  │      │    │
   │  (auto)      │ │  (manual)    │      │    │
   │              │ │              │      │    │
   │ Vehicle      │ │ Vehicle      │      │    │
   │ operational  │ │ operational  │      │    │
   └──────┬───────┘ └──────┬───────┘      │    │
          │                │              │    │
          │                │              │    │
          └────────────────┼──────────────┘    │
                           │                   │
                           ▼                   │
                    ┌──────────────┐           │
                    │   INACTIVE   │           │
                    │              │           │
                    │ Normal       │           │
                    │ operation    │           │
                    └──────────────┘           │
                                               │
                    Override Request ──────────┘
                    Denied
```

## 6. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Flow Diagram                            │
└─────────────────────────────────────────────────────────────────────┘

Driver Mobile App
       │
       │ 1. Create Report
       │    POST /api/reports
       │    { vehicle_id, location, ... }
       │
       ▼
Backend API
       │
       ├─▶ 2. Save to Database
       │      accident_reports table
       │
       ├─▶ 3. Initialize Workflow
       │      workflow_completions table
       │
       └─▶ 4. Check Kill Switch
              │
              ▼
       Telematics Service
              │
              ├─▶ 5. Get Vehicle Config
              │      vehicles table
              │      telematics_providers table
              │
              └─▶ 6. Send Command
                     │
                     ▼
              Telematics Provider API
                     │
                     ▼
              Vehicle Hardware
              (Kill Switch Engaged)
                     │
                     ▼
              7. Log Event
                 kill_switch_events table

Driver Mobile App
       │
       │ 8. Upload Photo
       │    POST /api/uploads/photos/:reportId
       │    FormData: { photo: file }
       │
       ▼
Backend API
       │
       ├─▶ 9. Upload to S3
       │      AWS S3 Bucket
       │
       ├─▶ 10. Save Photo Record
       │       report_photos table
       │
       └─▶ 11. Trigger AI Validation (async)
              │
              ▼
       Image Validation Service
              │
              ├─▶ 12. Analyze Image
              │       AWS Rekognition
              │       - Labels
              │       - Text (OCR)
              │       - Faces
              │       - Quality
              │
              └─▶ 13. Save Results
                      image_validations table
                      │
                      ▼
              14. Update Workflow
                  workflow_completions table
                  │
                  ▼
              15. Check Completion
                  │
                  ├─▶ If 100% Complete
                  │   └─▶ Release Kill Switch
                  │       └─▶ Telematics Provider
                  │           └─▶ Vehicle Operational
                  │
                  └─▶ If Incomplete
                      └─▶ Keep Kill Switch Engaged
```

## 7. Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Database Schema Relationships                     │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│    fleets    │
│              │
│ - id (PK)    │
│ - name       │
└──────┬───────┘
       │
       │ 1:N
       │
       ├─────────────────────────────────────────────────┐
       │                                                 │
       ▼                                                 ▼
┌──────────────┐                                 ┌──────────────────┐
│    users     │                                 │ telematics_      │
│              │                                 │ providers        │
│ - id (PK)    │                                 │                  │
│ - fleet_id   │                                 │ - id (PK)        │
│ - role       │                                 │ - fleet_id       │
└──────┬───────┘                                 │ - provider_name  │
       │                                         │ - api_key_enc    │
       │ 1:N                                     └────────┬─────────┘
       │                                                  │
       ▼                                                  │ 1:N
┌──────────────┐                                         │
│  vehicles    │◀────────────────────────────────────────┘
│              │
│ - id (PK)    │
│ - fleet_id   │
│ - telematics_│
│   provider_id│
│ - kill_      │
│   switch_    │
│   enabled    │
└──────┬───────┘
       │
       │ 1:N
       │
       ├─────────────────────────────────────────────────┐
       │                                                 │
       ▼                                                 ▼
┌──────────────┐                                 ┌──────────────────┐
│ accident_    │                                 │ kill_switch_     │
│ reports      │                                 │ events           │
│              │                                 │                  │
│ - id (PK)    │                                 │ - id (PK)        │
│ - fleet_id   │                                 │ - vehicle_id     │
│ - driver_id  │                                 │ - report_id      │
│ - vehicle_id │                                 │ - event_type     │
└──────┬───────┘                                 └──────────────────┘
       │
       │ 1:N
       │
       ├─────────────────────────────────────────────────┐
       │                                                 │
       ▼                                                 ▼
┌──────────────┐                                 ┌──────────────────┐
│ report_      │                                 │ workflow_        │
│ photos       │                                 │ completions      │
│              │                                 │                  │
│ - id (PK)    │                                 │ - id (PK)        │
│ - report_id  │                                 │ - report_id      │
│ - validation_│                                 │ - vehicle_id     │
│   status     │                                 │ - completion_%   │
└──────┬───────┘                                 │ - is_complete    │
       │                                         │ - kill_switch_   │
       │ 1:1                                     │   engaged        │
       │                                         └────────┬─────────┘
       ▼                                                  │
┌──────────────┐                                         │ 1:N
│ image_       │                                         │
│ validations  │                                         ▼
│              │                                 ┌──────────────────┐
│ - id (PK)    │                                 │ supervisor_      │
│ - photo_id   │                                 │ override_        │
│ - report_id  │                                 │ requests         │
│ - validation_│                                 │                  │
│   status     │                                 │ - id (PK)        │
│ - detected_  │                                 │ - workflow_id    │
│   labels     │                                 │ - status         │
│ - extracted_ │                                 │ - urgency        │
│   text       │                                 └──────────────────┘
└──────────────┘
```

## 8. Permission Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Permission Matrix                            │
└─────────────────────────────────────────────────────────────────────┘

Resource          │ Super  │ Fleet  │ Fleet   │ Fleet  │ Driver
                  │ Admin  │ Admin  │ Manager │ Viewer │
──────────────────┼────────┼────────┼─────────┼────────┼────────
vehicles:read     │   ✓    │   ✓    │    ✓    │   ✓    │   ✓
vehicles:write    │   ✓    │   ✓    │    ✗    │   ✗    │   ✗
vehicles:create   │   ✓    │   ✓    │    ✗    │   ✗    │   ✗
vehicles:delete   │   ✓    │   ✓    │    ✗    │   ✗    │   ✗
──────────────────┼────────┼────────┼─────────┼────────┼────────
kill_switch:read  │   ✓    │   ✓    │    ✓    │   ✓    │   ✗
kill_switch:write │   ✓    │   ✓    │    ✓    │   ✗    │   ✗
──────────────────┼────────┼────────┼─────────┼────────┼────────
telematics:read   │   ✓    │   ✓    │    ✓    │   ✗    │   ✗
telematics:write  │   ✓    │   ✓    │    ✗    │   ✗    │   ✗
telematics:create │   ✓    │   ✓    │    ✗    │   ✗    │   ✗
──────────────────┼────────┼────────┼─────────┼────────┼────────
override:request  │   ✓    │   ✓    │    ✓    │   ✗    │   ✓
override:read     │   ✓    │   ✓    │    ✓    │   ✗    │   ✗
override:approve  │   ✓    │   ✓    │    ✓    │   ✗    │   ✗
──────────────────┼────────┼────────┼─────────┼────────┼────────
reports:create    │   ✓    │   ✓    │    ✓    │   ✗    │   ✓
reports:read      │   ✓    │   ✓    │    ✓    │   ✓    │  own
reports:write     │   ✓    │   ✓    │    ✓    │   ✗    │  own
reports:delete    │   ✓    │   ✓    │    ✗    │   ✗    │   ✗
```

---

These diagrams provide a visual understanding of how the telematics integration works, from high-level architecture to detailed workflows and data relationships.
