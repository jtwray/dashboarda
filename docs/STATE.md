# State

As of 2026-10-04. Source inspected: `main` at `56a0b1b0aa7d2e571696e74f7f31a6568680aa67`.

## Existing system

Six independently deployable static Netlify apps exist. Each has its own `netlify.toml`, package, and state function. The five task-dashboard functions were individually read: email-action, christian-jobs, local-prospects, job-rates, and jeep-watch. Their function sources are identical at the inspected commit.

All five expose `/api/state`: GET checks `x-dashboard-pin` against the site's `DASHBOARD_READ_PIN`; POST checks Bearer authentication against `DASHBOARD_WRITE_TOKEN`. GET and successful POST return `{ items, updatedAt, runs, runHistory }`, not a compact mutation receipt. `received` and `total` occur in run-history entries, not at the top level. History is bounded to 50 entries; items are sorted by descending `lastSeenAt`. Production uses a site store with strong consistency; other deploy contexts use deploy-scoped storage.

Source inspection confirms that default POST behavior is upsert, repeated stable keys merge into one item and increment `seenCount`, each POST increments `runs`, and history appends then retains its last 50 entries. These are source findings, not deployed observations. The endpoint silently treats a non-array `items` value as an empty array; the proposed MCP must reject invalid input before forwarding it.

## Current slice — 1A authentication proof

Updated 2026-10-07 UTC (2026-10-06 America/New_York).

- Owner reports Auth0 configured with resource compatibility and CIMD ON, DCR OFF, RS256, delegated default read permission, and M2M disabled. No tenant settings were changed.
- Corrected public OAuth and OpenID discovery succeed. Exact issuer is preserved with its trailing slash. Metadata advertises CIMD, PKCE S256, and `none` / `private_key_jwt`. Tenant-specific resource mapping and actual CIMD registration remain UNVERIFIED.
- `apps/mcp` now implements stateless finite Streamable HTTP with exactly `dashboard_ping`. All MCP requests require verified Auth0 user access and `dashboard:read`. Public protected-resource metadata and 401/403 challenges are implemented. No downstream state endpoints, Blobs, writes, or scheduled tasks are used.
- Local typecheck/build and authentication/MCP tests pass (see app README for commands and coverage). Tests use ephemeral signed tokens and the real request handler, not production Auth0 login.
- Deployment: NOT PERFORMED. Connected Netlify tools can inspect/create sites but expose no code upload, Git build configuration, or site environment-variable write operation. No authenticated Netlify CLI is configured. No empty site was created.
- Automatic approval review rejected a GitHub branch push, citing insufficient authorization for disclosure to the external repository. The implementation remains local on `feature/mcp-auth-proof`; do not bypass this restriction through another write mechanism.
- Real ChatGPT connection, OAuth/CIMD exchange, deployed ping, deployed rejection tests, and plugin permission controls: UNVERIFIED.

Immediate next action: approve pushing this implementation to `jtwray/dashboarda` and browser fallback for configuring/deploying the new Netlify site, or deploy it yourself using `apps/mcp/README.md`. After deployment validate metadata and authentication rejection; then test the real ChatGPT connection. Slice 1A remains incomplete until the real chain succeeds; Slice 1B has not begun.
