# Environment Setup & Onboarding Guide

This guide helps new users configure the Fleet Accident Reporter for development with Supabase, multiple AI providers, and cloud storage options.

## Quick Start (Copy-Paste)

1. Copy the template:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Minimum required for Supabase** (fill in your Supabase values):
   ```env
   NODE_ENV=development
   PORT=3000

   # Supabase - get from Dashboard → Project Settings → Database
   DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

   # Supabase API (Dashboard → Project Settings → API)
   SUPABASE_URL=https://[project-ref].supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Required secrets (min 32 chars each)
   JWT_SECRET=your_jwt_secret_min_32_characters_required
   SESSION_SECRET=your_session_secret_min_32_characters_required
   ENCRYPTION_KEY=your_encryption_key_min_32_characters_required

   # CORS
   CORS_ORIGIN=http://localhost:3001,http://localhost:19006,http://localhost:5173
   COOKIE_SECURE=false
   ```

3. **Database provider** – set `DB_PROVIDER`:
   - `supabase` (default)
   - `neon`
   - `postgres` (self-hosted)
   - `snowflake`
   - `sql_server`

4. **Cloud storage** – set `CLOUD_PROVIDER` and credentials:
   - `aws` → AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
   - `azure` → AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY
   - `gcp` → GCP_PROJECT_ID, GCP_CLIENT_EMAIL, GCP_PRIVATE_KEY

5. **AI provider** – set `AI_PROVIDER` and API key:
   - `openai` → OPENAI_API_KEY
   - `anthropic` → ANTHROPIC_API_KEY
   - `ollama` → OLLAMA_BASE_URL (http://localhost:11434)
   - `mistral` → MISTRAL_API_KEY
   - `openrouter` → OPENROUTER_API_KEY

## Auth0 Flow

For cloud provider sign-in via Auth0:

1. Create an Auth0 application.
2. Set `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_CALLBACK_URL`.
3. Configure Auth0 to allow sign-in with the chosen cloud provider (AWS/Azure/GCP).

## Database Options

| Provider | Connection | Notes |
|---------|------------|-------|
| **Supabase** | `DATABASE_URL` | Default; PostgreSQL with connection pooling |
| **Neon** | `DATABASE_URL` | Serverless PostgreSQL |
| **PostgreSQL** | `DB_HOST`, `DB_PORT`, etc. | Self-hosted or managed |
| **Snowflake** | `SNOWFLAKE_*` | Custom adapter needed |
| **SQL Server** | `DB_*` with `DB_PROVIDER=sql_server` | Azure SQL or on-prem |

## Note on Prisma

Prisma is an ORM, not a database. Use it with any supported database (PostgreSQL, MySQL, etc.). The `DB_PROVIDER` setting selects the database type; Prisma would be a separate migration layer.
