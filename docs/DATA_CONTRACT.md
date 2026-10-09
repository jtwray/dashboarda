# Data contract — Slice 4A

Optional item-level additions for the five task dashboards. This defines producer and future consumer behavior; no runtime validation, scoring code, UI, migration, or scheduled-task changes. Existing item fields remain valid.

## Compatibility and evidence

- Omit unknown normalized values; do not send `null`, empty strings, guesses, or sentinel numbers. A real source-supported zero is valid. Consumers must tolerate absent/malformed legacy values without rewriting records.
- Dates are ISO-8601 instants with a known timezone (`Z` or explicit offset). Do not invent a time/timezone from a date-only posting or vague deadline; retain source text. `postedAt` means source posting time, never scan/import time. `dueAt` means an explicit obligation deadline, never an interview time assumed to be a reply deadline.
- Amounts/distances must be finite and nonnegative; scores are integers 0–100. Keep original display text (`compensation`, `rate`, `price`, `distance`). USD normalization requires a known USD basis.
- All five dashboards may add `backfilled?: boolean` and `originallyObservedAt?: string`. Set `backfilled: true` for a genuine curated historical import. Include `originallyObservedAt` only with evidence of the original observation instant; posting dates, email receipt times, or report creation times alone do not establish it.
- `firstSeenAt` continues to mean **first observed by Dashboarda persistence**. Persistence owns `_key`, `firstSeenAt`, `lastSeenAt`, and `seenCount`; producers must not supply/repair them. Historical imports get real current persistence timestamps, never fake historical timestamps.
- `/api/state` preserves arbitrary item fields; MCP accepts object records. No schema, endpoint, envelope, credential, or storage change is needed. Upsert shallow-merges matched items: omission preserves existing values and cannot clear a stale score. Flag unsupported/stale values for later review rather than inventing replacements or changing persistence in 4A.

### Existing display fields (unchanged)

| Dashboard | Fields used by its current table |
| --- | --- |
| Email Action | `from`, `subject`, `category`, `received`, `action`, `status` |
| Christian Jobs | `employer`, `role`, `location`, `compensation`, `fit`, `url`, `status` |
| Local Prospects | `business`, `location`, `workflow`, `hypothesis`, `contactRole`, `phone`, `status` |
| Job Rates | `employer`, `role`, `rate`, `type`, `location`, `fit`, `caveats`, `url` |
| Jeep Watch | `vehicle`, `price`, `location`, `distance`, `condition`, `reason`, `url`, `status` |

These are display fields, not new required properties. Other existing fields, including source IDs and status where present, remain valid.

## Optional additions

Every property below is optional, including shared backfill properties. These documentation-only additive types do not replace existing item shapes.

```ts
type BackfillFields = {
  backfilled?: boolean;
  originallyObservedAt?: string; // ISO-8601; genuinely known observation
};
type EmailActionFields = BackfillFields & {
  priority?: "high" | "medium" | "low";
  dueAt?: string; // ISO-8601 instant
};
type ChristianJobsFields = BackfillFields & {
  fitScore?: number; // integer 0–100
  postedAt?: string; // ISO-8601 instant
  scoreVersion?: 1;
};
type LocalProspectsFields = BackfillFields & {
  priorityScore?: number; // integer 0–100
  workflowCategory?: "lead-followup" | "scheduling-dispatch" | "estimates-quotes"
    | "invoicing-collections" | "intake-forms" | "inventory-parts"
    | "reporting-admin" | "other";
  scoreVersion?: 1;
};
type JobRatesFields = BackfillFields & {
  fitScore?: number; // integer 0–100
  hourlyRateMin?: number; // USD/hour; explicit lower bound
  hourlyRateMax?: number; // USD/hour; explicit upper bound
  postedAt?: string; // ISO-8601 instant
  scoreVersion?: 1;
};
type JeepWatchFields = BackfillFields & {
  priceAmount?: number; // USD asking price
  distanceMiles?: number; // approximate known miles from Martinsville, VA
  priorityScore?: number; // integer 0–100
  scoreVersion?: 1;
};
```

