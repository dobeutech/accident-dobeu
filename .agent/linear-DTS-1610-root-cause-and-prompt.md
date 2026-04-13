# DTS-1610 - Root Cause Review and Debug Prompt Template

## Linear Event Snapshot
- Issue: `DTS-1610`
- Title: `[TODO] Qdrant API Key Rotation`
- Status change: `Duplicate` (canceled)
- Description summary: Current Qdrant key returns 403, rotate key in Qdrant Cloud, update Prisma `service_credentials`.

## Connection/Tooling Check
- MCP server availability in this runtime:
  - `Composio`: unavailable
  - `Linear`: unavailable
  - `Context7`: unavailable
- Result: direct Linear updates and Composio-launched Cursor agent execution cannot be performed from this environment.

## Root Cause Determination
Primary root cause for status change appears to be **triage duplication / repository-technology mismatch**:

1. The current repository does not contain Qdrant integration (no `qdrant` references found).
2. The current repository does not contain Prisma integration or `service_credentials` model references.
3. The issue context targets an external credential rotation operation (Qdrant Cloud + Prisma credential storage) that is not represented in this codebase.

Likely interpretation:
- The issue was marked `Duplicate` because remediation is tracked elsewhere (another Linear issue, another repository, or infra-secrets workspace).

## Documentation Baseline Used For Prompt Construction
Because Context7 MCP is unavailable, the prompt below is based on current official docs:

1. Qdrant Cloud authentication docs:
   - `https://qdrant.tech/documentation/cloud/authentication/`
   - Key details used:
     - Use `api-key` header (or `Authorization: Bearer`) for DB requests.
     - DB API keys are shown once on creation.
     - Prefer expiring keys and regular rotation.
     - Granular keys (prefix `eyJhb`) available for newer clusters.
2. Prisma environment variable docs:
   - `https://www.prisma.io/docs/orm/more/dev-environment/environment-variables`
   - Key details used:
     - Secrets should be env-driven, not hardcoded.
     - Avoid duplicate/conflicting `.env` values.
     - Load environment variables consistently for runtime and CLI usage.

## Linear Comment Template (Ready to Post)
Use this as the issue update/comment body:

```md
### Root Cause Review (Automated)

`DTS-1610` appears to have been marked **Duplicate** due to a likely tracker/repository mismatch:

- No Qdrant integration found in this repository.
- No Prisma `service_credentials` references found in this repository.
- The requested fix path (Qdrant key rotation + Prisma credential update) appears to belong to another codebase or infra workflow.

### Proposed Action

1. Link the canonical issue handling Qdrant key rotation.
2. Confirm target repository/service that owns:
   - Qdrant cluster URL + auth path
   - Prisma model/table for service credentials
3. If this issue should remain active, run the prompt below in the owning repository.

### Debug/Resolution Prompt Template

```text
You are debugging a production credential incident: Qdrant requests are returning HTTP 403.

Objective:
Rotate the Qdrant Database API key and safely propagate it through Prisma-backed service credentials without downtime.

Constraints:
- Never print or commit raw secrets.
- Use environment/secret manager references only.
- Follow least privilege for new key scopes and expiration.

Steps:
1) Reproduce and classify failure
   - Identify failing endpoint(s), response body, and whether failure is auth (403) vs network/TLS.
   - Validate Qdrant URL format and protocol/port consistency with cluster settings.

2) Validate current key usage path
   - Trace code from config loader -> Prisma credential read -> Qdrant client initialization.
   - Confirm request header format matches Qdrant docs (`api-key` or `Authorization: Bearer`).
   - Verify no stale cache/layer retains deprecated credentials.

3) Rotate key in Qdrant Cloud
   - Create new Database API key with explicit expiration and minimal scope.
   - Keep old key active during rollout window.
   - Smoke test with curl:
     curl -X GET "https://<cluster-host>:6333" --header "api-key: <NEW_KEY>"
   - Expect metadata response (title/version), not 403.

4) Update Prisma-managed credential source
   - Update `service_credentials` entry (or equivalent) using secure write path.
   - Confirm encryption-at-rest path is preserved if applicable.
   - Invalidate/reload app config cache.

5) Verify end-to-end
   - Run targeted integration path calling Qdrant.
   - Confirm 2xx responses and expected query behavior.
   - Monitor logs/metrics for 403 recurrence.

6) Remove old key
   - Revoke deprecated key only after successful verification window.

7) Regression safety checks
   - Run lint and tests:
     - npm run lint (or repository equivalent)
     - npm test (or targeted test suite)
   - Add/adjust tests for:
     - missing key
     - malformed header
     - rotated key cache refresh
     - revoked key fallback behavior

Deliverables:
- Root cause summary
- Exact files changed
- Test results
- Rollback plan
- Confirmation old key revoked
```
```

## Local Execution Note
If Composio becomes available, launch a Cursor agent with the "Debug/Resolution Prompt Template" above in the owning repository, then post resulting logs, test output, and status update back to Linear.
