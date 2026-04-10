# DTS-1575 Root Cause + Debug Prompt Template

## Event reviewed

- Trigger type: `linear.issue.status_changed`
- Issue: `DTS-1575`
- Title: `[Email] Withdrawal notice`
- New status: `Duplicate` (status type: `canceled`)
- Assignee: `Dobeutech`
- Source note in description: `Auto-created from Gmail triage`
- Message ID in description: `19d76a40edcc1a29`

## Root-cause determination

### Most likely root cause
The issue was auto-created from Gmail triage and then marked `Duplicate` to cancel redundant triage noise. The available payload strongly suggests this was not a product-code defect, but a workflow-level deduplication/triage action.

### Why this is the most likely cause
1. The issue title is email-ingest style (`[Email] Withdrawal notice`) instead of engineering-task style.
2. The description explicitly states `Auto-created from Gmail triage`.
3. Status transitioned to `Duplicate` with `canceled`, which is a typical outcome for non-actionable or repeated inbound email alerts.
4. A message identifier is present; repeated ingestion of equivalent emails commonly produces duplicate issues if dedupe is not strict on message identity/thread identity.

### Confidence and gaps
- Confidence: **medium-high** (based on trigger payload + Linear webhook semantics).
- Gap: Actor metadata for who/what changed status is not present in the trigger context we received. Final confirmation requires reading the Linear issue activity log (`actor`, `updatedFrom`, and related duplicate link).

## Action required?

Yes. Even if this specific issue was correctly canceled, automation reliability should be improved so duplicate email triage issues are suppressed earlier and consistently linked to a canonical issue.

## Prompt template to add to Linear issue comment

Use this comment body in Linear (`DTS-1575`), or for any similar duplicate status-change event:

```md
### Automated duplicate-analysis plan (DTS-1575)

Observed event:
- Issue moved to **Duplicate / Canceled**
- Source: **Auto-created from Gmail triage**
- Message ID: `19d76a40edcc1a29`

#### Working root cause
Likely duplicate issue generation from Gmail triage ingestion (same or equivalent email mapped to multiple Linear issues), then manually/automatically canceled as duplicate.

#### Debug objectives
1. Identify the exact actor and transition path for the duplicate status change.
2. Confirm whether dedupe keying uses `Message-ID`, `threadId`, normalized `subject`, and sender.
3. Ensure dedupe links new events to an existing canonical issue instead of creating a new one.
4. Add observability so future duplicate cancelations are explainable from logs.

#### Implementation checklist
- [ ] Inspect Linear issue activity/audit trail for `state` transition metadata and actor.
- [ ] Validate webhook handler idempotency keyed by `webhookId` and ingestion idempotency keyed by email fingerprint.
- [ ] Confirm webhook signature/timestamp verification is enforced.
- [ ] Add/verify dedupe strategy:
  - primary: RFC `Message-ID`
  - secondary: provider `threadId`
  - tertiary fallback: hash(sender + normalized_subject + date_bucket)
- [ ] If duplicate is detected, update canonical issue (comment/attachment) instead of creating a new issue.
- [ ] Add structured logs for: `source_email_id`, `dedupe_key`, `matched_issue_id`, `decision`.
- [ ] Add tests for:
  - repeated identical email event (same Message-ID)
  - same thread, changed subject prefix (`Re:`, `Fwd:`)
  - webhook retry redelivery with same `webhookId`
  - near-duplicate subject collisions (should not over-merge)

#### Validation commands (run in repo)
- Backend lint: `cd backend && npm run lint`
- Backend tests: `cd backend && npm test -- --runInBand`
- Web build check: `cd web && npm run build` (if web pipeline is impacted)

#### Exit criteria
- Duplicate ingestion path is deterministic and idempotent.
- Canonical issue linking verified.
- Lint/tests executed and results documented in Linear comment.
- If failures are pre-existing, capture baseline evidence and avoid false attribution.
```

## Cursor-agent launch prompt (for Composio-run automation)

If/when Composio MCP is available, use this exact prompt to launch a Cursor agent:

```txt
You are investigating Linear issue DTS-1575 ([Email] Withdrawal notice) after status changed to Duplicate/Canceled.

Goals:
1) Determine exact root cause for duplicate transition using issue history, webhook data, and ingestion logs.
2) Implement or verify dedupe+idempotency safeguards in the email->Linear pipeline.
3) Run lint and tests, then report results with clear attribution of new vs pre-existing failures.
4) Post findings and remediation summary back to Linear issue DTS-1575.

Required analysis:
- Pull issue activity (including actor and updatedFrom fields around state change).
- Check whether duplicate relation points to a canonical issue.
- Trace the originating Gmail triage event for Message-ID 19d76a40edcc1a29.
- Confirm Linear webhook handling follows current docs:
  - verify Linear-Signature from raw request body
  - validate webhookTimestamp freshness
  - enforce idempotency by webhookId
- Confirm email ingestion dedupe uses Message-ID/threadId/fingerprint fallback.

Code/tasks:
- Add or fix dedupe logic where needed.
- Add/expand automated tests for duplicate ingestion and webhook redelivery.
- Add structured logs/metrics around dedupe decisions.

Validation commands:
- cd backend && npm run lint
- cd backend && npm test -- --runInBand
- cd web && npm run build (if relevant)

Reporting format:
1) Root cause (single sentence)
2) Evidence (bullet list with log/test references)
3) Code changes (files + rationale)
4) Validation results (pass/fail with command output summary)
5) Linear status recommendation (keep canceled, reopen, or linked duplicate)
```

## Documentation references used (latest available at run time)

- Linear Webhooks docs: https://linear.app/developers/webhooks
- Composio Linear toolkit docs (version shown in docs: `20260407_00`): https://docs.composio.dev/toolkits/linear
- ESLint CLI reference: https://eslint.org/docs/latest/use/command-line-interface
- Context7 project/release references:
  - https://github.com/upstash/context7
  - https://github.com/upstash/context7/releases

## Execution note for this environment

MCP servers `Composio`, `Linear`, and `Context7` were not configured/available in this runtime, so:
- root-cause determination was completed from trigger payload + official docs;
- prompt templates were generated for manual/next-run posting and agent launch;
- direct Linear comment/status update and Composio agent launch could not be executed here.
