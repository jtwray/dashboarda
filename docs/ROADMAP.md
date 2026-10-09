# Roadmap

Production path: scheduled ChatGPT tasks → authenticated Dashboarda MCP → `dashboard_upsert` / `dashboard_read` → existing `/api/state` → Netlify Blobs → web dashboards.

| Slice | Scope | Status / exit condition |
| --- | --- | --- |
| 1A | Auth proof | Complete: production ChatGPT Auth0 OAuth/CIMD and authenticated `dashboard_ping` proven. |
| 1B | MCP read/write | Complete: exactly ping/read/upsert, fixed five-dashboard routing, server-side credentials, and existing persistence. |
| 2 | Email scheduled-write proof | Complete: unattended Email Monitor write through the authenticated production path proven. |
| 3 | Remaining task wiring | Implemented: all five tasks wired. Natural-run verification pending for christian-jobs, local-prospects, job-rates, and jeep-watch; record each genuine scheduled write/read-back before calling the slice verified. |
| 3B | Scheduled-run observability — current | Accept 0–50 upsert items; update five prompts, deploy MCP, and verify natural successful writes including zero-result runs. Production verification pending. |
| 4A | Data contract/scoring — preserved | Defined in [DATA_CONTRACT.md](DATA_CONTRACT.md): optional fields, evidence rules, v1 rubrics, deterministic ranking, and backfill safeguards. Exit: review and push the contract branch; no production data/UI/prompt changes. |
| 4B | Curated historical backfill | After 3B verification and documentation reconciliation: review genuine sources and complete state snapshot, preserve identity, pilot a small approved batch, verify read-back/provenance. Imports do not satisfy Slice 3 natural-run verification. |
| 4C | Shared DO NEXT / NOTICE / EXPLORE layout | Later: mobile-friendly shared structure, graceful handling of legacy/unscored items. |
| 4D | Email Action decision UI | Later: actionable priority/deadline queue and one email visualization. |
| 4E | Local Prospects decision UI | Later: evidence-based contact queue and one workflow visualization. |
| 4F | Job Rates decision UI | Later: fit/rate queue and one disclosed hourly-rate visualization. |
| 4G | Christian Jobs decision UI | Later: eligible fit-ranked queue and one fit visualization. |
| 4H | Jeep Watch decision UI | Later: cautious listing/verification queue and one price/distance visualization. |
| 5 | Dogfood/refine/stabilize | Later: verify usefulness/data quality during real runs, refine based on evidence, stabilize. |

Product hierarchy:

1. **DO NEXT** — ranked actionable queue.
2. **NOTICE** — one dashboard-specific visualization.
3. **EXPLORE** — full searchable/filterable dataset.

Slice 4A branch: `feature/dashboard-data-contract`, based on proven `feature/mcp-dashboard-tools`. Do not merge to main. Preserve existing item fields, APIs, MCP behavior, Blobs semantics, and five-dashboard allowlist; home-board stays outside this task pipeline. No backfill, scheduled-task prompt edits, UI, charts, database, or generic scoring infrastructure in 4A.

## Immediate execution order

1. Slice 3B scheduled-run observability (`fix/scheduled-dashboard-sync`, from `feature/dashboard-data-contract` at `418dc0c`).
2. Operator updates the five existing scheduled task prompts; retain task-specific filtering and notifications.
3. Operator deploys the MCP change on the existing dashboarda-mcp site.
4. Verify natural production runs, including zero-result receipts; do not mark verification complete from task execution alone.
5. Documentation reconciliation against those observed receipts.
6. Slice 4B curated historical backfill, retaining all 4A review/identity/provenance safeguards.
7. DO NEXT / NOTICE / EXPLORE UI work (4C–4H above).

Slice 3B does not perform automation edits, manual deployment, backfill, historical-data edits, scoring changes, charts, UI, new persistence/tools, or merge to main.
