# State

Updated 2026-10-10 (America/New_York). Production observations below are operator-supplied snapshots, not new writes or executions performed during documentation reconciliation.

## Production system

Scheduled ChatGPT tasks → authenticated Dashboarda MCP → `dashboard_upsert` / `dashboard_read` → existing `/api/state` → Netlify Blobs → web dashboards.

- **1A:** complete and production proven — Auth0 OAuth/CIMD and authenticated `dashboard_ping`.
- **1B:** complete and production proven — exactly `dashboard_ping`, `dashboard_read`, `dashboard_upsert` on `https://dashboarda-mcp.netlify.app/mcp`. Fixed allowlist of five task dashboards; home-board excluded. Read requires `dashboard:read`, defaults to 20 items/caps at 50, omits run history. Upsert requires `dashboard:write`, accepts **0–50** objects, and forwards only `{ items }`. Downstream credentials remain server-side; uncertain writes are not automatically retried.
- **2:** complete and production proven — unattended scheduled Email Action write.
- **3:** implemented for all five scheduled tasks. Natural scheduled-run sync evidence is confirmed for **three** dashboards; **two** remain pending.
- **3B:** **complete, deployed, and production proven** — zero-result scheduled synchronization works end-to-end. All five prompts have the durable exactly-one-upsert-attempt-per-run rule.
- **4A:** **complete** — optional normalized fields, deterministic v1 scoring, evidence and provenance rules defined in [DATA_CONTRACT.md](DATA_CONTRACT.md). Backward-compatible, documentation-only contract; runtime and stored items unchanged.
- **4B:** **next** — curated historical backfill, not yet performed.
- **4C onward:** planned — shared decision UI and Refresh UX, then dashboard-specific views.

## Natural production sync evidence — 2026-10-10

| Dashboard | Items (`total`) | `runs` | `updatedAt` (UTC) | Natural post-3B proof |
| --- | ---: | ---: | --- | --- |
| email-action | 4 | 22 | `2026-10-10T13:39:24.602Z` | **Proven** — item count unchanged while runs advanced; repeated zero-result syncs reported. |
| christian-jobs | 0 | 1 | `2026-10-10T11:53:04.647Z` | **Proven** — clean natural zero-result sync. |
| jeep-watch | 0 | 2 | `2026-10-10T08:26:01.541Z` | **Proven** — clean natural zero-result sync. |
| local-prospects | 0 | 0 | Not supplied | **Pending** — no natural post-3B receipt yet. |
| job-rates | 0 | 0 | Not supplied | **Pending** — no natural post-3B receipt yet. |

The deployed upsert accepts `items: []` as a successful synchronization: `runs`, `updatedAt`, and bounded `runHistory` advance without inserting fake records or modifying existing item observations. A task execution notification alone is not proof of persisted sync. Uncertain writes must not be retried automatically.

Every scheduled prompt now contains:

> Always call Dashboarda dashboard_upsert exactly once per scheduled run. When qualifying items exist, send them in one batch. When none exist, call dashboard_upsert with items: []. Never retry an uncertain write.

This is an orchestration rule, **not a guarantee of exactly-once delivery**. Retain task-specific filtering and notifications. Verify remaining two dashboards via normal scheduled execution and state read-back; do not fabricate receipts or use historical imports as proof.

## Next gates and known UX finding

**4B is not blocked by the two pending natural-run checks.** First capture complete existing state (MCP reads are bounded), approve a source-grounded backfill manifest, preserve endpoint identity and true persistence `firstSeenAt`, pilot a small batch, and reconcile the read-back before expansion. Historical imports must be curated; see [DATA_CONTRACT.md](DATA_CONTRACT.md).

**4C planned:** existing Refresh buttons work but give little feedback when state is unchanged. Require no-store fetch, visible refreshing/success/failure, and client **Checked at**, distinct from server **Last sync**/`updatedAt`. No Refresh implementation changes in this documentation slice.
