# Roadmap

Production path: scheduled ChatGPT tasks → authenticated Dashboarda MCP → `dashboard_upsert` / `dashboard_read` → existing `/api/state` → Netlify Blobs → web dashboards.

| Slice | Scope | Current status / gate |
| --- | --- | --- |
| 1A | Auth proof | **Complete — production proven.** Auth0 OAuth/CIMD and authenticated ping. |
| 1B | MCP read/write | **Complete — production proven.** Exactly three tools, five fixed routes, existing persistence. |
| 2 | Email unattended scheduled write | **Complete — production proven.** |
| 3 | Wire all five scheduled tasks | **Implemented.** Natural-run sync proven for Email Action, Christian Jobs, and Jeep Watch; **pending** for Local Prospects and Job Rates. |
| 3B | Zero-result scheduled synchronization | **Complete — deployed and production proven.** Upsert accepts 0–50 items; all five prompts require one batched sync per run, including `items: []`. |
| 3C | Email Monitor decision-path audit | **Planned — high priority.** Read-only audit of bounded scheduled run/chat logs and correlated source/persisted evidence. Classify intentional exclusion, successful write, failed write, zero-result sync, duplicate/repeat observation, skipped/uncertain sync, and reporting/UI discrepancies. Produce evidence-backed bug/process findings; no fixes or data mutations in the audit slice. |
| 4A | Optional data contract and v1 scoring | **Complete.** Accepted definitions in [DATA_CONTRACT.md](DATA_CONTRACT.md); no producer, API, storage, or UI changes. |
| 4B | Curated historical backfill | **NEXT.** Source-grounded manifest, complete state snapshot, identity/provenance review, small controlled pilot, read-back reconciliation. No indiscriminate archive. |
| 4C | Shared DO NEXT / NOTICE / EXPLORE + Refresh UX | **Planned.** Harden Refresh feedback and no-store fetching; build mobile-friendly hierarchy with legacy/unscored fallbacks. |
| 4D–4H | Dashboard-specific decision queues and visualizations | **Planned.** Email Action, Local Prospects, Job Rates, Christian Jobs, Jeep Watch. |
| 5 | Dogfood/refine/stabilize | **Planned.** Verify usefulness and data quality through real use. |

Planned UI hierarchy: **DO NEXT** (ranked actions) → **NOTICE** (one dashboard-specific visualization) → **EXPLORE** (full searchable/filterable data).

## Immediate execution order

1. Run **3C Email Monitor decision-path audit** as a small read-only reliability slice. It may run in parallel with 4B Gate 1 manifest preparation, but review 3C before any Email Action historical import is approved for Gate 2.
2. Prepare **4B Gate 1** curated backfill manifest, subject to reviewed sources, full-state snapshot, identity safety, and explicit approval before writes.
3. Convert any 3C findings that require changes into narrowly scoped follow-up work; do not mix fixes into the audit itself.
4. Execute approved **4B Gate 2** backfill with bounded writes and read-back reconciliation.
5. Implement **4C** shared structure and Refresh UX hardening.
6. Implement dashboard-specific queues/visualizations (**4D–4H**).
7. Dogfood, refine, and stabilize (**5**).

Natural scheduled-run verification for Local Prospects and Job Rates can complete **in parallel** when their normal schedules run; pending verification is not a 3C or 4B Gate 1 blocker. Backfill imports **never count** as natural-run proof.

4C Refresh finding: existing buttons do fetch state but give poor feedback when nothing changes. Use `fetch("/api/state", { cache: "no-store" })`, visible **Refreshing** state and success/failure feedback, plus a client-side **Checked at** timestamp. Keep Checked at distinct from server-side **Last sync** / `updatedAt`. **Do not implement in 4B.**

Retain current architecture and accepted 4A contract; no new MCP tools, persistence redesign, retroactive observation timestamps, or merge to main.


## Slice 3C — Email Monitor decision-path audit

Purpose: verify the automation's real decision paths rather than assuming that a scheduled execution, notification, or dashboard row alone proves correct behavior.

Use a bounded evidence window beginning with the first proven unattended Email Monitor → Dashboarda runs and extending through the current production period. Inspect the scheduled Email Monitor run/chat/log records available to the agent and correlate only as needed with the connected Gmail source messages, current Email Action state/run metadata, task prompt/configuration, and MCP/downstream outcomes.

At minimum, look for and classify evidence of these candidate paths (the current examples are user-observed and must be verified, not assumed):

- a newly discovered email intentionally judged non-actionable and therefore not added;
- a newly discovered actionable email selected for Dashboarda and written successfully;
- a newly discovered actionable email selected for Dashboarda where the write failed;
- a run with no qualifying email that correctly performs an empty `items: []` sync;
- duplicate/repeat observations and dedupe behavior;
- a run where the Dashboarda attempt is skipped, missing, or uncertain.

For each relevant instance, report the source evidence, expected behavior, observed behavior, outcome classification, confidence, and whether the behavior is correct, ambiguous, or defective. Do not infer a bug merely because an email was excluded; evaluate the task's actual business rules.

Audit findings should be grouped by layer where applicable: scheduling/execution, email classification/business logic, tool invocation, OAuth/MCP, downstream auth/network behavior, persistence/dedupe/run accounting, notification/reporting, dashboard UI/Refresh feedback, and documentation/operator process.

Deliverable: a concise evidence table plus prioritized findings with severity, reproducibility, user impact, and a recommended narrowly scoped follow-up slice for each real defect or instrumentation gap. Identify missing observability separately from functional bugs. The audit is read-only: do not modify scheduled prompts, application code, production data, auth/configuration, or documentation except to record the reviewed audit result after approval.
