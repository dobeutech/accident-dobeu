# DTS-1685 Linear Triage

## Issue

- Linear issue: `DTS-1685`
- Title: `[Email] Security alert for jswilliamstu@gmail.com`
- Trigger: status changed
- Current status: `Duplicate`
- Status type: `canceled`
- Priority: High
- Source: Gmail triage automation

## Root cause determination

The status change was caused by triage marking an auto-created Gmail issue as a duplicate. The issue payload is a copied Google security alert sent to `jswilliamstu@gmail.com`, where `dobeuinc@gmail.com` is listed as the recovery email. The preview states that Airtable was granted access and recommends removing the recovery relationship if the account is not recognized.

Because the Linear status type is `canceled`, this is not currently an open product defect in the fleet accident application codebase. A repo search found no local Gmail, Linear, Composio, or email-triage implementation that would need a code fix for this event.

## Documentation checked

Context7 MCP tools were not exposed in this automation environment; `ListMcpResources` returned no MCP resources. Public docs were checked instead:

- Context7 docs index: `https://context7.com/docs/llms.txt`
- Linear GraphQL API: `https://linear.app/developers/graphql`
- Composio Cursor integration: `https://composio.dev/toolkits/composio/framework/cursor`

Relevant current details:

- Context7 provides hosted MCP docs at `https://mcp.context7.com/mcp` and a local `@upstash/context7-mcp` package.
- Linear uses the GraphQL endpoint `https://api.linear.app/graphql`; issues can be read by shorthand ID and updated with `issueUpdate`.
- Composio for Cursor is configured through an MCP server at `https://connect.composio.dev/mcp` and can dynamically load tools for services such as Linear and Gmail when connected.

## Action recommendation

No product-code action is required while the issue remains `Duplicate` / canceled.

Manual or automation follow-up is only needed if:

1. The duplicate relationship is incorrect and this security alert represents a unique unresolved account-security incident.
2. A related open issue is missing the security remediation checklist.
3. The Gmail triage automation repeatedly creates duplicate Linear issues for the same Gmail `Message ID`.

If any of those conditions is true, use the prompt below with a Cursor agent that has Composio, Linear, Gmail, and Context7 MCP tools connected.

## Cursor agent prompt template

```text
You are resolving Linear issue DTS-1685:

Title: [Email] Security alert for jswilliamstu@gmail.com
URL: https://linear.app/dobeutechsolutions/issue/DTS-1685/email-security-alert-for-jswilliamstugmailcom
Current status: Duplicate
Priority: High
Source: Gmail triage automation
Message ID: 19de54f5cef4445d

Use available MCP tools first:
1. Use Linear MCP to fetch DTS-1685, its duplicate/related issue links, activity history, comments, and the issue that it duplicates.
2. Use Gmail or Composio MCP to retrieve the original Gmail message by Message ID `19de54f5cef4445d` if permitted. Do not expose secrets, tokens, or private email contents beyond the minimum summary needed for incident handling.
3. Use Context7 MCP to fetch current docs for the technologies you touch before planning changes:
   - Linear GraphQL/API or Linear MCP for issue updates and comments.
   - Composio MCP/Cursor integration if using Composio to call Gmail or Linear.
   - Gmail/Google account-security docs if handling the email-security remediation.

Determine the root cause:
- Confirm whether DTS-1685 is correctly marked Duplicate.
- Identify the canonical Linear issue that should track the Google security alert.
- Determine whether the underlying event is only duplicate issue creation or a real security incident requiring account action.
- Check whether Gmail triage deduplication should key on Gmail Message ID, sender, subject, affected account, and security-alert event type.

If no code change is needed:
- Add a Linear comment to DTS-1685 and the canonical issue with:
  - Root cause summary.
  - Canonical issue link.
  - Whether user/security action is required.
  - Evidence sources checked.
  - Recommendation to leave DTS-1685 canceled as Duplicate.

If code or automation changes are needed:
- Inspect the repository for Gmail triage, Linear issue creation, and deduplication logic.
- Add or update tests first for duplicate Gmail alert handling.
- Implement the smallest fix that prevents repeat Linear duplicates for the same Gmail security alert.
- Run eslint and the relevant test suite. If baseline failures exist, isolate whether they predate your change and document exact commands and failures.
- Update Linear as work progresses: Investigating -> In Progress -> Done, or leave Duplicate if no code action is needed.
- Add a final Linear comment with:
  - Root cause.
  - Files changed.
  - Test and eslint results.
  - Any remaining manual account-security steps.

Security checklist:
- Do not paste private email body content into public logs or issue comments.
- Do not request or reveal Google account credentials.
- If Airtable access was unauthorized, instruct the account owner to review Google Account > Security > Third-party access and revoke unknown access, then rotate credentials and review recovery email settings.
```

## Suggested Linear comment

```md
Root cause review for DTS-1685:

This issue was auto-created from Gmail triage for Google security alert Message ID `19de54f5cef4445d` and is now in `Duplicate` / canceled status. Based on the webhook payload, the status change appears to be triage deduplication rather than a product-code failure.

No application code action is recommended unless the canonical issue is missing or the Gmail triage automation continues to create repeated Linear issues for the same Message ID/security-alert event. If follow-up is required, use the attached Cursor agent prompt template to verify the canonical issue, inspect the original Gmail message via Composio/Gmail MCP, research current Context7 docs, and run eslint/tests for any automation change.
```
