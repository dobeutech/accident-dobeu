# DTS-1689 Linear Duplicate Status Debug Prompt

## Trigger context

- Linear issue: `DTS-1689`
- Title: `[Email] Refund denied for ZAGG Ultra Eco Google Pixel....`
- URL: `https://linear.app/dobeutechsolutions/issue/DTS-1689/email-refund-denied-for-zagg-ultra-eco-google-pixel`
- Trigger: Linear issue `status_changed`
- New status: `Duplicate`
- Status type: `canceled`
- Priority: High
- Source: Auto-created from Gmail triage
- Email sender: `return@amazon.com`
- Email subject: `Refund denied for ZAGG Ultra Eco Google Pixel....`
- Gmail message ID: `19e0125edcf52e15`

## Root-cause assessment

The status change is most likely expected Linear duplicate handling, not a product defect.
Linear's current issue relation documentation states that marking an issue as a duplicate
changes the issue status to a canceled status. The webhook payload matches that behavior:
`newStatus` is `Duplicate` and `statusType` is `canceled`.

The remaining operational risk is not the status transition itself. The risk is whether
the duplicate classification points at the correct canonical issue and whether the Gmail
triage automation duplicated an email issue that should have been merged, linked, or ignored.

## Documentation checked before prompt creation

- Linear issue relations: duplicate issues are merged into the canonical issue and the
  duplicate is moved to canceled status.
- Linear API and webhooks: Linear uses a GraphQL API, supports entity mutations, and
  issue webhooks include changed data plus previous values.
- ESLint 9 migration docs: flat config is the default in ESLint 9; legacy eslintrc can
  still be used with `ESLINT_USE_FLAT_CONFIG=false`, which this repository's backend
  lint script already does.
- Jest 30 CLI docs: `npm test -- --runInBand` forwards CLI arguments to Jest and runs
  tests serially in the current process for debugging.

Context7 MCP was requested but no Context7 MCP resource/tool was exposed in this
automation environment. If the launched agent has Context7 available, it should re-check
the current docs there before making code changes.

## Prompt to launch with Composio Cursor agent

```text
You are resolving Linear automation event DTS-1689.

Goal:
Determine whether the Linear issue status change to Duplicate is legitimate, document the
root cause on the issue, and only make code changes if the duplicate classification or
Gmail triage automation is wrong.

Required tool order:
1. Inventory all available MCP servers and tools first. Prefer MCP tools over ad hoc API
   calls when Linear, Composio, Context7, Gmail, or Cursor tools are available.
2. Use Context7 to fetch current documentation for the technologies you touch before
   making changes. At minimum check Linear issue relations/API/webhooks, Composio Cursor
   agent launch docs, ESLint 9 config behavior, and Jest 30 CLI behavior.
3. Use Linear MCP to fetch DTS-1689, including full comments, issue relations, status
   history, and the canonical duplicate issue if present.

Investigation steps:
1. Confirm the event payload:
   - Issue: DTS-1689
   - Trigger: status_changed
   - New status: Duplicate
   - Status type: canceled
   - Source email message ID: 19e0125edcf52e15
2. Determine the causal chain:
   - Who or what marked DTS-1689 duplicate?
   - Which canonical issue is DTS-1689 a duplicate of?
   - Does the canonical issue reference the same Amazon refund denial email, sender,
     subject, thread, or message ID?
   - Was the duplicate state created by Linear's duplicate relation behavior or by a
     custom Gmail triage automation?
3. If the canonical issue exists and matches the same email/thread, treat this as an
   expected duplicate cancellation. Add a Linear comment with:
   - Root cause: Linear duplicate relation moved the issue to the Duplicate/canceled
     workflow state.
   - Canonical issue link/identifier.
   - Evidence: matching sender, subject, thread/message ID, or relation metadata.
   - Action: no code changes needed.
4. If the canonical issue is missing, unrelated, or the same Gmail message created
   multiple unlinked issues, investigate the Gmail triage automation repository or
   integration logs. Find the source of duplicate detection and fix only the root cause.
   Do not patch symptoms without a verified causal chain.

Repository validation:
1. Work on branch `cc-dev/DTS-1689-linear-issue-debugging-prompt-0fec`.
2. Before editing files, run `git status --short --branch` and preserve unrelated work.
3. If code changes are needed, write or update a focused regression test first.
4. Run the relevant validation:
   - Backend lint: `cd backend && npm run lint`
   - Backend tests: `cd backend && npm test -- --runInBand`
   - Web build if web files changed: `cd web && npm run build`
   - Mobile validation if mobile files changed: run the lightest available Expo or
     package validation command documented in `mobile/package.json`
5. If lint/tests fail on unchanged baseline behavior, document the failure with exact
   command output and do not claim the repository is clean.

Linear updates:
1. Update DTS-1689 as investigation progresses:
   - Comment when investigation starts.
   - Comment with root cause and canonical duplicate evidence.
   - If code changes are required, comment with branch, commits, validation commands,
     and remaining failures.
2. Keep the issue canceled/duplicate if the duplicate classification is valid.
3. Move/reopen the issue only if the duplicate classification is invalid or the
   automation needs a fix.

Acceptance criteria:
- DTS-1689 has a comment containing the root cause and canonical duplicate evidence.
- If no code action is needed, the issue remains Duplicate/canceled with a clear note.
- If code action is needed, the fix is committed and pushed to
  `cc-dev/DTS-1689-linear-issue-debugging-prompt-0fec`.
- ESLint and tests are run, with results documented in Linear.
```

## Local execution note

This automation run could not directly update Linear or launch a Composio Cursor agent
because no Linear, Composio, or Context7 MCP resources/tools were exposed and no related
environment credentials were available. GitHub CLI was available, but it does not provide
the requested Linear/Composio actions.
