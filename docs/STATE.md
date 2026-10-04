# State

As of 2026-10-04. Source inspected: `main` at `56a0b1b0aa7d2e571696e74f7f31a6568680aa67`.

## Existing system

Six independently deployable static Netlify apps exist. Each has its own `netlify.toml`, package, and state function. The five task-dashboard functions were individually read: email-action, christian-jobs, local-prospects, job-rates, and jeep-watch. Their function sources are identical at the inspected commit.

All five expose `/api/state`: GET checks `x-dashboard-pin` against the site's `DASHBOARD_READ_PIN`; POST checks Bearer authentication against `DASHBOARD_WRITE_TOKEN`. GET and successful POST return `{ items, updatedAt, runs, runHistory }`, not a compact mutation receipt. `received` and `total` occur in run-history entries, not at the top level. History is bounded to 50 entries; items are sorted by descending `lastSeenAt`. Production uses a site store with strong consistency; other deploy contexts use deploy-scoped storage.

Source inspection confirms that default POST behavior is upsert, repeated stable keys merge into one item and increment `seenCount`, each POST increments `runs`, and history appends then retains its last 50 entries. These are source findings, not deployed observations. The endpoint silently treats a non-array `items` value as an empty array; the proposed MCP must reject invalid input before forwarding it.

## Current slice and blocker

Slice 1 stopped at its pre-implementation authentication gate. Official OpenAI documentation supports stateless Streamable HTTP with finite JSON responses, but secure user access requires MCP-compatible OAuth. ChatGPT cannot present a custom API key. No OAuth provider integration or authorization-server configuration exists in the inspected repository. Configuring a provider and adding discovery, token verification, and owner authorization materially expands the original thin forwarding slice.

No `apps/mcp` was created; no SDK was installed; no Netlify site or MCP endpoint was deployed. Existing app files were not changed. No production requests or mutations were made. Local MCP acceptance and all deployed acceptance criteria remain UNVERIFIED; typecheck/build/tool discovery tests are not applicable to this documentation-only stop.

Immediate next action: rescope the Slice 1 authentication prerequisite explicitly and configure an established provider that supports ChatGPT's MCP OAuth flow, restrict access to the dashboard owner, then resume the two-tool implementation. Resolve actual dashboard URLs and server-side credentials before deliberate Email Action production testing. Slice 2 remains gated.
