# DTS-1624 RCA and Debug/Resolution Prompt Template

## Issue Context

- Linear issue: `DTS-1624`
- Title: `[Email] Re: [External] Loan #3581917870 — Formal Withdrawal Confirmation | Thank You`
- Trigger type: `status_changed`
- New status: `Duplicate`
- Status type: `canceled`
- Description includes: `Auto-created from Gmail triage`

## Root Cause Analysis

### Observed behavior

The issue was auto-created from Gmail triage and then moved to `Duplicate` (a Canceled-category status).

### Most likely root cause

This event is most likely a **normal deduplication workflow action**, not an engineering regression:

1. The item originated from Gmail triage automation (inbound support/inbox classification).
2. During manual or automated triage, the issue was matched to an existing canonical issue.
3. In Linear, marking an issue as duplicate moves it to the **Canceled** category (or a custom status in that category such as `Duplicate`).

### Evidence basis

- Trigger payload explicitly indicates `newStatus=Duplicate` and `statusType=canceled`.
- Linear docs: duplicate-marked issues transition to Canceled category by design.
- No repository evidence of an internal code path here that would have directly mutated this Linear issue status.

### Additional integration risk to validate

Even when behavior is expected, integration pipelines should still guard against false duplicate handling:

- Webhook consumers must be idempotent (`webhookId` / delivery ID dedupe).
- Webhook retries (at-least-once delivery) can produce repeated update events.
- Noisy update streams can lead to accidental repeated comments/actions if not deduped.

---

## Operator Prompt Template (to add as Linear comment)

Use the following prompt in Cursor/automation when a Linear issue is auto-moved to `Duplicate` and you need to verify whether any engineering action is required.

```md
You are debugging a Linear dedupe/cancel transition event.

Issue:
- ID: {{ISSUE_ID}}
- URL: {{ISSUE_URL}}
- Title: {{ISSUE_TITLE}}
- Trigger: {{TRIGGER_TYPE}} (e.g. status_changed or created)
- New status: {{NEW_STATUS}}
- Status type: {{STATUS_TYPE}}

Goals:
1) Determine whether this transition is expected triage behavior or an integration bug.
2) If expected, leave a concise audit comment and close investigation.
3) If unexpected, produce and apply a fix, then run lint/tests and report results.

Required workflow:
1. Collect evidence
   - Fetch issue history/timeline and identify actor, timestamp, and previous status.
   - Check if issue was linked as duplicate of another issue; capture canonical issue ID.
   - Inspect webhook logs around event time for retries/duplicates (same delivery/event id).
   - Verify webhook signature handling and idempotency guards in the consumer.
2. Classify root cause
   - Expected duplicate triage flow
   - Duplicate webhook replay causing repeated actions
   - Incorrect automation rule mapping (wrong status/category)
   - Human error / manual misclassification
3. Act based on classification
   - If expected: add comment with canonical link and no-code action.
   - If automation bug: patch logic, add/adjust tests, and document fix.
   - If idempotency bug: implement dedupe by unique delivery/event id and add replay test.
4. Validate
   - Run eslint and tests in affected project(s).
   - Include failing tests only if pre-existing; clearly separate baseline failures from new failures.
5. Output
   - RCA summary
   - Action taken
   - Validation results
   - Follow-up recommendations

Execution constraints:
- Keep changes minimal and targeted.
- Do not change unrelated issue workflow rules.
- Prefer deterministic fixes with regression tests.
```

---

## Context from Latest Public Docs Used

- Linear Webhooks docs (delivery semantics, retries, signature verification, payload shape including `updatedFrom`, `webhookId`).
- Linear Issue Status docs (duplicate transitions map to Canceled category, customizable duplicate status).
- Composio Linear/Cursor integration docs (tool/action-based Linear operations for agent workflows).

## Recommended next automation step (when MCP is connected)

1. Post the "Operator Prompt Template" to `DTS-1624` as a comment.
2. Launch Cursor agent with the same prompt and issue metadata filled in.
3. If code changes are made, ensure lint/test execution output is attached back to the issue update.