## Scoring procedure v1

Sum each numeric rubric's dimension points; maxima total 100. Use only listed discrete values, selecting the highest band fully supported by evidence. `and` requires both conditions; `or` requires one. Unknown, contradicted, or unsupported evidence earns **0** for that dimension. No interpolation, neutral points, assumed absence of friction, or recency bonuses. Unresolved conflicting evidence uses the lower supported band with an explanation.

An assessed total of 0 is valid; an unassessed item has no score. Future producers should accompany a v1 score with `scoreVersion: 1`. Consumers recognize v1 only with a valid score/version pair; absent/other versions remain unscored. Changing a rubric requires a documented version change.

Keep rationale/source references in existing narrative fields (`fit`, `caveats`, `workflow`, `condition`, `reason`) where available. Backfill retains per-dimension points and citations in its review manifest; no generic score breakdown infrastructure. Scores describe evidenced suitability, not probabilities of hiring, sales, or vehicle safety.

### Fixed job-fit baseline

Compare explicit requirements with Tucker's documented experience: React/TypeScript, Node/Express, PostgreSQL/TSQL, C#/.NET, Java/Groovy, AWS, some Azure delivery, CI/CD, Cypress/RTL, accessibility, healthcare, public safety/government, USPS/e-commerce, and developer mentoring. General Azure experience does not establish AKS expertise; do not assume Liquibase, a completed bachelor's degree, current clearance, or unsupported years of experience.

Preferred scope: mid-level, Senior I/II, or hands-on frontend lead; US remote accepting a Virginia resident, or verified commute <=90 minutes from Martinsville. US citizenship is known; evaluate other explicit eligibility requirements independently. Job Rates uses the **$65–$75/hr W2 target**, with credible $75+ W2 highest. Christian Jobs' annual pay bands are independent ranking thresholds, not hourly conversions or an asserted annual salary target.

Technical fraction `m/n`: count each distinct mandatory technical requirement once; split mandatory lists but count an `A or B` alternative once. Match only documented hands-on evidence (including accepted alternatives); unfamiliar/unknown requirements stay in the denominator. No disclosed mandatory technical requirements means 0 points. Do not round the fraction before selecting a band.

## Email Action

Assign priority only to genuinely actionable email. Promotions/non-actionable messages receive no priority, even with marketing deadlines.

| Priority | Evidence required |
| --- | --- |
| High | Explicit actionable deadline within 24 hours of assessment or already overdue; interview/recruiter action requiring prompt response; payment/account/security issue requiring prompt action; overdue bill/similarly urgent obligation. Generic recruiter advertisements do not qualify. |
| Medium | Clear response/action required, reasonably to be handled soon, with no evidenced immediate deadline/urgency. |
| Low | Useful action exists with evidence supporting safe deferral. |

Use the highest supported priority; leave absent if actionability/urgency cannot be established. Assess the 24-hour window at one recorded reference instant. `dueAt` is optional even for high priority; never guess it.

## Christian Jobs — fitScore v1

Christian affiliation/workplace culture requires explicit employer evidence, never its name alone. This is watch eligibility, not extra fit points. Unverified affiliation or known unmet mandatory eligibility stays in EXPLORE for review, outside the apply queue; retain legacy records.

