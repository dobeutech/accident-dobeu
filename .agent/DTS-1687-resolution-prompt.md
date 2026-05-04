# DTS-1687 Resolution Prompt

## Event Summary

- Linear issue: `DTS-1687`
- Trigger: status changed to `Duplicate` (`statusType: canceled`)
- Source: Gmail triage auto-created issue from MongoDB Atlas email
- Alert subject: `Alert - Dobeu Tech Solutions - 2026-05-04T10:55Z`
- Alert preview: `Current bill for any single project is above the limit you set`
- Atlas organization: `Dobeu Tech Solutions`
- Atlas project prefix visible in email: `dobeutech-mongo-`
- Severity: `ERROR`
- Alert created timestamp in email: `2026/05/02 02:55 GMT`
- Message ID: `19df2a122052c4c5`

## Root-Cause Determination

The latest Linear status change was caused by duplicate triage of a MongoDB Atlas billing alert email. The issue was moved to Linear status `Duplicate`, which is a canceled status, because the incoming Gmail-created issue appears to represent the same recurring Atlas billing threshold alert as an existing issue or incident.

The underlying operational cause remains a MongoDB Atlas billing threshold breach: Atlas reported that the current bill for at least one project in the `Dobeu Tech Solutions` organization exceeded a configured per-project limit. Per MongoDB Atlas documentation, billing alerts are organization/project alert settings that can notify owners, billing admins, or configured integrations when spend crosses a threshold. Atlas cost investigation should focus on Cost Explorer, billing summary by service/project/cluster, cluster tier, backups, storage growth, data transfer, auto-scaling, and underutilized clusters.

## Documentation Checked

Context7 MCP was requested but not exposed in this runtime. Current MongoDB Atlas public docs were checked instead:

- MongoDB Atlas Configure Alert Settings: https://www.mongodb.com/docs/atlas/configure-alerts/
- MongoDB Atlas Review Alert Conditions: https://www.mongodb.com/docs/atlas/reference/alert-conditions/
- MongoDB Atlas Billing Breakdown and Optimization: https://www.mongodb.com/docs/atlas/billing/billing-breakdown-optimization/

Relevant documentation points:

- Managing organization alerts requires `Organization Owner`; billing alerts can also be managed by `Organization Billing Admin`.
- Atlas alerts support severity levels including `Error`.
- Billing investigation should use Atlas billing views such as service/project/cluster breakdowns and Cost Explorer.
- Common cost drivers include dedicated cluster compute tier, backups, storage, data transfer, auto-scaling, and idle or underutilized clusters.
- Billing alerts should be configured for important monthly cost thresholds to detect unexpected spend.

## Prompt Template for Cursor Agent

Use this prompt to launch a Cursor agent if direct Composio launch is available:

```text
You are debugging Linear issue DTS-1687:

Title: [Email] Alert - Dobeu Tech Solutions - 2026-05-04T10:55Z
Status: Duplicate
Priority: High
Source: Gmail triage email from MongoDB Atlas
Alert preview: "ORGANIZATION Dobeu Tech Solutions Current bill for any single project is above the limit you set ... SEVERITY ERROR PROJECT dobeutech-mongo-..."
Message ID: 19df2a122052c4c5

Goal:
Determine whether any application or infrastructure change in this repository is causing the MongoDB Atlas project billing threshold breach, and either resolve the cause or produce a precise operational handoff if the cause is only in Atlas account configuration/spend.

Important context:
- The Linear status is "Duplicate", so do not create a second remediation thread if an original issue already exists. Find and reference the canonical issue if Linear tools are available.
- The root event is a MongoDB Atlas billing alert: "Current bill for any single project is above the limit you set."
- Before making changes, review current MongoDB Atlas docs for billing alerts, alert settings, and billing optimization. If Context7 is available, use it for MongoDB Atlas docs. Otherwise use:
  - https://www.mongodb.com/docs/atlas/configure-alerts/
  - https://www.mongodb.com/docs/atlas/reference/alert-conditions/
  - https://www.mongodb.com/docs/atlas/billing/billing-breakdown-optimization/

Investigation steps:
1. Check available integrations first:
   - Linear: fetch DTS-1687 and recent duplicate/canonical issue comments.
   - Composio/Cursor automation: confirm launch/update capabilities.
   - Context7: fetch current MongoDB Atlas docs.
   - MongoDB Atlas or cloud/billing credentials: only use read-only commands unless an explicit remediation is required and safe.
2. Inspect the repository for MongoDB Atlas usage:
   - Search for MongoDB connection configuration, Atlas project names, environment variable names, scheduled jobs, data import/export jobs, backup/export scripts, seeders, analytics jobs, and high-volume write/read paths.
   - Identify whether the app uses MongoDB directly or whether the alert is unrelated to this repository.
3. If Atlas access is available, collect billing evidence:
   - Organization/project with threshold breach.
   - Cost Explorer or billing breakdown by project, cluster, service, and date range.
   - Recent cluster tier/storage/autoscaling changes.
   - Backup, data transfer, and storage line items.
   - Recent activity feed events around 2026-05-02 02:55 GMT.
4. Determine root cause:
   - If cost increase came from expected usage, document the owner decision needed: raise budget, right-size threshold, or optimize workload.
   - If cost increase came from idle/unused resources, propose pausing/terminating unused clusters only after confirming data retention requirements.
   - If cost increase came from application behavior, identify the code path and create a minimal test-first fix.
   - If cost increase came from backups/storage/egress/autoscaling, document the Atlas setting and safe remediation.
5. If code changes are needed:
   - Add or update focused tests for the cost-driving behavior.
   - Implement the minimal fix.
   - Run the relevant test suite.
   - Run eslint.
   - Debug and fix any failures introduced by the change.
6. If no code changes are needed:
   - Do not modify application code.
   - Produce an operational runbook with evidence, recommended Atlas action, risk, and rollback.
7. Update Linear:
   - Add a comment to DTS-1687 with the root cause, canonical duplicate issue if found, documentation links, evidence gathered, action taken, tests/lint results, and remaining owner decisions.
   - If active remediation is required, set the canonical issue status to the appropriate in-progress/status value.
   - If this duplicate needs no direct action, leave DTS-1687 as Duplicate and link to the canonical issue.

Validation requirements:
- Run eslint and tests if any repository code changes are made.
- If no code changes are made, explicitly state "No repository code change required" and include the operational verification evidence instead.
- Never expose secrets in logs or comments.

Expected final response:
- Root cause
- Evidence
- Changes made or "none"
- ESLint/test results or why they were not applicable
- Linear update status
- Remaining blockers
```

## Current Automation Limitation

This Cursor runtime did not expose usable MCP resources for Linear, Composio, or Context7, and no `LINEAR_*`, `COMPOSIO_*`, `CONTEXT7_*`, `ATLAS_*`, or `MONGODB_*` environment variables were present. The Linear web URL also did not return authenticated issue content. Because of that, the agent could not directly add this prompt to Linear or launch a Composio Cursor agent from this run.
