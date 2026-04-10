# Linear Duplicate Issue Automation Debug Prompt (DTS-1581)

## Event Summary

- Linear issue: `DTS-1581`
- Trigger: `status_changed`
- New status: `Duplicate` (status type: `canceled`)
- Title: `[Email] Purchase declined: Your virtual card is locked`
- Source: Auto-created from Gmail triage

## Root Cause Determination

The latest status transition is most likely **expected Linear behavior** rather than an application defect:

1. In Linear, when an issue is marked as a duplicate, its status is moved into the **Canceled** category and commonly shown as **Duplicate**.
2. This issue appears to be an auto-generated Gmail triage item, which often creates near-duplicate records for repeated email notifications.
3. The provided event contains no execution error or API failure metadata; it only indicates a status category transition consistent with manual or rule-based duplicate triage.

## Action Decision

No urgent product code fix is required by this event alone.  
Action is still recommended to improve observability and prevent noisy duplicate creation:

- Validate which canonical issue `DTS-1581` was linked to.
- Confirm whether duplicate assignment came from user triage action, workflow rule, or external integration.
- Add idempotency and dedupe checks to Gmail-to-Linear ingestion if duplicates are excessive.

## Documentation Notes Used for Prompt Design

Because Context7 MCP was unavailable in this runtime, the prompt below references current public vendor docs:

- Linear workflow / issue status behavior: <https://linear.app/docs/configuring-workflows>
- Linear duplicate relation behavior: <https://linear.app/docs/issue-relations>
- ESLint v9 migration guidance: <https://eslint.org/docs/latest/use/migrate-to-9.0.0>
- ESLint configuration migration guide: <https://eslint.org/docs/latest/use/configure/migration-guide>

## Prompt Template to Add to Linear Issue

Use the following prompt with your Cursor/Composio agent for automated investigation and remediation:

```text
You are debugging a Linear automation event.

Context:
- Issue ID: DTS-1581
- Event: status_changed -> Duplicate (canceled)
- Title: [Email] Purchase declined: Your virtual card is locked
- Source: Gmail triage auto-created issue

Goals:
1) Determine whether the duplicate transition was manual triage, Linear workflow automation, or external integration behavior.
2) Identify the canonical issue linked to DTS-1581 and verify attachment/customer-request merge behavior.
3) Confirm whether duplicate creation from Gmail triage is happening at abnormal frequency.
4) If needed, implement dedupe protections and better audit logging for issue ingestion.

Required investigation steps:
1. Review automation/webhook ingestion code paths that create Linear issues from email/Gmail events.
2. Trace fields used as dedupe keys (e.g., message-id, sender, normalized subject, thread-id, hash of payload).
3. Verify if idempotency storage exists; if absent, add a persisted idempotency key with TTL + conflict-safe upsert.
4. Add structured logs around create/update decisions:
   - incoming event id
   - computed dedupe key
   - matched canonical issue id
   - action taken (create / skip / merge / mark duplicate)
5. Add or update tests for:
   - repeated same email event does not create a new issue
   - slightly changed email noise still maps to same canonical issue when thresholds match
   - truly distinct event still creates a new issue
6. Run lint and tests after changes:
   - backend: npm run lint
   - backend: npm test -- --runInBand
7. If lint or tests fail, fix regressions introduced by your changes and report any pre-existing failures separately.

Output format:
- Root cause summary
- Files changed
- Test/lint results with pass/fail counts
- Residual risks and follow-up recommendations
```

## Suggested Linear Comment (Copy/Paste)

```text
Root-cause review:
The status change to Duplicate appears consistent with Linear’s expected duplicate workflow behavior (duplicate items move to Canceled/Duplicate). This event looks like triage consolidation for an auto-created Gmail issue rather than a runtime product incident.

Planned action:
I prepared a debug/remediation prompt for agent execution to verify canonical linking and reduce noisy duplicate creation from Gmail ingestion (idempotency + dedupe + audit logs + tests + eslint/test runs).

Prompt template location in repo:
docs/LINEAR_DUPLICATE_AUTOMATION_DEBUG_PROMPT.md
```
