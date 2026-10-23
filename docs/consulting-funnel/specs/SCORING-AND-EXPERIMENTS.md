# Ranking & learning contract

The **initial weighted score is a transparent prioritization heuristic, not a statistical win probability**. Unknown data should lower confidence and be visible, not automatically treated as worst-case truth. Make weights/version configurable and show component explanations.

| Component | Max points | What constitutes evidence |
|---|---:|---|
| Verified skill alignment | 25 | direct stack match, documented similar delivered work, skill gap assessment |
| Expected effective pay vs effort | 20 | stated rate/budget, quoted scope, conservative time estimate, fees, risk |
| Freshness | 15 | original postedAt with source evidence, not first-indexed time |
| Buyer credibility | 15 | verified payment/hire history when available; details not inferred |
| Competition | 10 | timestamped proposal count if exposed, or unknown |
| Scope feasibility | 10 | bounded deliverables, dependencies, timeline, acceptance test |
| Location/timezone | 5 | genuine US eligibility, scheduling overlap, local advantage |
| **Total** | **100** | store score version + rationale |

### Initial exclusion gates

Reject or quarantine: unpaid/spec work, implausible pay for scope, suspected fraud, prohibited outreach method, fabricated qualification requirements, direct conflict with US eligibility, unverifiable original URL, or no meaningful legitimate response path. A low score is distinct from an exclusion reason. Prefer fewer genuine leads.

### Ranking experiments

**Hypothesis:** Applying promptly to a clearly suitable recently posted gig *may* improve response rate; there's no evidence yet this is true for this user. Compare windows: `<=30 minutes`, `>30–120 minutes`, `>2–24 hours`, `>24 hours`, and `postedAt unknown` (separate bucket). Also stratify by source, buyer timezone and score; watch sample size.

- Scan during morning, US workday and late evening, but keep the owner's schedule sustainable; avoid 24/7 notifications.
- Record `postedAt`, `firstSeenAt`, `proposalReadyAt`, `appliedAt` independently in UTC; render America/New_York and inferred buyer-local time.
- Mark inaccessible marketplace status as `unverified` rather than `active`.
- Primary outcomes: applications, buyer replies, interviews, contracts signed, payment received and revenue net of fees / acquisition+delivery hours.
- For unanswered proposals, track observation window / right censoring; do not count as final loss immediately.
- For initial small samples, show denominators (e.g., 2 responses / 9 proposals), not misleading precision or causation.
- Capture proposal costs (fees/Connects), manual effort, and follow-up timestamps.

### Proposal packet rules

Each ready lead receives: two-sentence buyer problem summary; evidence links/ProofTree records with verified vs anecdotal status; tight proposed first milestone; estimated hours, rate/budget and exclusions; tailored <=150-word first response; caveats; submission link; and status. Never assert specialist platform experience unless evidence exists.
