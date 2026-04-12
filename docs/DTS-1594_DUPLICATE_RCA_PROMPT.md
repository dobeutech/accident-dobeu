# DTS-1594 RCA + Debug Prompt Template

## Trigger Context

- Source: Linear webhook (`issue.status_changed`)
- Issue: `DTS-1594` - `[P0] Stripe → Project Kickoff Kit automation`
- New status: `Duplicate`
- Status type: `canceled`
- Description: `checkout.session.completed → Linear + Drive + Calendar + Customer.io. Full spec in Airtable.`

## Root Cause Determination

### Immediate cause (high confidence)

The issue was marked as a duplicate in Linear, which automatically moved it into the `Canceled` workflow category with status `Duplicate`. This behavior is expected per Linear workflow configuration rules.

### Probable upstream cause (medium confidence)

The project kickoff automation likely created multiple similar issues from the same business event (Stripe checkout completion), and one was later marked duplicate. Most common technical reason: missing idempotency controls for webhook-driven issue creation.

### Supporting evidence

1. Trigger is a status change to `Duplicate`, not a creation failure.
2. Linear workflow docs define duplicate handling as a canceled-type transition.
3. Stripe webhook docs explicitly warn that webhook delivery can be retried and duplicated unless handlers are idempotent.

## Docs Basis (latest references consulted)

- Stripe webhooks: <https://docs.stripe.com/webhooks>
- Linear issue statuses/workflows: <https://linear.app/docs/configuring-workflows>
- Customer.io event/campaign triggers: <https://docs.customer.io/journeys/campaign-triggers/>
- Google Calendar API create events guide: <https://developers.google.com/workspace/calendar/api/guides/create-events>

## Planned Debug/Resolution Prompt (for Cursor agent)

Copy/paste this prompt into the automation agent:

```text
You are debugging duplicate issue handling for Linear issue DTS-1594.

Goal:
1) Determine why issue(s) generated from Stripe checkout.session.completed are becoming duplicates.
2) Implement idempotency + dedupe protections so one checkout creates one kickoff workflow artifact set (Linear issue, Drive folder, Calendar event, Customer.io trigger).
3) Run lint and tests and report results.

Context:
- Incident: DTS-1594 was moved to Duplicate (canceled).
- Pipeline intent: checkout.session.completed -> Linear + Drive + Calendar + Customer.io.
- Stripe webhook delivery can retry. Linear duplicate status is expected when duplicate relation is set.

Execution plan:
1. Locate all code paths handling:
   - Stripe webhook `checkout.session.completed`
   - Linear issue creation/update
   - Drive folder creation
   - Calendar event creation
   - Customer.io event/campaign trigger
2. Build an evidence timeline:
   - Correlate by Stripe `event.id`, `checkout_session.id`, customer identifier, and timestamps.
   - Confirm whether duplicate issues share the same checkout session/business key.
3. Implement idempotency guards:
   - Persist processed Stripe event IDs in durable storage with unique constraint.
   - Add business-level dedupe key (e.g., checkout_session_id or payment_intent_id) with unique constraint.
   - Make Linear creation path upsert-like (lookup by external key before create).
   - Ensure Drive/Calendar/Customer.io calls are idempotent (reconcile/update when key exists).
4. Add/update automated tests:
   - Replayed webhook event does not create a second Linear issue.
   - Concurrent duplicate webhook deliveries still create only one artifact set.
5. Observability:
   - Log structured fields: provider, event_id, dedupe_key, existing_artifact_ids, action_taken.
   - Emit metric/counter for dedupe hits.
6. Validation commands:
   - npm run lint --prefix backend
   - npm test --prefix backend -- --runInBand
7. Output:
   - Root cause summary
   - Files changed
   - Test/lint results
   - Follow-up recommendations
```

## Linear Comment Template

Use this as a status update comment in Linear:

```text
RCA update for DTS-1594:

- Immediate cause: issue transitioned to Duplicate (Linear canceled-type workflow behavior).
- Probable systemic cause: duplicate webhook/business-event processing (missing idempotency or dedupe key enforcement) in Stripe -> kickoff pipeline.

Prepared debug plan:
1) Correlate Stripe event.id + checkout_session.id across all downstream writes.
2) Add durable idempotency/event ledger + unique business key constraints.
3) Convert Linear create path to lookup-or-create by external key.
4) Add replay/concurrency tests.
5) Validate with lint/tests and report.

Note: MCP connectivity was unavailable in this runtime, so this update is provided as a copy/paste template for manual posting.
```
