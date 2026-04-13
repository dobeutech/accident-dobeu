# DTS-1622 Linear Status Change RCA + Debug Prompt Template

## Event reviewed

- Issue: `DTS-1622`
- Trigger type: `status_changed`
- New status: `Duplicate`
- Status type: `canceled`
- Title: `[DONE] Customer Pipeline — 7 records, $36.5K pipeline value, all 9 tables populated (324 total)`

## Root cause determination

### Primary root cause (most likely)

This status transition is consistent with **intentional duplicate handling in Linear**, not a platform failure.

Per Linear docs:

- Marking an issue as duplicate changes it into the **Canceled** status category.
- Teams may configure a custom canceled status such as **Duplicate**.

Given the trigger payload (`newStatus: Duplicate`, `statusType: canceled`), the change aligns with expected workflow semantics.

### Evidence

- Linear docs (`Issue status`, `Issue relations`) state duplicate marking automatically transitions an issue to canceled.
- Payload directly matches this behavior.

### Secondary process gap identified

The trigger payload does not include the canonical issue key/reference this issue was marked duplicate of, making downstream automation and audit trails less clear.

---

## Action decision

### Immediate action needed?

- **No urgent remediation required** for the status transition itself.
- **Recommended follow-up action**: improve automation observability by always attaching canonical issue linkage and rationale when duplicate events are processed.

---

## Prompt template to post on Linear issue (or automation comment)

Use this template in a Cursor/agent run when duplicate transitions need validation or reversal.

```md
## Duplicate Status RCA + Debug Execution Prompt

You are debugging a Linear issue status transition that moved an issue to `Duplicate` (canceled).

### Inputs
- Workspace: <team/workspace>
- Issue ID: <issue-id>
- Current status: <status>
- Trigger payload JSON: <payload-json>
- Suspected canonical issue: <issue-key-or-unknown>

### Objectives
1. Determine whether duplicate status is valid or accidental.
2. If accidental, restore correct status and remove incorrect duplicate linkage.
3. If valid, enrich the issue with canonical linkage + rationale.
4. Run repository quality checks (eslint + tests) for any code/config changes made during debugging.

### Required procedure
1. **Verify Linear semantics**
   - Confirm this transition matches team workflow settings for canceled statuses.
   - Confirm whether `Duplicate` is configured as default duplicate target status.
2. **Trace duplicate relationship**
   - Identify canonical issue linked to this duplicate.
   - Capture who/what action created the duplicate relation (user action vs automation).
3. **Validate automation path**
   - Inspect webhook event logs for `status_changed` and duplicate relation events.
   - Check dedupe logic (title/description/source matching thresholds).
   - Confirm no false-positive matching from generic prefixes like `[DONE]`.
4. **Remediate**
   - If false duplicate: remove duplicate relation, return issue to prior status, and note rationale.
   - If true duplicate: add canonical issue link and closure rationale comment.
5. **Code quality checks (if repo edits were required)**
   - Run:
     - `npm run lint` (or workspace-equivalent)
     - `npm test -- --runInBand` (or workspace-equivalent)
   - Report pass/fail with failing suites and likely causes.
6. **Post structured report**
   - Root cause
   - Actions taken
   - Validation results
   - Follow-up tasks

### Output format (must follow)
- `Root Cause:` <text>
- `Decision:` <valid duplicate | false duplicate>
- `Canonical Issue:` <id/link or not found>
- `Changes Applied:` <bullets>
- `Lint Result:` <pass/fail + summary>
- `Test Result:` <pass/fail + summary>
- `Next Actions:` <bullets>
```

---

## Latest docs consulted before writing prompt

- Linear:
  - https://linear.app/docs/configuring-workflows
  - https://linear.app/docs/issue-relations
- Composio changelog (for current integration considerations):
  - https://docs.composio.dev/docs/changelog
- ESLint v9 migration/runtime behavior:
  - https://eslint.org/docs/latest/use/migrate-to-9.0.0

---

## Local execution evidence (run in this workspace)

- `backend/npm ci`: **pass**
- `backend/npm run lint`: **fail** (pre-existing lint violations)
- `backend/npm test -- --runInBand`: **fail** (pre-existing test failures)
  - `src/__tests__/services/telematicsService.test.js`:
    - `TypeError: Invalid initialization vector`
    - kill-switch expectation mismatch in one test
  - `src/__tests__/services/imageValidationService.test.js`:
    - AWS Rekognition mocks/expectations not matching current behavior
  - `src/utils/validateEnv.js`:
    - test run exits process when env validation fails

These failures should be treated as baseline technical debt unless proven newly introduced by specific changes.
