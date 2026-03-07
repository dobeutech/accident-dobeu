# Environment Onboarding Guide

> First-time setup for the Fleet Accident Reporting System.
> This guide walks you through choosing providers, configuring your `.env`, and verifying the stack.

---

## Quick Start

```bash
# 1. Copy the template
cp backend/.env.template backend/.env

# 2. Fill in your provider credentials (see sections below)
#    Open backend/.env in your editor and follow this guide

# 3. Copy frontend env
cp web/.env.example web/.env

# 4. Install & run
cd backend && npm install && npm run dev
cd ../web && npm install && npm run dev
```

---

## Provider Selection Matrix

Each category has a default and alternatives. Set the `*_PROVIDER` variable, then fill in the matching credential block.

| Category | Variable | Default | Alternatives |
|----------|----------|---------|-------------|
| **Database** | `DB_PROVIDER` | `supabase` | `neon`, `postgresql`, `snowflake`, `prisma_accelerate` |
| **Auth** | `AUTH_PROVIDER` | `auth0` | `jwt` (built-in) |
| **Cloud / Storage** | `CLOUD_PROVIDER` | `aws` | `azure`, `gcp` |
| **AI / Vision** | `AI_PROVIDER` | `openai` | `anthropic`, `aws_rekognition`, `azure_vision`, `google_vision`, `ollama`, `mistral`, `openrouter` |

---

## 1. Database Setup

### Supabase (default)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > API** and copy:
   - `SUPABASE_URL` — Project URL
   - `SUPABASE_ANON_KEY` — `anon` / `public` key
   - `SUPABASE_SERVICE_ROLE_KEY` — `service_role` key (keep secret)
3. Go to **Project Settings > Database** and copy:
   - `DB_HOST` — Host (e.g. `db.xxxx.supabase.co`)
   - `DB_PASSWORD` — Database password
   - `SUPABASE_JWT_SECRET` — JWT secret (under API settings)
4. Leave `DB_PORT=5432`, `DB_NAME=postgres`, `DB_USER=postgres`, `DB_SSL=true`

```env
DB_PROVIDER=supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=super-secret...
DB_HOST=db.xxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_SSL=true
```

### Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string from your dashboard

```env
DB_PROVIDER=neon
NEON_CONNECTION_STRING=postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
DB_HOST=ep-xxxx.us-east-2.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=your_neon_user
DB_PASSWORD=your_neon_password
DB_SSL=true
```

### Standard PostgreSQL

Works with self-hosted Postgres, Amazon RDS, Google Cloud SQL, Azure Database for PostgreSQL.

```env
DB_PROVIDER=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=accident_app
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

### Snowflake

```env
DB_PROVIDER=snowflake
SNOWFLAKE_ACCOUNT=your_account.snowflakecomputing.com
SNOWFLAKE_USERNAME=your_user
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_DATABASE=ACCIDENT_DB
SNOWFLAKE_SCHEMA=PUBLIC
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_ROLE=SYSADMIN
```

### Prisma Accelerate

```env
DB_PROVIDER=prisma_accelerate
DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=your_key
DIRECT_DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

---

## 2. Authentication Setup

### Auth0 (default)

