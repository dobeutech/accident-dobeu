# DTS-1580 Root Cause and Debug Prompt

## Trigger Context

- **Issue:** DTS-1580
- **Title:** `[Email] RE: Time Sensitive Action Required: Revised Loan Estimate`
- **Trigger:** `status_changed`
- **New status:** `Duplicate`
- **Status type:** `canceled`
- **Source:** Auto-created from Gmail triage

## Root Cause Determination

### Most probable root cause

The status change from triage/new issue to **Duplicate** is consistent with intended Linear workflow behavior, not an application runtime failure.

From current Linear docs:

- Marking an issue as duplicate changes the issue to a canceled-type status.
- Teams can configure a custom canceled status named "Duplicate".
- Triage actions include "mark as duplicate", and this action updates the issue to canceled status type.

Given the webhook payload (`newStatus: Duplicate`, `statusType: canceled`) and issue naming (`[Email]` + Gmail triage metadata), the event most likely came from:

1. A manual triage decision in Linear, or
2. A Triage Rule / Triage Intelligence / Agent automation that identified the issue as duplicate and applied that action.

### Confidence

**High** for workflow-driven duplicate handling.  
**Low** for code regression in this repository causing the status transition, because no in-repo Linear webhook or automation implementation was found in `/workspace` to directly mutate Linear issue states.

## Action Decision

### Immediate corrective action required?

**No urgent corrective action is required** if this duplicate status is expected and references a canonical issue.

### Follow-up action recommended?

**Yes**: verify that duplicate resolution points to the correct canonical issue and that triage automation rules are not over-matching.

## Debug/Resolution Prompt Template (for Cursor Agent via Composio)

Use the following prompt when launching a debugging agent:

```text
You are an incident-debugging agent for Linear triage automations.

Goal:
Investigate why Linear issue DTS-1580 ("[Email] RE: Time Sensitive Action Required: Revised Loan Estimate") changed status to Duplicate (statusType=canceled), confirm whether this was expected, and correct automation behavior if needed.

Required tools:
- Linear toolkit via Composio (issues, comments, workflow states, relations, audit/activity if available)
- Cursor toolkit via Composio (optional: run code checks in repository if integration code exists)

Constraints:
- Do not close/delete issues.
- Prefer minimally invasive changes.
- Record evidence for every conclusion.

Tasks:
1) Fetch issue DTS-1580 full timeline:
   - status transitions with timestamps
   - actor (user/automation/integration) for each transition
   - duplicate relation target issue (canonical issue ID)
   - comments/agent actions around the transition window

2) Determine root cause category (pick one):
   A. Manual triage action
   B. Linear Triage Rule
   C. Linear Triage Intelligence / Agent automation
   D. External integration action (e.g., API caller)
   E. Unknown

3) Validate duplicate correctness:
   - Compare subject/body metadata with canonical issue content.
   - Flag false-positive duplicate if semantic mismatch.

4) If false-positive or misconfigured:
   - Propose exact rule/automation change to reduce over-matching.
   - Add safe guardrails: confidence threshold, sender/domain filters, subject normalization, and required human review for ambiguous matches.
   - Draft rollback plan.

5) Add a comment on DTS-1580 with:
   - Root cause
   - Evidence links
   - Whether status should stay Duplicate or be reopened
   - Recommended automation changes

6) If repository code owns the triage logic:
   - Locate relevant files and implement fix.
   - Run lint and tests.
   - Provide patch summary and test results.

Output format:
- Executive summary (5 bullets max)
- Evidence table (event, timestamp, actor, source)
- Recommended action list (ordered)
- Verification checklist with pass/fail
```

## Latest Docs Referenced (for prompt grounding)

- Linear workflow statuses: `https://linear.app/docs/configuring-workflows`
- Linear issue relations (duplicate behavior): `https://linear.app/docs/issue-relations`
- Linear triage actions and automations: `https://linear.app/docs/triage`
- Composio Cursor toolkit docs: `https://docs.composio.dev/toolkits/cursor`
- Composio tool router quickstart: `https://docs.composio.dev/tool-router/overview`

## Linear Issue Comment Template

Post this as a comment on DTS-1580 if MCP access is unavailable:

```markdown
### Automated Status-Change Review (DTS-1580)

**Observed event:** status changed to `Duplicate` (`statusType: canceled`).

**Root cause assessment:** This matches expected Linear duplicate handling behavior (duplicate action transitions issue to canceled-type state). Most likely source is manual triage or triage automation, not repository runtime code.

**Action needed:** Verify canonical linked issue is correct. If false-positive, adjust triage rule/automation matching logic (confidence threshold + sender/domain and subject normalization guards).

**Debug prompt prepared:** yes (Cursor/Composio-ready template prepared in repo docs).
```

## Operational Note

In this runtime, MCP servers for **Composio**, **Linear**, and **Context7** were not configured/discoverable, so direct issue mutation and remote agent launch could not be executed here. This document provides the exact prompt and update content for immediate use once those MCP connections are available.

## Local Execution Fallback (Lint/Test)

Since remote Composio Cursor-agent launch was not available in this runtime, local validation was executed in `backend/`:

1. `npm install` - **pass**
2. `npm run lint` - **fail**
   - ESLint reported a large pre-existing violation set:
   - `1170 problems (1168 errors, 2 warnings)`
3. `npm test -- --runInBand` - **fail**
   - Representative failures:
     - `TelematicsService` tests failing with `TypeError: Invalid initialization vector`
     - `ImageValidationService` tests failing assertions (`expected flagged`, received `valid`)
     - Environment validation path triggers `process.exit(1)` in test runtime

These failures are consistent with existing baseline instability and are not tied to the DTS-1580 duplicate status transition event.
