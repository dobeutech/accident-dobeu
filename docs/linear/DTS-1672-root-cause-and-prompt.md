# DTS-1672 Root Cause and Debug Prompt

## Event

- Linear issue: `DTS-1672`
- Trigger: status changed to `Duplicate` (Canceled category)
- Title: Reconcile dobeu.org sysprodprompt: remove stale `statminer` repo reference

## Tooling availability check (required)

At task start, available MCP servers were checked first.

- `Composio`: not available in this runtime
- `Linear`: not available in this runtime
- `Context7`: not available in this runtime

Because those MCP servers are unavailable, the workflow used equivalent local + CLI verification.

## Root cause determination

### Root cause 1 (workflow-level)

Linear duplicate handling moves an issue into the Canceled status category by design.  
Official Linear docs indicate that marking an issue as duplicate sets status to Canceled (or a custom Duplicate status in Canceled).

### Root cause 2 (execution-level)

This checked-out repository (`dobeutech/accident-dobeu`) does not contain any target files from the issue scope:

- no `dobeu-org*sysprodprompt*.md` files
- no `*sysprodprompt*.md` files
- no `statminer` references

So the issue appears to be a duplicate or wrong-repository target for this specific branch/workspace.

## Verification evidence

### Repository visibility check

Command:

```bash
gh repo view dobeutech/statminer --json name,visibility,isPrivate,url
```

Result:

```json
{"isPrivate":false,"name":"statminer","url":"https://github.com/dobeutech/statminer","visibility":"PUBLIC"}
```

### Search checks in this workspace

- `Glob("**/*sysprodprompt*.md")` -> 0 files
- `rg "statminer"` -> no matches
- `rg "dobeu-org-claude-code-sysprodprompt"` -> no matches

## Planned prompt template (for the correct repo)

Use this prompt with a Cursor agent in the repository that actually stores dobeu-org sysprodprompt documents:

```text
Investigate and resolve stale statminer reference for Linear issue DTS-1672.

Context:
- Issue: Reconcile dobeu.org sysprodprompt: remove stale 'statminer' repo reference
- Goal: remove incorrect repository claims from dobeu-org sysprodprompts and align all variants.

Required steps:
1) Locate target docs:
   - dobeu-org-claude-code-sysprodprompt.md
   - dobeu-org-claude-code-sysprodprompt (1).md
   - any agent-prompts-all/*/dobeu-org-*-sysprodprompt.md variants
2) Search for "statminer" and any stale ownership/visibility wording.
3) Verify current repo visibility with:
   gh repo view dobeutech/statminer --json visibility,isPrivate,url
4) Update only dobeu-org prompt files so they reference only genuinely open repositories and accurate ownership context.
5) Confirm acceptance:
   - grep/rg for "statminer" across dobeu-org prompt files returns 0 hits
   - document exact files changed.
6) Run repo lint/tests and report:
   - command outputs
   - pass/fail
   - whether failures are pre-existing or introduced.
7) Output sections:
   - Root Cause
   - Files Updated
   - Validation Results
   - Suggested Linear Status Update

Constraints:
- Work on current branch only.
- Do not open/merge PR unless explicitly requested.
```

## Linear comment template

```markdown
Automation update for DTS-1672:

- Checked available MCP integrations first. In this runtime, `Composio`, `Linear`, and `Context7` MCP servers are not available.
- Performed equivalent local/CLI investigation on branch `cc-dev/DTS-1672-linear-issue-debugging-prompt-0a4e`.
- Confirmed `dobeutech/statminer` is currently **PUBLIC**.
- Searched this repository for dobeu-org sysprodprompt files and `statminer` references: **no matches**.

Root cause:
1. The issue status change to Duplicate/Canceled is consistent with Linear duplicate workflow behavior.
2. This repository is not the canonical location for the dobeu-org sysprodprompt files, so no direct fix was possible here.

Next action:
- Run the attached debug prompt in the repository that contains `dobeu-org-claude-code-sysprodprompt*.md` and `agent-prompts-all/*/dobeu-org-*-sysprodprompt.md`.
- After edits, verify `rg "statminer"` on dobeu-org prompt paths returns 0 hits and update issue status accordingly.
```

## Documentation references used

Since Context7 MCP was unavailable, fallback references were used:

- Linear docs: Issue relations / duplicate status behavior
- Linear docs: Workflow status configuration for Duplicate in Canceled category
- GitHub CLI docs: `gh repo list` and `gh repo view` visibility fields
