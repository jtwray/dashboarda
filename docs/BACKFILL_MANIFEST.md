# Curated Historical Backfill Manifest — Slice 4B Gate 1

**Prepared 2026-10-12. Gate 1 only; NOT authorization to import.**
Branch: `feature/curated-backfill` · starting commit: `b722b4f1d714c1925a36f2a90ad7b49bba07d045`.
Scope: recover useful historical records; no production writes, retries, task executions, configuration changes, merges or deployments.

**Recommendation:** propose six new records for Tucker's individual approval: **LP01–LP05 and CJ01**. Hold 21 for manual review; exclude 12 from this bounded review. Recommendation **APPROVE CANDIDATE** means review-ready, not already approved. No candidate is numerically scored; older ad hoc fit numbers are not reused as 4A v1 scores.

## 1. Complete production item snapshot

Authoritative source: authenticated `dashboard_read(dashboard, limit:50)`, which forwards the dashboard's authenticated `/api/state` GET. All five responses passed **`total === items.length`**; therefore every existing item was returned, including all nine Job Rates records. Reads completed by **2026-10-12T13:24:21.806Z** (9:24 AM EDT). Requests are separate snapshots, not one transaction.

This is a **complete item/identity/counter snapshot**. MCP deliberately omits `runHistory`; the full native envelope/history was not accessible through the available authenticated read tool. Do not infer unseen run receipts. Gate 2 must retake a complete snapshot; if a later read is truncated, obtain an operator-authenticated full GET instead of repeating the same bounded read.

| Dashboard | Total / returned | Successful syncs (`runs`) | Last successful sync (`updatedAt`, UTC) | Natural-run status at baseline |
| --- | ---: | ---: | --- | --- |
| email-action | 4 / 4 | 42 | 2026-10-12T11:33:33.673Z | Proven per Tucker's production evidence; snapshot corroborates persisted state |
| christian-jobs | 0 / 0 | 2 | 2026-10-12T12:12:16.863Z | Proven per Tucker's production evidence; snapshot corroborates persisted state |
| local-prospects | 0 / 0 | 0 | null | Pending |
| job-rates | 9 / 9 | 1 | 2026-10-12T12:14:59.256Z | Proven per Tucker's production evidence; snapshot corroborates persisted state |
| jeep-watch | 0 / 0 | 6 | 2026-10-12T07:46:41.227Z | Proven per Tucker's production evidence; snapshot corroborates persisted state |

Job Rates' October 12 task-update email (`1a1300a4a95c0cd8`) expressly reports that nine roles synchronized; its state timestamp corroborates that event. Local Prospects' output alone does not prove persistence: it remains empty with zero syncs here. No natural run was triggered for Gate 1.

### Existing identities — all 13 records

| Dashboard | Existing source/record | Persisted or derived key | Basis / safety note |
| --- | --- | --- | --- |
| email-action | Disclosure About Your Retirement Plan | `message:1a121be379e93ce0` | Stored key matches endpoint precedence |
| email-action | Dashboarda Slice 2 test — action required | `message:1a11d48a1b7089e9` | Stored key matches endpoint precedence |
| email-action | Slice 1B controlled upsert | `email:Dashboarda MCP Test\|Slice 1B controlled upsert\|now` | Stored key matches endpoint precedence |
| email-action | Senior React Engineer interview | `email:Test Recruiter\|Senior React Engineer interview\|Today` | Derived only; stored _key/observation metadata absent. Hold legacy/test record; do not enrich. |
| job-rates | The Planet Group (client undisclosed) — Senior Full Stack Engineer | `url:https://careers.theplanetgroup.com/job/652611-senior-full-stack-engineer-reston-virginia/` | Stored key matches endpoint precedence |
| job-rates | The Planet Group (nonprofit education/assessment client) — Senior Full Stack Engineer — Node.js / AWS Serverless / React | `url:https://www.dice.com/job-detail/3a6592eb-4326-4304-85d5-3464bf1facf1` | Stored key matches endpoint precedence |
| job-rates | Numentica — Frontend Engineer — React and AWS | `url:https://jobicy.com/jobs/145744-frontend-engineer-react-and-aws` | Stored key matches endpoint precedence |
| job-rates | AKAASA Technologies (agriculture R&D client undisclosed) — React Developer — Seasonal Agriculture Dashboard | `url:https://www.dice.com/job-detail/d9ca37db-0d9f-45bf-a460-1445ebd75cae` | Stored key matches endpoint precedence |
| job-rates | ICF (CMS federal healthcare) — Full Stack Engineer — Node/React | `url:https://icf.wd5.myworkdayjobs.com/icfexternal_career_site/job/Reston-VA/Full-Stack-Engineer--Node-React----Remote-USA_R2602147` | Stored key matches endpoint precedence |
| job-rates | Veterinary Emergency Group (VEG) — Senior Frontend Software Engineer | `url:https://builtin.com/job/senior-software-engineer/11010954` | Stored key matches endpoint precedence |
| job-rates | Vetcove — Senior Software Engineer | `url:https://jobs.ashbyhq.com/vetcove/0f3616b7-fe63-4ac2-9335-bbb8a0c36ff7` | Stored key matches endpoint precedence |
| job-rates | Close — Senior Software Engineer — Frontend/React | `url:https://jobs.ashbyhq.com/Close/8b67d1fa-5852-4f7d-b8c2-cedc20b16da7` | Stored key matches endpoint precedence |
| job-rates | HavocAI — Senior Frontend Engineer | `url:https://jobs.ashbyhq.com/havocai/5cdfc31d-3ef2-464f-a587-7d9a2dec8a5b/` | Stored key matches endpoint precedence |

Empty dashboards have no existing identities. The nine Job Rates keys are URL-based, even though some roles share recruiter/client context; do not collapse distinct requisitions without evidence. Existing non-4A fields such as `rateMin`, `rateMax`, `priority` and date-only `observedAt` are preserved in the raw snapshot; Gate 1 does not normalize or rewrite them.

<details>
<summary>Complete returned state, including every existing item field</summary>


