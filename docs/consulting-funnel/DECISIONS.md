# Decisions · 2026-10-23

These are **proposed product decisions**, recorded from the user's approval of the eight-part strategy; implementation details await slice review. Document any future reversal explicitly rather than silently modifying historical decisions.

| ID | Decision | Rationale | Gate / caveat |
|---|---|---|---|
| D-01 | Optimize for **paid contracts won per hour of acquisition effort**, not listings reported. | Previous radar mostly produced reading material. | Also watch quality, actual earnings, sustainability. |
| D-02 | Persist a **deduplicated, source-linked opportunity queue**. | Same listings repeatedly resurfaced as new. | Preserve publishedAt / firstSeenAt / lastCheckedAt distinctly. |
| D-03 | Test **time-to-application**, not a mythical best clock hour. | Different buyer timezones and competition windows. | Original posting timestamp must be verified or marked unknown. |
| D-04 | Use a transparent **100-point opportunity priority heuristic**. | Consistent comparison of pay, fit, effort, buyer, competition. | Never represent score as a probability of winning. |
| D-05 | Separate **automated discovery/drafting** from **human-approved submission**. | Preserve quality, platform compliance and spend control. | No unauthorized bot scraping, spam, invented claims or contracts. |
| D-06 | Maintain full funnel states: discover → qualify → prepare → apply → follow-up → deliver. | Current system lacks measurable conversion. | Log outcomes and uncertainty; no inferred rejections. |
| D-07 | Build `gig-radar` as a **separate Dashboarda application/allowlisted target**. | Existing `job-rates` tracks a different work category. | Extend authentication and persistence explicitly; no interference with live dashboards. |
| D-08 | Reuse **ProofTree-verified evidence** in tailored proposals and bounded paid-first-milestone offers. | Improves trust, prevents overclaiming, controls delivery risk. | Record verification level; never invent credentials or client results. |
| D-09 | Apply HITL SDLC with `feat/*` branches, atomic commits, independent review and PR gate. | User's established engineering governance. | Agent completion reports are not acceptance evidence. |
| D-10 | Keep the top-level project name **Consulting Funnel**; use Gig Radar for discovery subsystem. | Future direct clients and agency partners shouldn't be excluded. | Repo creation by owner until a create-repository action is available. |

## Deliberate non-decisions

- No blanket auto-apply or bid-rate policy.
- No assumption that off-hours submission wins more contracts.
- No assumption that every posted budget represents realistic project scope.
- No promise of a finished Dashboarda scaffolding generator: repo-level verified evidence currently incomplete.
