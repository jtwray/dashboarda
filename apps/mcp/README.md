# Dashboarda MCP — Slice 1B

Exactly three tools, using the existing stateless Auth0-protected Streamable HTTP service:

| Tool | Input | Required OAuth scope | Result |
| --- | --- | --- | --- |
| `dashboard_ping` | `{}` | `dashboard:read` | `{ ok: true, authenticated: true }` |
| `dashboard_read` | `{ dashboard, limit?: integer }` | `dashboard:read` | `{ dashboard, total, runs, updatedAt, items }` |
| `dashboard_upsert` | `{ dashboard, items: object[] }` | `dashboard:write` | `{ dashboard, received, total, runs, updatedAt }` |

Allowed dashboard IDs: `email-action`, `christian-jobs`, `local-prospects`, `job-rates`, `jeep-watch`. Inputs reject additional fields. Read defaults to 20 items, accepts 1–50, and never returns run history. Upsert accepts 0–50 objects and sends only `{ items }` to the existing API. An empty array records a successful zero-result sync, advancing run metadata without creating records. It has no replace mode. Replays can increment observation/run counters: **never retry an uncertain write automatically**. Failures are sanitized and include `uncertain` where appropriate.

Read annotations: read-only, non-destructive, closed-world. Upsert annotations: not read-only, non-destructive, closed-world, not idempotent.

## Operator deployment

Update only the existing **dashboarda-mcp** Netlify site. No authenticated tool is available to change its environment or Git deployment settings; no browser sign-in is needed for implementation/push.

1. In each source dashboard site's environment settings, copy `DASHBOARD_READ_PIN` and `DASHBOARD_WRITE_TOKEN` into the corresponding MCP variables below. Do not change the source sites. Use the production values and give the new MCP variables Functions scope in the Production deploy context. Never paste credentials into GitHub, logs, or chat.
2. Preserve MCP `AUTH0_ISSUER`, `AUTH0_AUDIENCE`, and `SECRETS_SCAN_OMIT_KEYS`. If Netlify's scan flags the copied credential values, append only the ten named credential keys below to the existing omit-key list; keep scanning enabled.
3. In dashboarda-mcp → Project configuration → Build & deploy → Continuous deployment, set the production branch to `feature/mcp-dashboard-tools`. Confirm base `apps/mcp`, build `npm run build`, publish `public`, functions `netlify/functions`. `netlify.toml` supplies the base-relative settings. Do not merge to main.
4. Deploys → Trigger deploy → Deploy site. Wait for Published/Ready; verify the deploy commit belongs to the new branch. A branch preview alone does not update the production endpoint.

| MCP environment variable | Source Netlify site | Copy value from |
| --- | --- | --- |
| `EMAIL_ACTION_READ_PIN` | dashboarda-email-action | `DASHBOARD_READ_PIN` |
| `EMAIL_ACTION_WRITE_TOKEN` | dashboarda-email-action | `DASHBOARD_WRITE_TOKEN` |
| `CHRISTIAN_JOBS_READ_PIN` | dashboarda-christian-jobs | `DASHBOARD_READ_PIN` |
| `CHRISTIAN_JOBS_WRITE_TOKEN` | dashboarda-christian-jobs | `DASHBOARD_WRITE_TOKEN` |
| `LOCAL_PROSPECTS_READ_PIN` | dashboarda-local-prospects | `DASHBOARD_READ_PIN` |
| `LOCAL_PROSPECTS_WRITE_TOKEN` | dashboarda-local-prospects | `DASHBOARD_WRITE_TOKEN` |
| `JOB_RATES_READ_PIN` | dashboarda-job-rates | `DASHBOARD_READ_PIN` |
| `JOB_RATES_WRITE_TOKEN` | dashboarda-job-rates | `DASHBOARD_WRITE_TOKEN` |
| `JEEP_WATCH_READ_PIN` | dashboarda-jeep-watch | `DASHBOARD_READ_PIN` |
| `JEEP_WATCH_WRITE_TOKEN` | dashboarda-jeep-watch | `DASHBOARD_WRITE_TOKEN` |

