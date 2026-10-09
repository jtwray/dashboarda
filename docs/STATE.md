# State

Updated 2026-10-08 (America/New_York).

## Production status

The owner confirms Slices 1A, 1B, and 2 are complete in production:

- Scheduled ChatGPT tasks → authenticated Dashboarda MCP → `dashboard_upsert` / `dashboard_read` → existing `/api/state` → Netlify Blobs → web dashboards.
- Auth0 OAuth/CIMD and authenticated `dashboard_ping` are proven. Exactly `dashboard_ping`, `dashboard_read`, and `dashboard_upsert` remain exposed at `https://dashboarda-mcp.netlify.app/mcp`.
- Read requires `dashboard:read`, defaults to 20 items, caps at 50, and omits history. Upsert requires `dashboard:write`, accepts 1–50 objects, and forwards only normal `{ items }` POSTs. Downstream credentials stay server-side; uncertain writes are not automatically retried.
- Email's unattended scheduled-write path is proven. Slice 3 wired all five tasks; the four non-email dashboards still need natural-run verification.

| Task dashboard | Wiring | Natural scheduled-write proof |
| --- | --- | --- |
| email-action | Implemented | Proven (Slice 2) |
| christian-jobs | Implemented | Pending |
| local-prospects | Implemented | Pending |
| job-rates | Implemented | Pending |
| jeep-watch | Implemented | Pending |

These completion/wiring statements are owner-confirmed context for 4A; this slice did not rerun tasks, inspect new production receipts, or freshly verify the pending runs. They supersede the previous Slice 1B deployment-pending state. `apps/mcp/README.md` remains the original Slice 1B deployment/acceptance checklist; its historical “pending” wording is not current project status.

## Current slice — 4A

- Branch: `feature/dashboard-data-contract`, from `feature/mcp-dashboard-tools` at `cc2b03cfc3680c93bd08fa6672d940b9ec0da74e`; no merge to main.
- [DATA_CONTRACT.md](DATA_CONTRACT.md) defines optional normalization, historical-import provenance, four reproducible numeric rubrics, email priorities, deterministic ordering, and candidate visualizations.
- All new fields are optional. Existing arbitrary item objects pass through current APIs/MCP; no runtime schema/type change is needed. No UI, chart, scheduled-task, persistence, endpoint, MCP, or stored-record changes in 4A.
- Unknown evidence earns no points. Numeric scores require explicit v1 interpretation; unassessed legacy items stay unscored. `firstSeenAt` remains first observed by Dashboarda persistence, not original observation/posting time.
- Source inspection confirms all five task state implementations are identical. Enriching full-object fallback keys can duplicate records; matched upserts increment observation/run metadata. Bounded MCP reads are not necessarily complete state snapshots.

Next: review 4A, track pending natural runs, then execute a separately reviewed 4B curated historical backfill using snapshot/identity/provenance/pilot safeguards. Shared DO NEXT / NOTICE / EXPLORE UI begins in 4C, followed by the per-dashboard slices in [ROADMAP.md](ROADMAP.md).