```json
{
  "capturedAt": "2026-10-12T13:24:21.806Z",
  "source": "dashboard_read(limit=50), forwarding authoritative authenticated /api/state GET",
  "dashboards": {
    "email-action": {
      "dashboard": "email-action",
      "total": 4,
      "runs": 42,
      "updatedAt": "2026-10-12T11:33:33.673Z",
      "items": [
        {
          "messageId": "1a121be379e93ce0",
          "from": "Empower (KFORCE 401(K) Retirement Savings Plan)",
          "subject": "Disclosure About Your Retirement Plan",
          "category": "retirement/account",
          "received": "2026-10-09T17:37:55Z",
          "action": "Review the Plan Investment Option Update in your Empower retirement account; check whether changes affect your holdings or investment choices.",
          "status": "new",
          "_key": "message:1a121be379e93ce0",
          "firstSeenAt": "2026-10-09T18:17:06.181Z",
          "lastSeenAt": "2026-10-09T18:17:06.181Z",
          "seenCount": 1
        },
        {
          "messageId": "1a11d48a1b7089e9",
          "from": "Dashboarda Slice 2 test",
          "subject": "Dashboarda Slice 2 test — action required",
          "category": "test",
          "received": "2026-10-08T20:51:01Z",
          "action": "Confirm test email was detected and written to Email Action dashboard",
          "status": "new",
          "_key": "message:1a11d48a1b7089e9",
          "firstSeenAt": "2026-10-08T20:54:33.852Z",
          "lastSeenAt": "2026-10-08T20:54:33.852Z",
          "seenCount": 1
        },
        {
          "from": "Dashboarda MCP Test",
          "subject": "Slice 1B controlled upsert",
          "category": "test",
          "received": "now",
          "action": "No action required",
          "status": "new",
          "_key": "email:Dashboarda MCP Test|Slice 1B controlled upsert|now",
          "firstSeenAt": "2026-10-08T20:38:48.139Z",
          "lastSeenAt": "2026-10-08T20:38:59.506Z",
          "seenCount": 2
        },
        {
          "from": "Test Recruiter",
          "subject": "Senior React Engineer interview",
          "category": "Job",
          "received": "Today",
          "action": "Reply and schedule screening call",
          "status": "new"
        }
      ]
    },
    "christian-jobs": {
      "dashboard": "christian-jobs",
      "total": 0,
      "runs": 2,
      "updatedAt": "2026-10-12T12:12:16.863Z",
      "items": []
    },
    "local-prospects": {
      "dashboard": "local-prospects",
      "total": 0,
      "runs": 0,
      "updatedAt": null,
      "items": []
    },
    "job-rates": {
      "dashboard": "job-rates",
      "total": 9,
      "runs": 1,
      "updatedAt": "2026-10-12T12:14:59.256Z",
      "items": [
        {
          "employer": "The Planet Group (client undisclosed)",
          "role": "Senior Full Stack Engineer",
          "rate": "$80–$85/hr W2",
          "type": "12+ month W2 contract",
          "location": "US remote",
          "fit": "React, Node.js, JavaScript, AWS serverless, PostgreSQL, Agile, production troubleshooting; strong stack alignment",
          "caveats": "Bachelor's degree explicitly required; 5–7+ years; DynamoDB and serverless production depth; client undisclosed. Job ID 652611; may be related to another Planet Group education/assessment requisition.",
          "url": "https://careers.theplanetgroup.com/job/652611-senior-full-stack-engineer-reston-virginia/",
          "observedAt": "2026-10-12",
          "priority": 1,
          "rateMin": 80,
          "rateMax": 85,
          "rateType": "W2 hourly",
          "_key": "url:https://careers.theplanetgroup.com/job/652611-senior-full-stack-engineer-reston-virginia/",
          "firstSeenAt": "2026-10-12T12:14:59.256Z",
          "lastSeenAt": "2026-10-12T12:14:59.256Z",
          "seenCount": 1
        },
        {
          "employer": "The Planet Group (nonprofit education/assessment client)",
          "role": "Senior Full Stack Engineer — Node.js / AWS Serverless / React",
          "rate": "$75–$83/hr W2",
          "type": "6-month W2 contract, likely extension",
          "location": "US remote",
          "fit": "React, Node, TypeScript, AWS, PostgreSQL, education/nonprofit mission, mentoring and AI tooling",
          "caveats": "Backend-heavy; 7+ years, 3+ years backend Node, deep Lambda/DynamoDB/SNS/SQS and GenAI implementation; potentially same client family as Planet Group job 652611 but different requisition 9026184.",
          "url": "https://www.dice.com/job-detail/3a6592eb-4326-4304-85d5-3464bf1facf1",
          "observedAt": "2026-10-12",
          "priority": 5,
          "rateMin": 75,
          "rateMax": 83,
          "rateType": "W2 hourly",
          "_key": "url:https://www.dice.com/job-detail/3a6592eb-4326-4304-85d5-3464bf1facf1",
          "firstSeenAt": "2026-10-12T12:14:59.256Z",
          "lastSeenAt": "2026-10-12T12:14:59.256Z",
          "seenCount": 1
        },
        {
          "employer": "Numentica",
          "role": "Frontend Engineer — React and AWS",
          "rate": "Up to $80/hr W2 ($88/hr C2C)",
          "type": "12-month contract",
          "location": "US remote, EST hours",
          "fit": "React/TypeScript, CloudFront/S3, REST/GraphQL, Cypress/RTL, CI/CD and accessibility",
          "caveats": "Originally posted September 10 and republished October 11; verify requisition still open and end-client/rate directly; source metadata has conflicting dates.",
          "url": "https://jobicy.com/jobs/145744-frontend-engineer-react-and-aws",
          "observedAt": "2026-10-12",
          "priority": 2,
          "rateMax": 80,
          "rateType": "W2 hourly",
          "_key": "url:https://jobicy.com/jobs/145744-frontend-engineer-react-and-aws",
          "firstSeenAt": "2026-10-12T12:14:59.256Z",
          "lastSeenAt": "2026-10-12T12:14:59.256Z",
          "seenCount": 1
        },
        {
          "employer": "AKAASA Technologies (agriculture R&D client undisclosed)",
          "role": "React Developer — Seasonal Agriculture Dashboard",
          "rate": "Not disclosed",
          "type": "12-month W2 contract",
          "location": "US remote",
          "fit": "90% React/TypeScript; AWS Lambda, PostgreSQL, GIS/spatial applications; uniquely matches both professional GIS and hands-on livestock/farming experience",
          "caveats": "Multiple recruiters may advertise same agriculture client; request client, requisition and W2 rate before submission; direct Dice page may be intermittently inaccessible.",
          "url": "https://www.dice.com/job-detail/d9ca37db-0d9f-45bf-a460-1445ebd75cae",
          "observedAt": "2026-10-12",
          "priority": 3,
          "_key": "url:https://www.dice.com/job-detail/d9ca37db-0d9f-45bf-a460-1445ebd75cae",
          "firstSeenAt": "2026-10-12T12:14:59.256Z",
          "lastSeenAt": "2026-10-12T12:14:59.256Z",
          "seenCount": 1
        },
        {
          "employer": "ICF (CMS federal healthcare)",
          "role": "Full Stack Engineer — Node/React",
          "rate": "Not disclosed in verified listing",
          "type": "Full-time employment; federal program",
          "location": "US remote, approximately 10% travel",
          "fit": "React, Node, JavaScript, PostgreSQL, AWS, CMS healthcare reporting, prior Public Trust experience, public-sector accessibility",
          "caveats": "Bachelor's degree required; must obtain/maintain Public Trust; backend Node and cloud microservices depth; US residence history requirement.",
          "url": "https://icf.wd5.myworkdayjobs.com/icfexternal_career_site/job/Reston-VA/Full-Stack-Engineer--Node-React----Remote-USA_R2602147",
          "observedAt": "2026-10-12",
          "priority": 4,
          "_key": "url:https://icf.wd5.myworkdayjobs.com/icfexternal_career_site/job/Reston-VA/Full-Stack-Engineer--Node-React----Remote-USA_R2602147",
          "firstSeenAt": "2026-10-12T12:14:59.256Z",
          "lastSeenAt": "2026-10-12T12:14:59.256Z",
          "seenCount": 1
        },
        {
          "employer": "Veterinary Emergency Group (VEG)",
          "role": "Senior Frontend Software Engineer",
          "rate": "$170,000–$200,000/year + bonus",
          "type": "Full-time salaried",
          "location": "US remote",
          "fit": "React/TypeScript, accessible component libraries, hospital operations, AI-assisted engineering; direct veterinary field/surgical background",
          "caveats": "5+ years and senior ownership; Base UI design-system experience may require ramp; posting also contains generic HQ in-person language despite remote job label.",
          "url": "https://builtin.com/job/senior-software-engineer/11010954",
          "observedAt": "2026-10-12",
          "priority": 6,
          "_key": "url:https://builtin.com/job/senior-software-engineer/11010954",
          "firstSeenAt": "2026-10-12T12:14:59.256Z",
          "lastSeenAt": "2026-10-12T12:14:59.256Z",
          "seenCount": 1
        },
        {
          "employer": "Vetcove",
          "role": "Senior Software Engineer",
          "rate": "$115,000–$200,000/year + bonus/equity",
          "type": "Full-time salaried",
          "location": "US remote",
          "fit": "React, React Native, Redux, PostgreSQL, testing, veterinary procurement and animal-health operations; strong direct domain familiarity",
          "caveats": "Bachelor's degree required; Python/Django backend rather than strongest Node/.NET skills; confirm degree-equivalency flexibility.",
          "url": "https://jobs.ashbyhq.com/vetcove/0f3616b7-fe63-4ac2-9335-bbb8a0c36ff7",
          "observedAt": "2026-10-12",
          "priority": 7,
          "_key": "url:https://jobs.ashbyhq.com/vetcove/0f3616b7-fe63-4ac2-9335-bbb8a0c36ff7",
          "firstSeenAt": "2026-10-12T12:14:59.256Z",
          "lastSeenAt": "2026-10-12T12:14:59.256Z",
          "seenCount": 1
        },
        {
          "employer": "Close",
          "role": "Senior Software Engineer — Frontend/React",
          "rate": "Not disclosed in reviewed posting",
          "type": "Full-time salaried",
          "location": "US remote",
          "fit": "React/TypeScript SPA, Vite, React Testing Library, Playwright, Vitest, CRM workflows and AI automation",
          "caveats": "Senior frontend bar; verify detailed experience requirements and compensation before extensive tailoring.",
          "url": "https://jobs.ashbyhq.com/Close/8b67d1fa-5852-4f7d-b8c2-cedc20b16da7",
          "observedAt": "2026-10-12",
          "priority": 8,
          "_key": "url:https://jobs.ashbyhq.com/Close/8b67d1fa-5852-4f7d-b8c2-cedc20b16da7",
          "firstSeenAt": "2026-10-12T12:14:59.256Z",
          "lastSeenAt": "2026-10-12T12:14:59.256Z",
          "seenCount": 1
        },
        {
          "employer": "HavocAI",
          "role": "Senior Frontend Engineer",
          "rate": "$150,000–$175,000/year + equity/bonus",
          "type": "Full-time salaried",
          "location": "Remote (confirm state eligibility)",
          "fit": "React, map-based and visualization-heavy UIs, public-safety/GIS experience, high-stakes operations software",
          "caveats": "Defense/autonomy domain; verify clearance, travel and US-state eligibility; specialized real-time operational visualization expectations.",
          "url": "https://jobs.ashbyhq.com/havocai/5cdfc31d-3ef2-464f-a587-7d9a2dec8a5b/",
          "observedAt": "2026-10-12",
          "priority": 9,
          "_key": "url:https://jobs.ashbyhq.com/havocai/5cdfc31d-3ef2-464f-a587-7d9a2dec8a5b/",
          "firstSeenAt": "2026-10-12T12:14:59.256Z",
          "lastSeenAt": "2026-10-12T12:14:59.256Z",
          "seenCount": 1
        }
      ]
    },
    "jeep-watch": {
      "dashboard": "jeep-watch",
      "total": 0,
      "runs": 6,
      "updatedAt": "2026-10-12T07:46:41.227Z",
      "items": []
    }
  }
}
```

