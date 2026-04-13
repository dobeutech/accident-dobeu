# DTS-1602 (Linear) - Status Change Root Cause + Debug Prompt Template

## Event reviewed

- **Issue:** DTS-1602
- **Title:** `[DONE] Grafana — 5 dashboards total deployed`
- **Status change:** `Duplicate` (canceled)
- **Trigger type:** Linear webhook `issue.status_changed`
- **Description from event:** "Added Domain Health Monitor + Content & Marketing dashboards. All 5 dashboards with SQL queries against Neon + Prisma."

## Connection/tooling check outcome

Requested MCP servers were **not available** in this runtime:

- `Composio`: not configured
- `Linear`: not configured
- `Context7`: not configured

Fallback used:

- Local repository forensics
- Public vendor docs (Grafana, Neon, Prisma release/docs pages)
- Local lint/test execution

## Root cause determination

Most likely root cause for the `Duplicate` status is **scope/system mismatch** between the Linear issue content and this repository's implemented stack.

### Evidence found in this repository

1. Monitoring implementation appears to be Prometheus + Grafana provisioning with a **single dashboard JSON**:
   - `monitoring/grafana-dashboard.json`
   - `monitoring/prometheus.yml`
   - `monitoring/alerts.yml`
2. Repository backend stack is Sequelize/PostgreSQL, not Prisma:
   - `backend/package.json` includes `sequelize`, does **not** include Prisma packages.
3. The event mentions **Neon + Prisma SQL dashboards**, which does not match current repo implementation details.
4. Git history includes prior Grafana fix work on another branch (`DTS-1597`), which suggests this may have been folded into an already tracked/canonical issue and then deduplicated.

### Secondary contributing factors

- Missing/undiscovered MCP integration in this runtime prevented automatic cross-referencing of canonical linked Linear issue.
- Existing repo quality baseline currently blocks clean verification:
  - `backend` lint run reports ~1170 issues
  - `backend` tests fail in pre-existing suites (telematics/image validation/startup env checks)

## Latest documentation notes used for prompt design

### Grafana (current docs)

- Provisioning is expected via YAML providers under `provisioning/dashboards` and datasource provisioning under `provisioning/datasources`.
- Provisioned dashboards are overwritten from file source; UI edits are not source of truth.
- UID consistency is important for stable dashboard identity and links.

### Neon + Prisma (current docs/changelog)

- Neon recommends:
  - pooled URL for app runtime (`DATABASE_URL`, includes `-pooler`)
  - direct URL for CLI/migrations (`DIRECT_URL`)
- Prisma 7 era guidance shifts config toward `prisma.config.ts` patterns and adapter-based setup with Neon.

---

## Linear comment template (copy/paste)

```md
Root-cause review for status change to **Duplicate**:

### Findings
1. The issue description references "5 dashboards with SQL queries against Neon + Prisma".
2. This repository currently shows Prometheus/Grafana monitoring with a single dashboard JSON and Sequelize-based backend (no Prisma integration in backend package manifests).
3. This indicates a likely duplicate/misattributed scope versus an existing monitoring or dashboard-tracking issue.

### Proposed resolution path
- Confirm and link canonical Linear issue that owns Grafana multi-dashboard + Neon/Prisma scope.
- If DTS-1602 should remain active, re-scope acceptance criteria to match this repo's actual monitoring stack or implement missing Prisma/Neon integration explicitly.
- Run lint/tests and attach logs before status transition:
  - `cd backend && npm run lint`
  - `cd backend && npm test -- --runInBand`

### Baseline validation snapshot (current branch)
- Lint: failing (large set of pre-existing style/rule violations)
- Tests: failing in pre-existing telematics/image validation suites

Please confirm whether to (A) keep as duplicate and reference canonical issue, or (B) reopen with corrected scope + implementation tasks.
```

---

## Cursor agent launch prompt template (for Composio/Cursor automation)

Use this as the exact prompt body when launching the coding agent:

```md
You are debugging Linear issue DTS-1602 status change (set to Duplicate) for a Grafana dashboard deployment claim.

## Objective
Determine whether DTS-1602 is correctly marked as duplicate, and if action is needed, implement and verify a fix path.

## Required context checks
1. Compare issue claim ("5 dashboards, Neon + Prisma SQL") against repository reality:
   - monitoring files
   - backend DB layer/dependencies
   - Grafana provisioning model
2. Identify canonical duplicate issue if one exists, and gather linked evidence (commit(s), file paths, or prior issue).

## Documentation constraints (must use latest vendor guidance)
Before coding, verify latest docs for:
- Grafana provisioning (dashboards + datasources + UID behavior)
- Neon connection strategy (pooled vs direct)
- Prisma current release/config guidance

## Implementation instructions
If duplicate is valid:
1. Post root-cause summary and canonical issue reference in DTS-1602.
2. Keep status as Duplicate and add evidence links.

If duplicate is not valid:
1. Reopen or move to actionable status.
2. Implement missing pieces (as applicable):
   - Add/repair Grafana datasource provisioning file(s)
   - Add/repair dashboard provider file(s)
   - Add missing dashboard JSON definitions (target: 5 dashboards) or correct acceptance criteria
   - If Neon/Prisma is truly required, add Prisma integration using current best practices and env separation (`DATABASE_URL` pooled, `DIRECT_URL` direct)
3. Update docs/changelog for any scope correction.

## Mandatory verification
Run and capture output:
- `cd backend && npm install` (if needed)
- `cd backend && npm run lint`
- `cd backend && npm test -- --runInBand`

If lint/tests fail, separate:
- pre-existing failures
- regressions introduced by your changes

## Reporting + Linear updates
After each major step:
1. Post concise update to Linear issue with evidence.
2. Include commands run and pass/fail summary.
3. Recommend final status transition (Duplicate / Reopened / In Progress / Done) based on verified outcomes.
```

---

## Local execution snapshot from this run

Commands executed in `backend/`:

- `npm install` -> success
- `npm run lint` -> fails (large pre-existing lint backlog)
- `npm test -- --runInBand` -> fails in pre-existing suites:
  - `src/__tests__/services/telematicsService.test.js`
  - `src/__tests__/services/imageValidationService.test.js`
  - startup env validation path in `src/utils/validateEnv.js`

This confirms current baseline is not green and should be acknowledged in any status automation/comment.