URLs:

- MCP: https://dashboarda-mcp.netlify.app/mcp
- Protected resource: https://dashboarda-mcp.netlify.app/.well-known/oauth-protected-resource
- Path-specific alias: https://dashboarda-mcp.netlify.app/.well-known/oauth-protected-resource/mcp
- Auth0 OpenID discovery: https://dev-x4geda25l7tl8ip3.us.auth0.com/.well-known/openid-configuration

Resource/audience stays the site-origin Auth0 API Identifier. Issuer stays `https://dev-x4geda25l7tl8ip3.us.auth0.com/`. Initial protected-resource discovery advertises read; each tool advertises its own required scope, including write for step-up. Every request verifies RS256 signature, issuer/audience/expiry and user subject; M2M tokens are rejected. Authenticated GET `/mcp` returns 405. Tool calls remain SDK validated; explicit list metadata includes OAuth `securitySchemes` and `_meta`.

## Local validation

From repository root:

```sh
npm ci
npm run build --workspace @dashboarda/mcp
npm test --workspace @dashboarda/mcp
```

Build includes typecheck. Tests use ephemeral signing keys and mock downstream endpoints through the real request handler. No test keys/configuration can be selected by an HTTP caller. Logs contain only request ID, status and duration.

## Deployed acceptance (pending)

Slice 1A's real ChatGPT OAuth/CIMD ping is owner-proven. Slice 1B requires:

1. Refresh/reload Dashboarda in ChatGPT; verify exactly three tools.
2. Read Email Action and compare with its real browser dashboard.
3. Call upsert with the current read-only token; confirm `dashboard:write` rejection.
4. In Auth0's Dashboarda MCP API application-access settings, identify the **specific ChatGPT CIMD application/client associated with this connection**, allow `dashboard:write` for that app (retain read), and reconnect/re-authorize Dashboarda in ChatGPT if the existing token still has read only. Do not change the default access policy or grant write to all third-party applications. If the specific client cannot be identified, stop the write proof.
5. Upsert one controlled Email Action record with a stable logical key matching the existing endpoint semantics. Read it back and verify the browser dashboard.
6. Upsert that same logical record again: verify no duplicate, changed `seenCount` and `lastSeenAt`, incremented `runs`, and appended `runHistory`. History is intentionally absent from MCP responses; inspect it through the existing dashboard state API using operator authentication. Do not retry an ambiguous failure and do not write to all five dashboards.

Record actual deployed observations before marking Slice 1B complete. No scheduled-task integration or Slice 2 work is included.

## Slice 3B — scheduled-run observability

Current remediation: allow empty-array upserts. Slice 3B deployment and natural-run acceptance are pending; the earlier Slice 1B acceptance checklist above is historical (owner confirms 1A/1B/2 complete).

Operator order: amend all five existing scheduled prompts, deploy `fix/scheduled-dashboard-sync` on the existing MCP site, reload its tool metadata in ChatGPT, then observe natural production runs. Preserve existing environment variables and build settings. No automation edits or manual deployment were performed by this slice.

Exact prompt amendment (retain task-specific filtering and notifications):

> Always call Dashboarda dashboard_upsert exactly once per scheduled run. When qualifying items exist, send them in one batch. When none exist, call dashboard_upsert with items: []. Never retry an uncertain write.

Compare persisted state before/after a natural run: `runs` advances, `updatedAt` changes, and `runHistory` gains a receipt. For zero results, receipt `received` is 0 and existing items remain unchanged. Use operator-authenticated existing `/api/state` GET for history (MCP deliberately omits it). Task execution alone is not sync proof; preserve failures/uncertainty and never silently retry. No claim of exactly-once delivery is made by this prompt convention.