</details>

## 2. Decision counts and review boundary

| Dashboard | Assessed review entries | APPROVE CANDIDATE | MANUAL REVIEW | EXCLUDE |
| --- | ---: | ---: | ---: | ---: |
| email-action | 8 | 0 | 3 | 5 |
| christian-jobs | 14 | 1 | 9 | 4 |
| local-prospects | 10 | 5 | 5 | 0 |
| job-rates | 7 | 0 | 4 | 3 |
| jeep-watch | 0 | 0 | 0 | 0 |

**Total: 39 reviewed entries = 6 proposed + 21 held + 12 excluded.** This includes excluded existing tests and potentially overlapping held role descriptions; it is not a claim of 39 unique live opportunities. The AEM reminder is supporting evidence for EA02, not a second import candidate. Unrecovered reports/listings are evidence gaps, not invented candidate rows. No prior Jeep listing identity was recovered and verified live, so Jeep Watch has no proposed import.

Discovery was bounded to recent recovered Email Monitor decisions, October 8 Local Prospects Batch 10, named September 28–October 7 Christian findings, and September 14–October 5 weekly job findings. This is not an exhaustive archive. Earlier prospect batches and newer incomplete reports are not bulk-imported.

## 3. Identity and provenance rules

Implementation checked: all five state handlers are byte-identical at the starting commit. Key precedence is `id → messageId → url → business|location → employer|role|location → vehicle|location|price → from|subject|received → stable full-object fallback`.

