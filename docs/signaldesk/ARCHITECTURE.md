# SignalDesk architecture contract — 2026-10-14

## Verified baseline

- Default branch `main`, HEAD `56a0b1b`; feature branch starts here. No AGENTS.md or tests on this branch. `npm test --if-present --workspaces` exits 0 with **no tests**, not evidence of coverage.
- Netlify Local Prospects site `5bbaa3bd-d1d9-4953-b817-70e0042dfef9` publishes deploy `6accdc55afffbfd7783a18a6` from `fix/scheduled-write-outcomes`, commit `b722b4f1d714c1925a36f2a90ad7b49bba07d045` (not main). Production state handler is identical to main; the published UI includes improved sync-counter wording. Do not replace this deployment from main.
- Site homepage HTTP 200; unauthenticated GET `/api/state` HTTP 401. Authenticated Dashboarda MCP `dashboard_read(local-prospects,50)` returned 5 prospects, runs=1, updatedAt=2026-10-13T00:19:11.851Z. That establishes current read access, not scheduled research health or a new write.
- MCP code exists on the published branch, routes local-prospects to this site's `/api/state`, authenticating downstream with `LOCAL_PROSPECTS_READ_PIN` / `LOCAL_PROSPECTS_WRITE_TOKEN`. No MCP changes needed.
- GET requires `x-dashboard-pin`; POST requires bearer write token. Site-wide `dashboard-state/state` in production, deploy-scoped store elsewhere. Stored items have `_key`, `firstSeenAt`, `lastSeenAt`, `seenCount`; state has runs, updatedAt and runHistory.

## Minimal addition

Add a disabled-by-default daily scheduled function to the existing Local Prospects app. Read the existing blob directly within the same site and production context, with no POST and no public sync endpoint. Reuse the **persisted `_key` verbatim**, prefixed `local-prospects:` for External ID. Reject records missing identity rather than reconstructing Dashboarda deduplication. Never modify the existing state function or MCP. A read-only, PIN-gated health endpoint exposes sanitized bridge results from a separate store.

Synchronize only allowlisted research fields. Airtable owns Qualification status, Activities links, notes and task lifecycle. Source `status` does not drive qualification. Missing optional source fields clear their source-owned destination fields. Source deletions never delete Airtable records. Changes to Dashboarda's identity create a new destination record; identity migration requires review.

Airtable PATCH `performUpsert`, merging on External ID, batches <=10. Read destination pages, reject duplicate IDs before writing, skip unchanged records, retry transient errors within a bounded deadline. One scheduled writer per base; no concurrent external importers. Airtable has no unique constraint; duplicate preflight and server-side upsert are not a cross-system transaction. Partial writes are reported and safe to reconcile on next run. No external script creates Activities.

## Access and release blockers

No Airtable tool or AIRTABLE environment variable is exposed. Available browser opens Airtable's public signed-out page. Existing Netlify variables are masked; no Airtable configuration was found by key. Base creation and native automation require an Airtable creator session. PAT scope for runtime: `data.records:read`, `data.records:write`, restricted to the one base; setup can be done in UI without schema API permission. Do not paste tokens into chat or Git.

No production deployment in reconnaissance. Existing published branch differs from default: deployment must preserve its current features. Keep bridge disabled until base, field types and native automation are verified. Do not merge this feature branch to main.

## Free plan constraints (official docs checked 2026-10-14)

1,000 records **across the base**, 1,000 API calls/workspace/month, 100 automation runs/workspace/month; failed triggers also consume runs. No automation Run a script action. Use native condition/create/update actions. Daily synchronization: approximately `ceil(prospects/100)` reads plus `ceil(changed/10)` writes/run, excluding retries. At five prospects that is ~31 reads/month plus writes; other integrations share the budget. Activities consume the same record pool. Review usage before scaling.

References:
- https://support.airtable.com/articles/2277136852-airtable-plans-overview
- https://support.airtable.com/articles/3669392397-getting-started-with-airtable-automations
- https://support.airtable.com/articles/7735693959-managing-api-call-limits-in-airtable
- https://airtable.com/developers/web/api/update-multiple-records
- https://support.airtable.com/articles/7369519794-airtable-automation-trigger-when-record-matches-conditions

## Access update — 21:38 UTC

The user connected the Airtable plugin. Creator/owner access is now verified. Dedicated base appRoOSGbph3XGzNu and linked tables exist; five real prospects imported and repeated safely through the committed core engine using a connector adapter. The native create/update automation is a valid **off draft**, and the connector requires the user to review/enable it in Airtable. This supersedes the initial connector-absence blocker above. Netlify's independent runtime PAT is still missing, and there is no live unattended schedule proof. See EVIDENCE.md and live-evidence.json.