| Dimension | Max | Exact bands (all other/unknown cases: 0) |
| --- | ---: | --- |
| Core technical fit | 35 | **35:** `m/n >= 0.90`; **25:** `>= 0.70`; **15:** `>= 0.40`; **5:** `> 0`. |
| Experience/domain fit | 20 | **20:** same documented sector and comparable production duties; **12:** either; **5:** only an evidenced adjacent workflow (e.g. another accessible public-service portal). |
| Role/seniority fit | 15 | **15:** preferred hands-on level and all stated tenure/responsibility requirements supported; **10:** preferred level and comparable duties, but tenure or one advanced responsibility unverified; **5:** matching junior/narrower specialist duties. Known mandatory mismatch: 0. |
| Remote/location fit | 15 | **15:** explicitly US remote and Virginia eligible; **10:** hybrid/onsite with verified commute <=90 minutes; **5:** explicit remote work, Virginia eligibility unverified. Confirmed ineligible location: 0. |
| Compensation fit | 10 | Disclosed guaranteed lower bound: **10:** W2 hourly >=$65 or annual FTE >=$100,000; **7:** W2 >=$55 or FTE >=$75,000; **4:** W2 >=$50 or FTE >=$50,000. Unknown pay/basis or ceiling-only: 0. |
| Constraint/friction fit | 5 | **5:** every explicit nontechnical eligibility/process constraint known satisfied, with at least one disclosed; **3:** at least one known satisfied, others unverified, none failed. None disclosed or known failure: 0. |
| **Total** | **100** | Sum six selected bands. |

Nontechnical constraints include degree, clearance, work authorization, required schedule/travel, and denominational commitments. Technical requirements, seniority, location, and pay belong in their own dimensions. Christian culture alone does not establish agreement with a required statement of faith.

## Local Prospects — priorityScore v1

Choose `workflowCategory` for the strongest evidenced primary workflow; ties use the enum's declaration order. `other` means a known workflow outside those categories, not unknown data. Keep speculative automation ideas labeled hypotheses; industry stereotypes earn no pain/leverage points.

| Dimension | Max | Exact bands (all other/unknown cases: 0) |
| --- | ---: | --- |
| Visible pain / workflow leak | 25 | **25:** corroborated repeated lost leads, missed appointments, delayed quotes, collections problems, or administrative rework; **15:** explicit manual workaround/duplicated handoff in this business's workflow; **5:** explicit phone/email-only intake/booking without demonstrated loss. Missing website feature alone: 0. |
| Automation leverage | 25 | **25:** evidenced recurring trigger, inputs/output and documented accessible integration route; **15:** recurring trigger/inputs/output evidenced, integration unverified; **5:** one evidenced manual step, recurrence unverified. Imagined process: 0. |
| Customer/job economic value | 20 | **20:** published minimum/typical job or contracted customer value >=$1,000; **12:** >=$250; **5:** documented paid service without supported value >=$250. Never estimate revenue, margin, or willingness to pay from industry/size. |
| Contactability | 15 | **15:** named relevant decision-maker with explicit direct business contact route; **10:** official business phone/email; **5:** official active contact form/business social route only. Invented owner/contact role: 0. |
| Local proximity | 10 | **10:** verified Martinsville/Henry County; **6:** verified Danville/Pittsylvania County; **2:** another verified location with evidenced commute <=90 minutes from Martinsville. Unknown/outside reach: 0. |
| Fit to current Southside offer | 5 | **5:** evidenced workflow deliverable as a bounded current package with current tooling (follow-up, scheduling/dispatch, quotes, invoice reminders, intake, inventory, reporting); **3:** workflow fits those services but needs an unverified custom adapter. Broad rebuild/speculative scope: 0. |
| **Total** | **100** | Sum six selected bands. |

## Job Rates — fitScore v1

Normalize only explicit, unambiguous USD hourly pay: `$65–$75/hr` → min 65/max 75; `$70/hr` → 70/70; `from $65/hr` → min only; `up to $80/hr` → max only. When both exist, min <= max. Annual salary, day rates, OTE, bonuses, vague/currency-ambiguous pay do not become hourly values. Never convert annual salary into persisted hourly source data.

Hourly numbers do not establish W2: retain `type`/`caveats`. Known 1099/C2C hourly pay may be normalized but earns no W2 compensation points. Score the lower bound, never a midpoint/ceiling.

