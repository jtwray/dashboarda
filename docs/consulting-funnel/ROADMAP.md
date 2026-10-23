# Roadmap · Consulting Funnel

**Baseline:** October 23, 2026. **Current stage:** S0 artifact packaging in progress / review. **Next implementation stage:** S1. All other stages are **planned, not delivered**. Do not conflate completion of documents with deployed behavior.

## Outcome and guardrails

An experienced US-based engineer should see a short, current list of unusually good paid freelance/agency opportunities, each with credible source evidence, proposal and estimate ready for review. Applications and client contacts are never performed without the owner's approval. Full-time/W2 job search remains a separate pipeline. Reject spam, free labor, unsafe buyer terms and unverified qualifications.

## Milestone map

| Slice | Intended product increment | Dependencies | Exit / acceptance gate | Status |
|---|---|---|---|---|
| **S0** | Preserve diagrams, decisions, source-style tables, staged roadmap. | Current chat, repository access. | Local package + remote review PR + linkable SVG inventory. | **Prepared; pending review/merge** |
| **S1** | Persistent `gig-radar` opportunity queue: dedup, structured timestamps, score + status, filters. | Confirm Dashboarda storage/auth conventions and allowlist. | Demo seeded fixtures; verified upsert, replay, status transition, UI sorting and no cross-board contamination. | **Next** |
| **S2** | Compliant source ingestion, verifiers, triage and high-signal notifications. | S1, source/channel policies. | A dated scan yields verifiable records incl zero-results; duplicate replay idempotent; unknown fields explicit; no forbidden scraping. | Planned |
| **S3** | Proposal packets, truthful ProofTree evidence links, human approvals, manual submission and follow-ups. | S1 + evidence contract; optional S2. | Reviewer traces every proposal claim to source; submission controls cannot send without approval; states persist. | Planned |
| **S4** | Outcomes metrics and timing experiment over 30 days. | S3 and actual submissions/replies. | Calculations reproducible; sample sizes and censored/unknown outcomes shown; results do not overclaim causality. | Planned |
| **S5** | Selective permitted automation / rate-controlled outreach. | S4; channel permission verified individually. | Per-platform written allowlist; dry runs; audit logs, limits, kill switch; explicit consent; independent review. | **Parked / optional** |
| **S6** | Reusable Dashboarda app-instantiation workflow. | Audit existing infrastructure and S1 lessons. | A new dashboard can be created in staging from configuration, verified with tests, preview + rollback; no unapproved production changes. | **Discovery needed** |
| **S7** | Direct-client / agency CRM, repeat customers and Southside service-catalog handoff. | Core pipeline data quality. | Leads, introductions and paid engagements are tracked without mixing unconsented outreach. | Future |

## Build order and coordination

**Immediate:** S0 review, then S1 implementation in `jtwray/dashboarda` on `feat/gig-radar-persistent-queue`; avoid editing `main`. The product roadmap lives in `consulting-funnel` once repository exists; the implementation PR links the corresponding slice. Preserve existing dashboard state and auth boundaries.

**High ROI:** S2 and S3 are the practical engine for earning revenue. A polished dashboard without outbound responses is not a business result. Prioritize reliably prepared high-fit proposals and first paid milestones over UI ornamentation. S4 makes optimization evidence-driven. S5 requires its own approval, not inherited blanket authorization.

**Parallel, independent track:** S6 can be researched while S1 is scoped but should not hold revenue-facing work hostage. Confirm what parts of Dashboarda app creation already exist before building a generator.

## Stage gates (all implementation slices)

1. Brain/orchestrator records a bounded brief: outputs, interfaces, exclusions and verification method.
2. One development agent creates a `feat/*` branch from `main`, changes only authorized scope, and makes logical atomic commits. Developer includes tests, run commands and a factual completion report.
3. Orchestrator sanity-checks scope; obvious drift returns immediately to the same agent, not an unnecessary independent review.
4. A separate review agent inspects actual branch and artifacts, executes relevant tests or UI tests, and evaluates acceptance criteria—not just the agent's report.
5. Findings are reconciled; true defects return for repair; out-of-scope demands are parked for later slices.
6. Once accepted, create/submit PR for owner review; owner makes merge/deploy decision. Do not directly push to `main`.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Recycled/duplicate postings | canonical URL+source ID; preserve seen counters; separate post and discovery dates. |
| Search indexing delay | mark posting provenance and observation source, test age unknown. |
| Poor buyer or budget credibility | hard filters, transparent risk field, no quote without scope assumptions. |
| Platform restrictions | source/channel-specific consent/permission registry and manual links. |
| Hallucinated proposal claims | evidence IDs + human verification; separate anecdote from code/test/deployment proof. |
| Over-optimization on few bids | transparent count denominators, uncertainty, cohort/latency windows. |
| Automation scope creep | no submission in S1–S4; S5 remains gated. |
| Duplicate dashboard infrastructure | S6 reconnaissance before implementation. |
| Recurring app costs | use current Netlify/Blobs pipeline, explicit quotas and error reporting. |

## Review cadence

- **Daily, 10–20 min if worthwhile leads exist:** act on ranked verified lead packets and client replies; do not scroll old reports.
- **Weekly:** tally opportunities, qualified applications, responses, interviews, accepted work, actual earnings and effective acquisition time.
- **30-day hypothesis review:** evaluate posting-to-proposal latency and source success rates before changing scan cadence. Observe platform rules and user schedule.

## Success criteria

**Leading:** owner can see top items without comparing chat reports; duplicates handled; source links and posting proof present; draft packet ready.  
**Conversion:** first attributable paid engagement; complete application and reply history for each chosen lead.  
**Sustainability:** verified hours, net income, response/win rates and source performance improve without excessive unpaid labor.
