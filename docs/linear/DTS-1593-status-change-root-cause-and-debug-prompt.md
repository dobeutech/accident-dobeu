# DTS-1593 Root Cause and Debug Prompt (Linear status changed to Duplicate)

## Issue Event Snapshot

- Linear issue: `DTS-1593`
- Title: `[P0] dobeu.online DNS — Cloudflare CNAME to Webflow`
- Event: status changed
- New status: `Duplicate` (canceled)
- Description: `Zone c6e3bf89... needs CNAME → Webflow proxy. Currently 404.`

## Connection/Tooling Notes

This automation run attempted to use MCP servers for Composio, Linear, and Context7, but those servers were not available in the runtime (`Server not found`). As a fallback, this artifact uses:

1. Trigger payload data from the automation event
2. Current vendor documentation (Webflow + Cloudflare) gathered during this run

## Likely Root Cause for the Status Change

The most probable reason DTS-1593 was marked **Duplicate** is that it is an operational symptom of an already-tracked DNS migration/configuration item rather than a net-new bug.

Evidence from current docs:

1. Webflow now requires updated Cloudflare-era DNS records for legacy sites. Since Jan 13, 2026, publishing to outdated legacy DNS targets is blocked until records are migrated.
2. Webflow + Cloudflare configuration has two distinct valid modes:
   - Standard Webflow hosting: `www CNAME -> cdn.webflow.com` and apex `A -> 198.202.211.1`, both DNS-only (grey cloud)
   - O2O proxied mode: apex + `www` as proxied CNAME to `cdn.webflow.com` (with old A records removed)
3. A `404` in this scenario commonly indicates one of:
   - domain not correctly connected/verified/published in Webflow
   - DNS mode mismatch (partial setup expectations vs full setup)
   - stale/legacy DNS targets still configured
   - proxy mode conflicts or ownership conflicts with another Cloudflare-backed provider

Given the issue text (`CNAME -> Webflow proxy`) and cancellation as duplicate, this likely overlaps with a broader migration or existing DNS incident ticket covering the same domain/zone.

## Actionability Decision

Even though the issue is canceled as duplicate, action is still needed if production still returns `404`. The right action is:

1. Link this issue to the canonical parent incident/task.
2. Run a deterministic DNS/Webflow verification playbook.
3. Record findings and either:
   - close as true duplicate (same root cause and same fix path), or
   - reopen/create a child task if `dobeu.online` has a unique misconfiguration.

## Prompt Template to Add to Linear Issue

Use the following prompt as a comment/template in Linear for reproducible debugging:

```text
You are an infrastructure debugging agent. Investigate and resolve domain outage for:

- Domain: dobeu.online
- Symptom: HTTP 404 while routing Cloudflare -> Webflow
- Issue: DTS-1593 (marked Duplicate; verify whether truly duplicate)

Goal:
1) Determine exact DNS/Webflow misconfiguration causing 404.
2) Apply the minimal safe fix.
3) Validate traffic and publishing behavior.
4) Document whether this issue should stay Duplicate or be reopened.

Constraints:
- Do not change unrelated DNS records.
- Preserve email-related records (MX/TXT/SPF/DKIM/DMARC).
- Snapshot before/after configs.

Step-by-step procedure:

A. Collect current state
1. Capture Cloudflare zone DNS records for:
   - @, www, and any web-serving subdomains
2. Capture proxy status (DNS-only vs proxied) for those records.
3. In Webflow Site settings > Publishing > Production, capture:
   - expected DNS records currently shown by Webflow
   - custom domain verification status
   - default domain setting
   - last publish status and timestamp
4. Capture whether site was created before Apr 21, 2025 and whether migration prompts appear.

B. Determine intended architecture
Choose exactly one mode:
1. Standard mode (no Cloudflare proxy features for origin path)
   - www CNAME -> cdn.webflow.com (DNS-only)
   - @ A -> 198.202.211.1 (DNS-only)
2. O2O proxied mode
   - @ CNAME -> cdn.webflow.com (proxied)
   - www CNAME -> cdn.webflow.com (proxied)
   - Remove conflicting A records for @

If mode is mixed or ambiguous, treat as misconfiguration.

C. Validate blockers
1. Check for stale legacy Webflow DNS targets and remove/replace per current Webflow dashboard requirements.
2. Check Zone Hold status; release temporarily if SSL issuance blocked.
3. Check CAA records allow Let's Encrypt and Google Trust Services.
4. Check for provider ownership conflicts (domain attached to another Cloudflare-backed host).

D. Apply fix
1. Update only records required for the selected mode.
2. Verify domain ownership in Webflow.
3. Set correct default domain.
4. Publish site to custom domain.

E. Verify
1. DNS: confirm authoritative answers for @ and www resolve to intended targets.
2. HTTP:
   - curl -I https://dobeu.online
   - curl -I https://www.dobeu.online
3. Confirm no 404 and expected site content is served.
4. Confirm Webflow publishing is no longer blocked by legacy DNS.

F. Output
Return:
1. Root cause statement (single paragraph).
2. Before/after DNS table.
3. Validation evidence (DNS + HTTP + Webflow publish status).
4. Recommendation:
   - keep DTS-1593 as Duplicate with link to parent issue, OR
   - reopen/create non-duplicate follow-up with precise scope.
```

## Sources Used (latest docs checked during run)

- Webflow: Connect your Cloudflare domain to Webflow  
  https://help.webflow.com/hc/en-us/articles/33961315914515-Connect-your-Cloudflare-domain-to-Webflow
- Webflow: Update your DNS settings for Webflow's Cloudflare migration  
  https://help.webflow.com/hc/en-us/articles/43788433744147-Update-your-DNS-settings-for-Webflow-s-Cloudflare-migration
- Webflow: Using Cloudflare Orange-to-Orange (O2O) with Webflow  
  https://help.webflow.com/hc/en-us/articles/45039458051347-Using-Cloudflare-Orange-to-Orange-O2O-with-Webflow
- Cloudflare: CNAME setup (partial)  
  https://developers.cloudflare.com/dns/zone-setups/partial-setup/setup/