| Dimension | Max | Exact bands (all other/unknown cases: 0) |
| --- | ---: | --- |
| Technical fit | 30 | **30:** `m/n >= 0.90`; **22:** `>= 0.70`; **12:** `>= 0.40`; **4:** `> 0`. |
| Role/seniority fit | 15 | **15:** preferred hands-on level and all stated tenure/responsibility requirements supported; **10:** preferred level/comparable duties, tenure or one advanced responsibility unverified; **5:** matching junior/narrower specialist duties. Known mandatory mismatch: 0. |
| Domain/background fit | 15 | **15:** same documented sector and comparable production duties; **9:** either; **4:** only an evidenced adjacent workflow. |
| Remote/location fit | 15 | **15:** explicitly US remote and Virginia eligible; **10:** hybrid/onsite with verified commute <=90 minutes; **5:** explicit remote work, Virginia eligibility unverified. Confirmed ineligible location: 0. |
| Compensation fit | 20 | Confirmed W2, credible explicit hourly lower bound: **20:** >=$75; **16:** >=$65; **10:** >=$55; **5:** >=$50. Below $50, salary-only, non-W2, unknown basis, ceiling-only: 0. `$65–$75` earns 16; `$75–$90` earns 20; `up to $80` earns 0. |
| Constraints/friction | 5 | **5:** all explicit nontechnical eligibility/process constraints known satisfied, at least one disclosed; **3:** at least one satisfied, others unverified, none failed. None disclosed or known failure: 0. |
| **Total** | **100** | Sum six selected bands. |

Known unmet mandatory eligibility excludes the apply queue regardless of score; keep the record/caveat in EXPLORE. Nontechnical constraints use the same definition as Christian Jobs.

## Jeep Watch — priorityScore v1

Use the existing watch's YJ/TJ/XJ/ZJ scope and $2,000 asking-price ceiling. `priceAmount` is actual USD asking price, not an estimated offer/repair budget; omit placeholder prices (e.g. `$1`/`$1,234` used as placeholders). Explicitly free is a valid 0. `distanceMiles` requires a disclosed listing distance or documented map estimate from Martinsville, VA; never infer miles from a town name or travel time.

| Dimension | Max | Exact bands (all other/unknown cases: 0) |
| --- | ---: | --- |
| Price/value | 30 | Verified asking price: **30:** <=$1,000; **20:** >$1,000 and <=$1,500; **10:** >$1,500 and <=$2,000. Entry price only; condition/repair evidence is scored separately. |
| Distance | 20 | Known approximate miles: **20:** <=25; **15:** >25 and <=50; **10:** >50 and <=100; **5:** >100 and <=150. |
| Title/completeness | 20 | Add two components. **Title (0/5/10):** 10 explicit clear transferable title; 5 documented transferable salvage/rebuilt title; 0 missing/unknown/nontransferable. **Completeness (0/5/10):** 10 documented engine, transmission, axles/main body present; 5 seller's explicit completeness claim without inventory; 0 stripped/unknown. |
| Frame/unibody risk | 15 | **15:** detailed structural underside/mount-area evidence supports no visible structural damage; **8:** explicit structural-condition claim plus supporting partial structural photos; **3:** explicit structural-condition claim only, including described surface corrosion without claimed structural damage. Unknown, suspected perforation, structural damage, or exterior photos/“looks clean” alone: 0. |
| Repairability | 15 | **15:** documented successful road test/inspection supporting function, or diagnosed single accessible bolt-on fault with other major systems evidenced functional; **8:** documented bounded repair, other systems unverified; **3:** specific symptom, diagnosis unverified. Unknown faults/extensive unbounded repair: 0. |
| **Total** | **100** | Sum five selected dimensions. |

Attribute seller claims as claims in `condition`/`reason`, not inspection results. Unknown condition never earns positive points. Known structural danger, nontransferable ownership, wrong model, or over-ceiling price excludes a buy/contact queue regardless of score. Unknown title/structure needs verification before purchase recommendations; a later UI may surface that explicit verification action.

## Future ranking and one NOTICE visualization

