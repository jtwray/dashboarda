# Roadmap

Production path: scheduled ChatGPT tasks → authenticated Dashboarda MCP → `dashboard_upsert` / `dashboard_read` → existing `/api/state` → Netlify Blobs → web dashboards.

| Slice | Scope | Current status / gate |
| --- | --- | --- |
| 1A | Auth proof | **Complete — production proven.** Auth0 OAuth/CIMD and authenticated ping. |
| 1B | MCP read/write | **Complete — production proven.** Exactly three tools, five fixed routes, existing persistence. |
| 2 | Email unattended scheduled write | **Complete — production proven.** |
| 3 | Wire all five scheduled tasks | **Implemented.** Natural-run sync proven for Email Action, Christian Jobs, and Jeep Watch; **pending** for Local Prospects and Job Rates. |
| 3B | Zero-result scheduled synchronization | **Complete — deployed and production proven.** Upsert accepts 0–50 items; all five prompts require one batched sync per run, including `items: []`. |
| 4A | Optional data contract and v1 scoring | **Complete.** Accepted definitions in [DATA_CONTRACT.md](DATA_CONTRACT.md); no producer, API, storage, or UI changes. |
| 4B | Curated historical backfill | **NEXT.** Source-grounded manifest, complete state snapshot, identity/provenance review, small controlled pilot, read-back reconciliation. No indiscriminate archive. |
| 4C | Shared DO NEXT / NOTICE / EXPLORE + Refresh UX | **Planned.** Harden Refresh feedback and no-store fetching; build mobile-friendly hierarchy with legacy/unscored fallbacks. |
| 4D–4H | Dashboard-specific decision queues and visualizations | **Planned.** Email Action, Local Prospects, Job Rates, Christian Jobs, Jeep Watch. |
| 5 | Dogfood/refine/stabilize | **Planned.** Verify usefulness and data quality through real use. |

Planned UI hierarchy: **DO NEXT** (ranked actions) → **NOTICE** (one dashboard-specific visualization) → **EXPLORE** (full searchable/filterable data).

## Immediate execution order

1. Reconcile production documentation (this task).
2. Plan and execute **4B** curated backfill, subject to reviewed sources, full-state snapshot, identity safety, and pilot read-back.
3. Implement **4C** shared structure and Refresh UX hardening.
4. Implement dashboard-specific queues/visualizations (**4D–4H**).
5. Dogfood, refine, and stabilize (**5**).

Natural scheduled-run verification for Local Prospects and Job Rates can complete **in parallel** when their normal schedules run; pending verification is not a 4B blocker. Backfill imports **never count** as natural-run proof.

4C Refresh finding: existing buttons do fetch state but give poor feedback when nothing changes. Use `fetch("/api/state", { cache: "no-store" })`, visible **Refreshing** state and success/failure feedback, plus a client-side **Checked at** timestamp. Keep Checked at distinct from server-side **Last sync** / `updatedAt`. **Do not implement in 4B.**

Retain current architecture and accepted 4A contract; no new MCP tools, persistence redesign, retroactive observation timestamps, or merge to main.