- Incoming `_key` is not an override. Retain exact key-driving text; adding a higher-precedence ID/URL can create a duplicate. Check both exact keys and logical aliases.
- Approved prospect payloads deliberately **omit `url`** so identity stays business + location. Website citations remain in this manifest; do not promote them into a higher-precedence identity field at execution.
- New imports use `backfilled:true`. All proposed/draft payloads omit `originallyObservedAt`, `postedAt` and persistence-owned fields. Historical report timestamps and notification-delivery times prove dated reports, not exact original observation instants.
- Persistence will assign actual import-time `firstSeenAt`/`lastSeenAt` and `seenCount:1` for a new key. Do not spoof dates. Matching updates preserve prior `firstSeenAt` and increase observations; such enrichment is **not** approved by this new-record proposal.
- Upsert shallow-merges arbitrary fields; absent fields do not clear existing values. Run receipts keep their existing 50-entry bound. No replace mode, rollback fiction or identity migration.
- Numeric scores remain absent because full rubrics were not assessed. Only the four clearly evidenced prospect workflow categories below are added; Atlas remains uncategorized. No priority, deadline, hourly conversion, distance or other inferred normalization.

### Historical sources

**H-L:** Local Software Prospects Batch 10, dated October 8, 2026. Retrieved assistant-output excerpts identify the businesses/workflows and labeled automation hypotheses; output timestamp `2026-10-08T12:07:11Z`. The delivered [task update](https://mail.google.com/mail/u/?authuser=jamestuckerwray%40gmail.com#all/1a11b69ce09bbb2f) at 12:08:01Z corroborates the dated report but contains only a truncated preview. Current official pages cited per record were checked October 12. Hypotheses remain hypotheses, with no claim of lost revenue, broken software or willingness to buy.

**H-C:** Recovered prior Christian watch/research outputs September 28–October 7 and delivered task updates, including [October 2](https://mail.google.com/mail/u/?authuser=jamestuckerwray%40gmail.com#all/1a0fc92642db9843) and [September 29](https://mail.google.com/mail/u/?authuser=jamestuckerwray%40gmail.com#all/1a0ed1457027f996). URLs and current eligibility were not recoverable for many leads. A Christian-sounding name or church-tech customer base is insufficient affiliation evidence.

**H-J:** Recovered weekly outputs and [September 14 task update](https://mail.google.com/mail/u/?authuser=jamestuckerwray%40gmail.com#all/1a09ff43d5861578), [September 21](https://mail.google.com/mail/u/?authuser=jamestuckerwray%40gmail.com#all/1a0c3edd4850f36a), and [September 28](https://mail.google.com/mail/u/?authuser=jamestuckerwray%40gmail.com#all/1a0e80db929d2534). Exact first-observation times, original tool logs and several full source URLs were unavailable.

**H-E:** October 11 Slice 3C audit report (`Dashboarda-Slice-3C-Email-Monitor-Audit-2026-10-11.md`), recovered Email Monitor outputs and directly read Gmail source threads. Block explanations are reported outcomes, not independently recovered raw tool errors. Current item absence is established below; it does not prove a write never happened historically.

## 4. Review-ready proposed payloads

### Local Prospects — LP01–LP05

For these five: H-L historical provenance; current location/contact/workflow evidence rechecked; current state empty. All are plausible outreach prospects, not proven sales opportunities. Duplicate risk is **low against this snapshot, moderate for future name/location aliases**. Gate 2 must match aliases and physical/site identity before using the exact keys below. No integration access, existing vendor stack beyond what is stated, or business pain is assumed.

#### LP01 — DSB Lawn Service LLC

**Recommendation: APPROVE CANDIDATE. Target: local-prospects.**
Expected key: `business:DSB Lawn Service LLC\|Danville, VA`.
Sources: [official 1](https://www.dsblawnservicellc.com/).
Relevance/uncertainty: Current form and weekly service verified; internal scheduling, integration access and demand remain unknown.

```json
{
  "business": "DSB Lawn Service LLC",
  "location": "Danville, VA",
  "workflow": "Property-detail intake form and recurring weekly lawn care.",
  "hypothesis": "Hypothesis: connect approved estimates to recurring service scheduling and seasonal rebooking reminders.",
  "phone": "434-218-2232",
  "status": "new",
  "backfilled": true,
  "workflowCategory": "scheduling-dispatch"
}
```

#### LP02 — Holland Fence

**Recommendation: APPROVE CANDIDATE. Target: local-prospects.**
Expected key: `business:Holland Fence\|Axton, VA`.
Sources: [official 1](https://hollandfencecompany.com/resources/instant-quote/); [official 2](https://hollandfencecompany.com/).
Relevance/uncertainty: Current official public branding uses Holland Fence. Use that current brand in the persisted business+location identity to reduce future alias/duplicate risk. Existing estimator is mySalesman; API/export access and unmet need are unknown.

```json
{
  "business": "Holland Fence",
  "location": "Axton, VA",
  "workflow": "Online fence estimator collects address, fence layout and material choices; site consultation leads to a quote and installation.",
  "hypothesis": "Hypothesis: connect estimator leads to follow-up, site-visit scheduling and quote-status tracking.",
  "phone": "276-732-6992",
  "status": "new",
  "backfilled": true,
  "workflowCategory": "estimates-quotes"
}
```

#### LP03 — Atlas Garage Door Sales & Service

**Recommendation: APPROVE CANDIDATE. Target: local-prospects.**
Expected key: `business:Atlas Garage Door Sales & Service\|Martinsville, VA`.
Sources: [official 1](https://www.atlasgarageservice.com/contact); [official 2](https://www.atlasgarageservice.com/services-1).
Relevance/uncertainty: Current contact route and emergency/appointment distinction verified; existing dispatch process and integration route unknown. Category omitted rather than forced.

```json
{
  "business": "Atlas Garage Door Sales & Service",
  "location": "Martinsville, VA",
  "workflow": "Phone/email intake for ordinary appointments and emergency garage-door service.",
  "hypothesis": "Hypothesis: separate emergency calls from installation estimates and track callbacks and appointments.",
  "phone": "276-229-8984",
  "status": "new",
  "backfilled": true
}
```

#### LP04 — Four Seasons Heating, Cooling & Electrical

**Recommendation: APPROVE CANDIDATE. Target: local-prospects.**
Expected key: `business:Four Seasons Heating, Cooling & Electrical\|Danville, VA`.
Sources: [official 1](https://www.fourseasonshvacdanville.com/contact); [official 2](https://www.fourseasonshvacdanville.com/).
Relevance/uncertainty: Original report used Four Seasons Heating and Air; current public brand/address and Judy's role verified. No observed missed jobs or proven scheduling defect.

```json
{
  "business": "Four Seasons Heating, Cooling & Electrical",
  "location": "Danville, VA",
  "workflow": "Name/email/phone/message form and telephone inquiries for HVAC/electrical service.",
  "hypothesis": "Hypothesis: classify requests, track technician assignment and remind preventive-maintenance customers.",
  "contactRole": "Judy Travis — Office Manager",
  "phone": "434-799-2600",
  "status": "new",
  "backfilled": true,
  "workflowCategory": "intake-forms"
}
```

#### LP05 — Vernon Roof Experts

**Recommendation: APPROVE CANDIDATE. Target: local-prospects.**
Expected key: `business:Vernon Roof Experts\|Martinsville, VA`.
Sources: [official 1](https://vernonroofexperts.com/).
Relevance/uncertainty: Current form, process and Martinsville address verified. Existing tools, conversion problems and consent for integration remain unknown.

```json
{
  "business": "Vernon Roof Experts",
  "location": "Martinsville, VA",
  "workflow": "Quote form captures service, property address and contact details; consultation/inspection precedes roofing work.",
  "hypothesis": "Hypothesis: create estimate records, schedule inspections and follow up on outstanding proposals.",
  "phone": "276-340-9158",
  "status": "new",
  "backfilled": true,
  "workflowCategory": "estimates-quotes"
}
```

### CJ01 — American Bible Society, Senior Full Stack Engineer

**Recommendation: APPROVE CANDIDATE. Target: christian-jobs.**
H-C: first recovered dated report October 2; exact observation time unknown. [Current advertisement](https://www.indeed.com/viewjob?jk=963db30c49908c59) is accessible with an application route and explicit Christian employee commitments; [official organization](https://www.americanbible.org/) corroborates the employer. React/TypeScript/Next.js/PostgreSQL/AWS and mentoring match documented experience; the listing accepts equivalent practical/bootcamp experience. This is a verification/application-review lead, not a declaration that every condition is met.

Expected key: `url:https://www.indeed.com/viewjob?jk=963db30c49908c59`. Current Christian state has no rows. Duplicate risk: low at baseline; moderate across future Indeed/employer-ATS aliases. Virginia eligibility, faith affirmation, travel and current employer-ATS requisition need review. No pay/posting date or fitScore is asserted.

```json
{
  "employer": "American Bible Society",
  "role": "Senior Full Stack Engineer",
  "location": "United States — Remote (Virginia eligibility to confirm)",
  "fit": "React/TypeScript/Next.js, PostgreSQL, AWS serverless and mentoring align with Tucker's background. Review faith commitments, state eligibility and travel before applying.",
  "url": "https://www.indeed.com/viewjob?jk=963db30c49908c59",
  "status": "new",
  "backfilled": true
}
```


## 5. Email Action failure reconciliation — held, not replayed

Complete current-state comparison found **EA01–EA03 confirmed absent at snapshot time**: no message key/ID, corresponding subject/sender content or known alias matches. None is “already persisted.” Underlying historical outcomes remain reported failed/blocked or uncertain; current absence does not prove nonoccurrence of an earlier write or explain a platform decision.

Source threads were read through Gmail (50-message cap; retrieved threads contain only 1, 2 and 1 messages). A targeted Sent search for the two recruiters/subjects after October 8 returned no matching reply. This is bounded mailbox evidence, not proof of unresolved status: phone, another account, a differently titled reply or user decision may resolve them. Tucker must confirm current actionability before any import.

The two recruiter candidates are recent and selected for persistence in recovered run outputs. EA02 has an October 11 reminder, supporting continued recruiter interest. The reminder is not a separately approved action row.

### EA01 — Looking for Lead .NET Cloud Modernization Engineer - Remote / Telecommute - [Nashville,TN,37201]

**Recommendation: MANUAL REVIEW. Target: email-action.**
Source: [Gmail message](https://mail.google.com/mail/u/?authuser=jamestuckerwray%40gmail.com#all/1a12262f9e94710c); source receipt `2026-10-09T20:37:53Z`. Original observation time omitted.
Expected key: `message:1a12262f9e94710c`; duplicate risk low after fresh complete-state and subject/thread reconciliation.
3C recovered output reports interactive authorization blocked synchronization. Current full state has no identity/content match; one source-thread message and no matching sent reply found. Off-mailbox resolution and Vue/GCP suitability remain unverified.

**Conditional draft only — no execution approval:**

```json
{
  "messageId": "1a12262f9e94710c",
  "from": "Dice Recruiter <5b7-7y5-75u@user.dice.com>",
  "subject": "Looking for Lead .NET Cloud Modernization Engineer - Remote / Telecommute - [Nashville,TN,37201]",
  "category": "recruiter/job",
  "received": "2026-10-09T20:37:53Z",
  "action": "Decide whether to respond to Simon Singh's .NET/Vue/GCP role; if interested, provide resume and availability.",
  "status": "new",
  "backfilled": true
}
```

### EA02 — Adobe AEM EDS Experts - 100% remote, ASAP, 12+ months

**Recommendation: MANUAL REVIEW. Target: email-action.**
Source: [Gmail message](https://mail.google.com/mail/u/?authuser=jamestuckerwray%40gmail.com#all/1a12694292772617); source receipt `2026-10-10T16:10:03Z`. Original observation time omitted.
Expected key: `message:1a12694292772617`; duplicate risk low after fresh complete-state and subject/thread reconciliation.
3C recovered output reports a tool safety block. Original message and Oct 11 follow-up 1a12cbc4c9a9f1e2 form one opportunity; neither is persisted. No matching sent reply found. EDS/backend/lead requirements and off-mailbox resolution require Tucker review; do not add a separate follow-up row.

**Conditional draft only — no execution approval:**

```json
{
  "messageId": "1a12694292772617",
  "from": "wynwood tech Recruiting recruiting@wynwd.com",
  "subject": "Adobe AEM EDS Experts - 100% remote, ASAP, 12+ months",
  "category": "recruiter/job",
  "received": "2026-10-10T16:10:03Z",
  "action": "Decide whether to respond to the AEM EDS request and October 11 follow-up; if interested, send CV, start date and requested skill self-assessment.",
  "status": "new",
  "backfilled": true
}
```

### EA03 — Security alert

**Recommendation: MANUAL REVIEW. Target: email-action.**
Source: [Gmail message](https://mail.google.com/mail/u/?authuser=jamestuckerwray%40gmail.com#all/1a1282933a02c904); source receipt `2026-10-10T23:32:29Z`. Original observation time omitted.
Expected key: `message:1a1282933a02c904`; duplicate risk low after fresh complete-state and subject/thread reconciliation.
3C recovered output reports sync failed; exact cause uncertain. Confirmed absent from current complete state. User recognition/resolution unknown; not a recruiter candidate and must remain held until confirmed actionable.

**Conditional draft only — no execution approval:**

```json
{
  "messageId": "1a1282933a02c904",
  "from": "Google <no-reply@accounts.google.com>",
  "subject": "Security alert",
  "category": "account/security",
  "received": "2026-10-10T23:32:29Z",
  "action": "Confirm whether the Linux sign-in is recognized; secure the Google account if it is not.",
  "status": "new",
  "backfilled": true
}
```

If later approved, these are explicit historical recovery records, **not automatic retries of historical tool actions**. Retake state first; stop on an exact/logical match rather than silently tagging an existing item as backfilled. Never infer “nothing written” from an uncertain outcome.

## 6. Other manual-review candidates

These are **known-only drafts** from dated historical reports. Unknown source URLs, current pay, contact details, workflow evidence and normalized fields stay absent. A draft is not an import-ready payload; canonical identity/current relevance must be resolved before separate Tucker approval. Potential job keys listed below are provisional; adding a canonical URL later changes key precedence.

### Local Prospects — LP06–LP10

| ID | Source/provenance | Uncertainty and relevance check | Known-only draft payload |
| --- | --- | --- | --- |
| LP06 | H-L; [historical website](https://www.danvilleappliance.com/service.html) | Historical form/service/parts/appointment hypothesis recovered; current service page returned 403 and homepage could not be read. Indexed official contact listing alone does not reconfirm the workflow. Exact business/location aliases must be checked; duplicate risk moderate. | `{"business":"Danville Appliance Sales & Service","location":"Danville, VA","status":"new","backfilled":true}` |
| LP07 | H-L; [historical website](https://fryefenceandcurbscaping.com) | Historical name/location and estimate/contact route recovered; original hypothesis and current workflow not fully reverified. Exact business/location aliases must be checked; duplicate risk moderate. | `{"business":"Frye Fence","location":"Axton, VA","status":"new","backfilled":true}` |
| LP08 | H-L; [historical website](https://raywoodlandscape.com) | Historical inquiry/recurring-contract workflow reported; exact original hypothesis and current operational detail not recovered. Exact business/location aliases must be checked; duplicate risk moderate. | `{"business":"Raywood Landscape","location":"Danville, VA","status":"new","backfilled":true}` |
| LP09 | H-L; [historical website](https://southsidemechanical.com) | Historical online/phone intake reported at 140 Parker Rd W; current workflow and original hypothesis insufficiently recovered. Exact business/location aliases must be checked; duplicate risk moderate. | `{"business":"Southside Mechanical","location":"Danville, VA","status":"new","backfilled":true}` |
| LP10 | H-L; [historical website](https://astanleypaving.com/contact) | Historical estimate-form research reported; exact original hypothesis and current workflow insufficiently recovered. Exact business/location aliases must be checked; duplicate risk moderate. | `{"business":"Art Stanley's Paving","location":"Danville, VA","status":"new","backfilled":true}` |

The above drafts have provisional business/location keys. Danville Appliance's original service/parts/appointment hypothesis was retrieved, but source access failed on current inspection; the other four lack sufficient recovered hypothesis/current workflow detail. Do not replace those gaps with industry stereotypes.

### Christian Jobs — held historical roles

| ID | Historical lead and report date | Missing evidence / duplicate risk | Known-only draft payload |
| --- | --- | --- | --- |
| CJ03 | H-C; American Bible Society — Tech Lead, Ministry Technology / Product Studio; 2026-10-07; [historical source](https://remoteglide.online/job/tech-lead-24) | Only a third-party historical URL recovered; current employer posting, role identifier and eligibility unverified. High cross-site/key risk until canonical URL and Christian eligibility are verified. | `{"employer":"American Bible Society","role":"Tech Lead, Ministry Technology / Product Studio","location":"US remote (historical report)","status":"new","backfilled":true}` |
| CJ04 | H-C; Ascension — Senior Fullstack Software Engineer; 2026-09-30; URL unavailable | Exact posting URL missing; historical pay/title variations cannot establish a current requisition. High cross-site/key risk until canonical URL and Christian eligibility are verified. | `{"employer":"Ascension","role":"Senior Fullstack Software Engineer","location":"US remote (historical report)","status":"new","backfilled":true}` |
| CJ05 | H-C; Prison Fellowship — Senior Software Engineer; 2026-09-29; URL unavailable | Exact posting URL/current open status unavailable. High cross-site/key risk until canonical URL and Christian eligibility are verified. | `{"employer":"Prison Fellowship","role":"Senior Software Engineer","location":"US remote (historical report)","status":"new","backfilled":true}` |
| CJ06 | H-C; Called / Newman Services — Senior Full Stack Engineer; 2026-10-02; URL unavailable | Canonical posting unavailable; church-tech affiliation alone does not prove explicitly Christian workplace eligibility. High cross-site/key risk until canonical URL and Christian eligibility are verified. | `{"employer":"Called / Newman Services","role":"Senior Full Stack Engineer","location":"US remote (historical report)","status":"new","backfilled":true}` |
| CJ09 | H-C; Pushpay / Nurture — Software Development Engineer 3; 2026-09-28; URL unavailable | Original canonical posting/current status and required affiliation evidence not recovered. High cross-site/key risk until canonical URL and Christian eligibility are verified. | `{"employer":"Pushpay / Nurture","role":"Software Development Engineer 3","location":"US remote (historical report)","status":"new","backfilled":true}` |
| CJ10 | H-C; Lifeway — Senior Software Development Engineer, Full Stack; 2026-09-28; URL unavailable | Original canonical posting/current status not recovered. High cross-site/key risk until canonical URL and Christian eligibility are verified. | `{"employer":"Lifeway","role":"Senior Software Development Engineer, Full Stack","location":"US remote (historical report)","status":"new","backfilled":true}` |
| CJ11 | H-C; Ascension — Sr Software Engineer — Frontend/Backend; 2026-09-28; URL unavailable | Canonical requisition missing; possible title-level overlap with CJ04. Do not create both without distinguishing requisitions. High cross-site/key risk until canonical URL and Christian eligibility are verified. | `{"employer":"Ascension","role":"Sr Software Engineer — Frontend/Backend","location":"US remote (historical report)","status":"new","backfilled":true}` |
| CJ12 | H-C; Samaritan Ministries — Senior Software Engineer; 2026-09-28; URL unavailable | Original canonical posting/current status and exact remote restrictions not recovered. High cross-site/key risk until canonical URL and Christian eligibility are verified. | `{"employer":"Samaritan Ministries","role":"Senior Software Engineer","location":"Remote (historical report)","status":"new","backfilled":true}` |
| CJ14 | H-C; The Signatry — Software Engineer; 2026-09-29; URL unavailable | Original canonical posting/current status not recovered. High cross-site/key risk until canonical URL and Christian eligibility are verified. | `{"employer":"The Signatry","role":"Software Engineer","location":"US remote (historical report)","status":"new","backfilled":true}` |

No retrieved historical salary or ad hoc score is copied into these drafts. The two Ascension descriptions might represent separate roles or title aliases; do not approve both without independent requisition evidence.

### Job Rates — JR01, JR04–JR06

JR01: [live LTS employer ATS](https://job-boards.greenhouse.io/lts/jobs/4340405009) has an application form and a USD salary range, without an explicit pay period. It does not match any current URL/employer/role in the nine-item snapshot. A September 14 report named this role; a prior recovered URL identifies requisition 4340405009. Seven years of professional frontend experience, real-time/agentic senior ownership and Public Trust eligibility need fit review. Current role is useful to review, but not yet proposed for import. Preserve the range as disclosed; do not infer an annual/hourly basis. No score, postedAt or observation instant is fabricated.

```json
{
  "employer": "LTS",
  "role": "Senior Front-End Agentic AI Engineer",
  "location": "United States — Remote",
  "rate": "$167,500–$203,900 USD (salary range; period not specified)",
  "type": "Employment",
  "fit": "React/TypeScript, federal healthcare, accessibility and AI-assisted engineering are relevant.",
  "caveats": "Requires 7+ years and ability to obtain/maintain Public Trust; senior real-time/agentic UI experience needs review. Source does not state pay period; do not normalize hourly.",
  "url": "https://job-boards.greenhouse.io/lts/jobs/4340405009",
  "backfilled": true
}
```

| ID | Historical lead / provenance | Uncertainty and identity | Known-only draft payload |
| --- | --- | --- | --- |
| JR04 | H-J; Xealth — Senior Software Engineer, Full Stack; 2026-09-21 | Exact historical RemoteNex URL/job ID missing; current open status not established. Provisional employer/role/location basis; high risk until canonical requisition is recovered. | `{"employer":"Xealth","role":"Senior Software Engineer, Full Stack","location":"US remote (historical report)","backfilled":true}` |
| JR05 | H-J; Xcelerate Solutions — Full Stack Developer (React/.NET); 2026-09-21 | Exact historical Jobgether URL/job ID missing; employer, remote eligibility and current requisition require verification. Provisional employer/role/location basis; high risk until canonical requisition is recovered. | `{"employer":"Xcelerate Solutions","role":"Full Stack Developer (React/.NET)","location":"Remote (historical report)","backfilled":true}` |
| JR06 | H-J; Apex Systems — Senior Full Stack Developer (React/Vite, C#, Node/Fastify); 2026-09-14 | Historical job ID 3049197 recovered; exact source URL/current open status not. Historical $70–$80/hr W2 is not independently reverified and is omitted from draft. Provisional employer/role/location basis; high risk until canonical requisition is recovered. | `{"employer":"Apex Systems","role":"Senior Full Stack Developer (React/Vite, C#, Node/Fastify)","location":"Remote (historical report)","backfilled":true}` |

## 7. Excluded candidates — no payload proposed

| ID / dashboard | Historical or existing record | Evidence | Reason |
| --- | --- | --- | --- |
| EA04 / email-action | Monika Kumari — Senior React Developer \|\| Rutherford, NJ | Gmail 1a12154dbc9bc568 | Onsite Rutherford and face-to-face interview; 3C records intentional exclusion. No new obligation to reply established. |
| EA05 / email-action | Empower/KFORCE retirement notice | Gmail 1a121be379e93ce0 | Already persisted under message identity; do not mark a natural item as backfilled or replay the observation. |
| EA06 / email-action | Dashboarda Slice 2 test | Gmail 1a11d48a1b7089e9 / current state | Controlled test already persisted; not an operational action. |
| EA07 / email-action | Slice 1B controlled upsert | Current state / 3C controlled-write evidence | Controlled synthetic test, already persisted; no real source email needed. |
| EA08 / email-action | Test Recruiter — Senior React Engineer interview | Current state | Placeholder received='Today', no real source/observation metadata; apparent seed record is not eligible for historical operational import. Existing row left untouched. |
| CJ02 / christian-jobs | 5 Stones — Software Engineer II | [source](https://www.weare5stones.com/careers) | Old role URL 404; current careers page lists Software Engineer under typical hiring/talent-pool roles rather than current openings. Do not import as a live vacancy. |
| CJ07 / christian-jobs | SPN Solutions — Full-Stack Application Developer | Recovered 2026-10-06 report; exact Indeed URL unavailable | Explicit Christian eligibility/current canonical posting not evidenced; Fairfax location not established as eligible remote/local work. |
| CJ08 / christian-jobs | SIL Global — Software Developer | Recovered 2026-09-28 report | Historical supported/volunteer description does not establish a paid current opportunity; source posting absent. |
| CJ13 / christian-jobs | Samaritan's Purse — Application Developer | Recovered 2026-09-28 report | Boone onsite role not established as eligible under remote/local constraints; no current posting to resolve this. |
| JR02 / job-rates | Numentica — Frontend Engineer React/AWS | [source](https://techjobsdata.com/job/130222/) | Likely logical duplicate of current Numentica row: same employer/stack/EST/contract/rate ceiling. Different syndicated URL is not evidence of a separate requisition; do not create another URL key. |
| JR03 / job-rates | AKAASA agriculture React/GIS role | Recovered 2026-09-28 report / current AKAASA row | Current record already covers that opportunity; no distinct historical requisition/URL recovered. |
| JR07 / job-rates | The Judge Group — Front-End Software Engineer (ReactJS) | Recovered 2026-09-07 report | Older than preferred window; source URL missing and still-active status not established. |

For CJ02, the [official 5 Stones careers page](https://www.weare5stones.com/careers) differentiates Current Openings from Jobs We Hire For; the old Engineer II URL returned 404. This does not rule out a general inquiry, but it does not justify importing an active vacancy.

JR02's old syndicated URL would produce a different URL key despite substantial overlap with the naturally persisted Numentica role. JR03 likewise lacks evidence of a distinct requisition. Neither is imported just to increase volume. Existing records, including tests, remain untouched.

## 8. Evidence unavailable / scope limits

- Complete historical scheduled-run/tool-call logs; authorization/safety rejection details; exhaustive Gmail retrieval/result sets.
- Exact original observation instants. Report creation, posting and email delivery/receipt timestamps are not substituted into `originallyObservedAt`.
- Full historical source URLs/current postings for held jobs and some Christian affiliation/eligibility evidence. Generic careers or aggregator names are not canonical job identities.
- Complete raw Local Prospects Batch 10 transcript and most earlier/newer batch details. The dated notification previews alone do not expose individual records.
- Native bounded `runHistory` via MCP, which intentionally omits it. Complete item sets and current counter metadata **were** obtained; raw history was not.
- Any historical Jeep listing URL verified live. No sold/deleted/unknown listing is manufactured for market history.
- Email resolution outside the connected mailbox and recognition of Google's Linux sign-in.
- Business internal workflows, losses, customer/job value, vendor API/export access and desire to purchase automation. Public forms demonstrate intake, not a defect.
- Physical production UI/deploy inspection was not needed for Gate 1. Current read-only task configuration confirms both durable rules for all five tasks; no prompts were changed.

## 9. Proposed Gate 2 plan — future only

**Tucker has conceptually reviewed the six recommended candidates: LP01, LP02, LP03, LP04, LP05, and CJ01. Final production authorization still requires explicit approval of these corrected exact payloads before Gate 2 writes.** Approval of this document's preparation, branch, conceptual review, or recommendation is not authorization to import all held/excluded records. Resolve held candidates and obtain separate per-ID approval before adding any of them.

1. Prefer completing Local Prospects' pending natural-run verification before its historical five-record batch so the natural proof remains unambiguous. Immediately before any production write, take a fresh complete snapshot of all five dashboards. Revalidate source relevance, exact keys and logical aliases; refresh the six payloads only through reviewed amendments.
2. If any approved item is already present under any identity, hold/skip it and revise expected counts before writing. Do not silently enrich or rewrite current natural items. No `items:[]` call is needed for a dashboard with no approved imports.
3. Through the existing authorized MCP only, propose one conservative five-record Local Prospects pilot batch, then one single-record Christian Jobs batch. Both are within the 50-item limit. Do not work around a rejected/blocked action.
4. After **each** batch, read complete state back and check expected totals, identities, no duplicates, preserved prior rows, `backfilled:true`, genuine import-time persistence metadata, absence of fabricated `originallyObservedAt`, and one additional Successful sync.
5. Stop immediately on rejection, uncertainty or unexpected read-back. Never automatically retry or make a corrective second write. Use read-only reconciliation; any later corrective plan requires review.

If the baseline is unchanged and all six remain absent:

| Dashboard | Approved batch | Expected total | Expected Successful syncs | Effect |
| --- | --- | ---: | ---: | --- |
| local-prospects | LP01–LP05 (5) | 0 → 5 | 0 → 1 | Historical import; **not** natural-run verification |
| christian-jobs | CJ01 (1) | 0 → 1 | 2 → 3 | Historical import |
| email-action | None | 4 | 42 | No Gate 2 call proposed |
| job-rates | None | 9 | 1 | No Gate 2 call proposed |
| jeep-watch | None | 0 | 6 | No Gate 2 call proposed |

Each successfully persisted batch adds one sync, including a batch of matching items if such an update were separately approved. That is correct persistence accounting, not a scheduled execution count. A lost response may conceal successful persistence; counters/read-back require reconciliation without replay. Concurrent natural activity can change these illustrative baselines; fresh approved expectations take precedence.

Local Prospects natural proof remains independent: a backfill-derived `runs:1` cannot close it. Do not mark Slice 4B complete until an explicitly approved Gate 2 meets its real exit condition.

**Gate 1 stops here. No production backfill, pilot, repair or historical retry was performed.**

## 10. Final read-only checkpoint

Second complete, count-checked reads completed by **2026-10-12T13:47:04.465Z**. All five returned states are identical to the initial snapshot: item fields/identities, totals, Successful sync counters and updatedAt are unchanged. No production state was written by Gate 1.