Product hierarchy: **DO NEXT → ranked actionable queue; NOTICE → one dashboard-specific visualization; EXPLORE → full searchable/filterable dataset.** Target for 4C–4H; not implemented in 4A.

- Establish actionability from evidence/existing status first. Completed/dismissed/closed/unavailable items and known blockers do not become actions because of high scores. Do not invent statuses or assume an unresolved action from the current UI's default `new` badge. Unknown eligibility can yield a labeled verification action, not an apply/buy recommendation.
- Email: high, medium, low, then actionable unprioritized; within groups, known `dueAt` ascending, unknown deadlines last. Evaluate urgency at one reference instant before sorting; do not silently mutate stored priority as time passes.
- Other dashboards: recognized v1 score descending, then unscored actionable items in a labeled group. Never coerce absent scores to 0; assessed 0 sorts ahead of unassessed items.
- Final tie-breaks: valid persistence `lastSeenAt` descending (missing last), then stable identity ascending by Unicode code-point order. Identity uses `_key` when present, otherwise endpoint rules below. Read order is not priority; MCP's bounded slice cannot establish a global queue without full state.

| Dashboard | Planned single NOTICE visualization | Missing-data rule |
| --- | --- | --- |
| Email Action | Actionable counts by high/medium/low/unprioritized | Separate unprioritized from low. |
| Christian Jobs | Fit distribution: 0–39, 40–69, 70–100 | Recognized v1 scores only; separate unscored count. |
| Local Prospects | Counts by primary workflow category | Missing = “Unknown”, separate from `other`. |
| Job Rates | Disclosed hourly pay ranges by role | Preserve W2/1099/C2C/unknown basis; show open bounds, never synthesize endpoints or convert annual pay. |
| Jeep Watch | Asking price vs. distance scatter | Known numeric pairs only; disclose omitted count and condition/title caveats. |

History separates source `postedAt`, genuine `originallyObservedAt`, and persistence dates. Do not label observation dates as posting history or imports as newly discovered opportunities. State holds current records and bounded run receipts, not historical item-value snapshots; past price/rate trends cannot be reconstructed from it alone.

## Slice 4B backfill (proposed; no writes in 4A)

1. Track four non-email natural-run checks separately; imports are not scheduled-run proof. Curate a small set from genuine prior reports/source records, excluding test artifacts and known expired/non-actionable opportunities from DO NEXT.
2. Snapshot complete current state. MCP read defaults to 20/caps at 50, with no pagination/history; compare `total` to returned count. If truncated or history/counters are needed, use existing authenticated `/api/state` GET, not repeated identical MCP reads or a new tool.
3. Review a manifest: source/citation, identity match, new/existing item, explicit next action, normalization evidence, rubric component points/total/version, backfill provenance. Preserve source text/uncertainty; never invent timestamps, money, distances, deadlines, or contacts.
4. Match key precedence exactly: `id` → `messageId` → `url` → `business|location` → `employer|role|location` → `vehicle|location|price` → `from|subject|received` → stable full-object fallback. Preserve matched key-driving fields. Incoming `_key` is not an identity override; adding a higher-precedence ID or changing identity-bearing text can duplicate records.
5. Hold fallback-only items for manual review: optional additions change the fallback hash. Do not migrate keys in 4B. Enrich safe existing identities; mark historical imports `backfilled: true`, with `originallyObservedAt` only when known. Never submit persistence-owned metadata.
6. After payload review/approval, pilot existing `dashboard_upsert` with a small batch (1–50 items), then read back/reconcile identity/counts/fields. Matching upsert preserves `firstSeenAt`, increments `seenCount`/`runs`, changes `lastSeenAt`, and appends bounded run history. It is not replay-idempotent; reconcile uncertain writes before any retry. Keep snapshots for review; MCP has no replace-mode rollback.

Expand only after the pilot preserves identity/evidence. This contract itself does not authorize backfill, producer prompt edits, persistence changes, or ranking/chart code.
