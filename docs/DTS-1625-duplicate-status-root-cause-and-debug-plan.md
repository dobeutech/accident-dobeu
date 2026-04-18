# DTS-1625 Duplicate Status Root Cause and Debug Plan

## Incident context

- Linear issue: `DTS-1625`
- Trigger: `status_changed`
- New status: `Duplicate` (status type `canceled`)
- Title: `[Email] Purchase declined: Your virtual card is locked`
- Source metadata in description:
  - `Auto-created from Gmail triage`
  - `From: Capital One | VentureOne`
  - `Message ID: 19d9fbe69256d460`

## What is confirmed vs inferred

### Confirmed

1. The issue was auto-created from a Gmail triage pipeline.
2. The issue moved to `Duplicate`.
3. In Linear, marking an issue duplicate transitions it into the canceled category (default behavior, configurable workflow state).

### Inferred root cause (most likely)

The duplicate transition was likely intentional automation behavior from the email triage workflow:

1. Gmail triage created/updated the issue using a dedupe key (likely email thread identity or a message-id-derived fingerprint).
2. Another issue already represented the same incoming event (same card decline alert source/content/signature).
3. The automation marked this issue as duplicate, which moved it to the canceled/duplicate status state in Linear.

This is a pipeline-level dedupe decision, not necessarily an application-code runtime failure.

## Environment limitation encountered

MCP servers named in the request were not available in this runtime:

- `Composio`: server not found
- `Linear`: server not found
- `Context7`: server not found

Because of that, no direct issue comment updates or agent launches could be executed from this session.

## Additional technical evidence gathered from repo validation

To prepare a robust debug prompt for the agent run, backend checks were executed:

- `npm ci` in `backend/`: pass
- `npm run lint` in `backend/`: fail with large baseline lint debt (`1170 problems`)
- `npm test -- --runInBand` in `backend/`: fail with pre-existing test failures:
  - `src/__tests__/services/telematicsService.test.js`
    - `TypeError: Invalid initialization vector`
  - `src/__tests__/services/imageValidationService.test.js`
    - Rekognition mocks not called as expected, status mismatch assertions
  - `src/utils/validateEnv.js`
    - code path invokes `process.exit(1)` in tests

These failures are useful for the requested debug/run prompt, but they are not direct evidence for why Linear marked DTS-1625 as duplicate.

## Documentation grounding used (fallback for unavailable Context7)

Latest doc references researched:

1. ESLint migration guidance (v10 removes legacy eslintrc flow)
2. Jest 30 guidance for open-handle/debug and process.exit mocking
3. AWS SDK JS v2 end-of-support notice (migration recommended to v3)
4. Linear duplicate behavior docs (duplicate => canceled status category)
5. Composio toolkit docs for Linear/Cursor action patterns

## Linear comment template (post when Linear MCP is available)

```md
### Automated Incident Analysis (DTS-1625)

Observed event:
- Trigger: status_changed
- New status: Duplicate (Canceled category)
- Issue source: Gmail triage auto-created item
- Message ID: 19d9fbe69256d460

Likely root cause:
- The triage dedupe logic identified this issue as already represented by another issue (likely using message/thread fingerprinting), then marked it as Duplicate.
- This transition is consistent with Linear's duplicate behavior.

Recommended follow-up:
1. Locate canonical linked issue and verify same email fingerprint/thread metadata.
2. Audit triage dedupe key generation for Message-ID normalization (case/whitespace/forwarded variations).
3. Add decision logging to duplicate transitions:
   - dedupe_key
   - matched_issue_id
   - confidence
   - trigger source (create/update/status transition)
4. Add regression tests for:
   - exact duplicate
   - near-duplicate with forwarded subject prefixes
   - false-positive avoidance for similar-but-distinct card alerts

Prepared debug prompt attached below for automated Cursor-agent execution.
```

## Cursor-agent debug prompt template (for Composio launch)

```text
You are debugging a Linear automation event for issue DTS-1625.

Goal:
Determine the exact causal chain that moved the issue "[Email] Purchase declined: Your virtual card is locked" into Duplicate, confirm whether the transition was correct, and implement any needed fixes with tests.

Context:
- Trigger type: Linear issue webhook -> status_changed
- New status: Duplicate (Canceled category)
- Issue description indicates auto-created Gmail triage
- Message ID in payload: 19d9fbe69256d460
- Priority: High

Execution requirements:
1) Reconstruct event flow end-to-end
   - Inspect webhook handlers for issue created/status changed
   - Trace dedupe logic, matching strategy, and normalization rules
   - Identify exact function and condition that set Duplicate
   - Produce a concrete causal chain with file:line references

2) Validate behavior against platform docs/expected semantics
   - Confirm Linear duplicate transition semantics (duplicate => canceled category)
   - Confirm intended product rule for Gmail-triage duplicates in this codebase

3) If behavior is incorrect, implement minimal root-cause fix
   - Prefer one focused change
   - Add or update tests reproducing DTS-1625 scenario
   - Include tests for near-duplicate and false-positive cases
   - Keep imports at top-level; avoid inline imports

4) Run quality gates
   - npm ci (relevant package dirs)
   - eslint (record current baseline vs new violations)
   - tests (targeted first, then broader suite where practical)
   - If baseline failures are pre-existing, isolate and document them clearly

5) Update Linear issue with structured findings
   - Root cause summary
   - Whether Duplicate decision was correct/incorrect
   - Fix summary and test evidence
   - Follow-up actions and residual risks

Repository-specific known baseline from previous run:
- backend lint currently reports large pre-existing violation count
- backend tests currently fail in telematics/imageValidation suites and process.exit path in validateEnv
- treat these as baseline unless your change directly affects them

Deliverable format:
## Debug Summary
Problem:
Root Cause:
Fix:
Tests:
Lint/Test Results:
Linear Update Comment:
Confidence:
```

## Suggested Composio action sequence once MCP access is restored

1. Read latest Linear issue and linked duplicate/canonical issue.
2. Post the analysis template comment.
3. Launch Cursor agent with the prompt template above.
4. Poll agent execution.
5. Update issue status/comment with final validation evidence.

