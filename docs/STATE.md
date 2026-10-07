# State

Updated 2026-10-07.

- Slice 1A is complete: owner confirms production ChatGPT → Auth0 OAuth/CIMD → Netlify MCP → `dashboard_ping` returned `{ ok: true, authenticated: true }`.
- Slice 1B is current on `feature/mcp-dashboard-tools`, based on `feature/mcp-auth-proof`; no merge to main. Exactly `dashboard_ping`, `dashboard_read`, and `dashboard_upsert` are implemented. Fixed routing covers the five task dashboards only; all six existing apps remain unchanged.
- Read requires `dashboard:read`, defaults to 20 items, caps at 50, and omits run history. Upsert requires `dashboard:write`, accepts 1–50 objects, and sends only normal `{ items }` POSTs. Server-side credentials, strict inputs, sanitized failures, and no write retries are implemented.
- Local tests/typecheck/build pass. Production MCP still runs Slice 1A until the operator deploys this branch and copies the ten downstream credentials described in `apps/mcp/README.md`. Connected Netlify tools cannot update Git deployment settings or environment variables.
- Slice 1B deployed read/write, ChatGPT three-tool discovery, browser read-back, and repeated-upsert behavior remain UNVERIFIED. Existing source semantics merge stable keys, increment `seenCount`/`runs`, change `lastSeenAt`, and append `runHistory` (last 50); these are source findings, not live observations.
- Current ChatGPT token initially has read only. Grant write specifically to its CIMD app and reconnect for the controlled Email Action write proof; never grant write to all third-party apps.

Next: operator deployment, then the owner's Slice 1B acceptance sequence against Email Action only. No scheduled-task work has begun.