1. Create an application at [auth0.com](https://auth0.com)
2. For the **backend**, create a **Regular Web Application**
3. For the **frontend**, create a **Single Page Application**
4. Configure callback / logout URLs to match your dev server

```env
AUTH_PROVIDER=auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://api.yourdomain.com
AUTH0_CALLBACK_URL=http://localhost:3000/api/auth/callback
AUTH0_LOGOUT_URL=http://localhost:3001
```

Also set the frontend (`web/.env`):

```env
VITE_AUTH_PROVIDER=auth0
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_spa_client_id
VITE_AUTH0_AUDIENCE=https://api.yourdomain.com
VITE_AUTH0_REDIRECT_URI=http://localhost:3001/callback
```

### Built-in JWT

If you don't need Auth0, use the built-in JWT authentication:

```env
AUTH_PROVIDER=jwt
JWT_SECRET=generate_a_random_string_at_least_32_characters_long
JWT_EXPIRES_IN=24h
SESSION_SECRET=another_random_string_at_least_32_characters_long
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 3. Cloud Provider Setup

### AWS (default)

1. Create an IAM user with S3 + Rekognition access
2. Create an S3 bucket for photo uploads

```env
CLOUD_PROVIDER=aws
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=fleet-accident-photos-dev
```

### Azure

1. Create a Storage Account and a Blob Container
2. Create an App Registration for service principal

```env
CLOUD_PROVIDER=azure
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_SUBSCRIPTION_ID=your_subscription_id
AZURE_STORAGE_ACCOUNT=youraccountname
AZURE_STORAGE_KEY=your_storage_key
AZURE_BLOB_CONTAINER=accident-photos
```

### GCP

1. Create a GCS bucket
2. Create a service account with Storage Object Admin role
3. Download the JSON key file

```env
CLOUD_PROVIDER=gcp
GCP_PROJECT_ID=your-project-id
GCP_CLIENT_EMAIL=sa@project.iam.gserviceaccount.com
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_STORAGE_BUCKET=fleet-accident-photos-dev
GCP_REGION=us-central1
```

---

## 4. AI Provider Setup

The system uses AI for image analysis (damage detection, OCR, moderation) and optional AI assistant features.

### OpenAI (default)

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_VISION_MODEL=gpt-4o
```

### Anthropic

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ANTHROPIC_VISION_MODEL=claude-sonnet-4-20250514
```

### AWS Rekognition

No extra keys needed — uses the AWS credentials from the Cloud Provider section.

```env
AI_PROVIDER=aws_rekognition
```

### Azure Computer Vision

```env
AI_PROVIDER=azure_vision
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_key
```

### Google Cloud Vision

No extra keys needed — uses the GCP credentials from the Cloud Provider section.

```env
AI_PROVIDER=google_vision
```

### Ollama (local / self-hosted)

Free, runs entirely on your machine. Good for development without API costs.

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_VISION_MODEL=llava
```

### Mistral

```env
AI_PROVIDER=mistral
MISTRAL_API_KEY=your_key
MISTRAL_MODEL=mistral-large-latest
```

### OpenRouter (multi-model gateway)

Access multiple AI models through a single API key.

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-sonnet-4-20250514
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

---

## 5. Verification Checklist

After configuring your `.env`, verify everything works:

```bash
# Check env vars are loaded
cd backend && node -e "require('dotenv').config(); console.log('DB_PROVIDER:', process.env.DB_PROVIDER)"

# Test database connection
npm run db:test      # or: node -e "require('./src/database/connection').testConnection()"

# Start the dev server
npm run dev

# In another terminal, start the web frontend
cd web && npm run dev
```

Expected output:
- Backend running on `http://localhost:3000`
- Swagger docs at `http://localhost:3000/api-docs` (if `ENABLE_SWAGGER_DOCS=true`)
- Frontend running on `http://localhost:5000` (proxied to backend)

---

## 6. Secrets Generation

Use these one-liners to generate secure random values:

```bash
# JWT_SECRET / SESSION_SECRET / ENCRYPTION_KEY (64 hex chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Shorter 32-char secret
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# UUID-style
node -e "console.log(require('crypto').randomUUID())"
```

---

## 7. Environment-Specific Notes

| Variable | Development | Production |
|----------|-------------|------------|
| `NODE_ENV` | `development` | `production` |
| `DB_SSL` | `false` (local PG) / `true` (Supabase/Neon) | `true` |
| `COOKIE_SECURE` | `false` | `true` |
| `COOKIE_SAME_SITE` | `lax` | `strict` |
| `ENABLE_SWAGGER_DOCS` | `true` | `false` |
| `ENABLE_DEBUG_LOGGING` | optional | `false` |
| `CORS_ORIGIN` | `localhost:*` | your domain(s) only |
| `BCRYPT_ROUNDS` | `10` | `12` |

---

## 8. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `SequelizeConnectionRefusedError` | Wrong `DB_HOST`/`DB_PORT` or DB not running | Check Supabase dashboard; verify host |
| `JWT_SECRET must be at least 32 characters` | Empty or short secret | Generate with crypto one-liner above |
| `S3 bucket not found` | Wrong bucket name or region | Check AWS console; match `AWS_REGION` |
| `Auth0 callback mismatch` | `AUTH0_CALLBACK_URL` doesn't match Auth0 dashboard | Add `http://localhost:3000/api/auth/callback` to Auth0 Allowed Callbacks |
| `CORS blocked` | Frontend URL not in `CORS_ORIGIN` | Add `http://localhost:5000` to the comma-separated list |
| `AI analysis timeout` | Ollama not running or model not pulled | Run `ollama pull llama3` first |
