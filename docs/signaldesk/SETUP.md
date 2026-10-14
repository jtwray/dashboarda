# Airtable setup and release runbook

**Current state:** base and linked schema created; five real prospects imported; repeat and isolated preservation checks passed via the connector. Native automation is **enabled and successfully tested**, including serial deduplication and completed-task preservation. Scheduled Netlify operation remains unverified. Setup steps below remain the reproducible recipe. See EVIDENCE.md for completed operations. Never send outreach from this workflow.

## 1. Create or select a Free workspace base

Use an account with Creator permissions; name the base **SignalDesk — Southside Automation**. Avoid enabling a paid trial feature. Record its `app...` base ID and the Prospects `tbl...` table ID from the base-specific API documentation. Exact field names below are the contract. Remove automatically created sample records before import; do not add sample prospects to production.

### Prospects

| Field | Airtable type | Owner / configuration |
|---|---|---|
| Business name | Single line text (primary) | Bridge |
| External ID | Single line text | Bridge; do not edit, unique by convention |
| Website | URL | Bridge; source `url`, blank if unavailable |
| Location | Single line text | Bridge |
| Industry/workflow | Long text | Bridge; source `workflow` |
| Automation opportunity | Long text | Bridge; source `hypothesis`, remains an unverified business hypothesis |
| Contact information | Long text | Bridge; contact role, phone, email on separate lines |
| First seen | Date with time | Bridge; UTC |
| Last seen | Date with time | Bridge; UTC |
| Qualification status | Single select | User: New (default), Qualified, Disqualified |
| Activities | Link to Activities, multiple | Airtable reciprocal link; retain exact name |
| Notes | Long text | User |
| Outreach created | Checkbox | Native automation only; never reset casually |
| Qualifying outreach count | Rollup | Activities → Qualifying marker → `SUM(values)` |
| Follow-up target | Formula, format as date/time | `IF({Qualification status}="Qualified", DATEADD(LAST_MODIFIED_TIME({Qualification status}), 2, 'days'))` |

Create Activities and its reciprocal link before configuring the rollup.

### Activities

| Field | Airtable type | Configuration |
|---|---|---|
| Activity | Single line text (primary) | Automation writes `Initial outreach review` |
| Prospect | Link to Prospects | One prospect only; reciprocal name Activities |
| Activity type | Single select | Initial outreach, Follow-up, Note |
| Description / next action | Long text | User-editable |
| Due date | Date with time | Automation copies Follow-up target; then user-owned |
| Status | Single select | Open (default), Completed, Cancelled |
| Completion timestamp | Formula, date/time | `IF({Status}="Completed", LAST_MODIFIED_TIME({Status}))` |
| Qualifying marker | Formula | `IF({Activity type}="Initial outreach", 1, 0)` |
| Prospect external ID | Lookup | Prospect → External ID; useful for audit |

Completion timestamp reflects the current Completed transition; reopening clears it. Qualifying marker counts **all** Initial outreach activities, including completed/cancelled ones. Later qualification cycles must not create a second initial task. Never unlink or delete the original activity to request another follow-up; create a Follow-up activity instead.

Views:

- Prospects / **New**: Qualification status is New **or empty**.
- Prospects / **Qualified**: Qualification status is Qualified.
- Activities / **Follow-Up Due**: Status is Open AND Due date is not empty AND Due date is on or before today; sort Due date ascending. A day-based view includes today's later tasks.
- Activities / **Completed**: Status is Completed; sort Completion timestamp descending.

## 2. Configure the native automation (no script)

In the base, Automations → Create new → Create automation. Name **Qualified prospect → initial outreach review**.

1. Trigger **When record matches conditions**, table Prospects, all conditions: Qualification status = Qualified; Qualifying outreach count = 0; Outreach created is unchecked; External ID is not empty.
2. Action **Create record**, table Activities. Set:
   - Activity = `Initial outreach review`
   - Prospect = **Airtable record ID** token from the trigger (not Business name and not External ID).
   - Activity type = Initial outreach
   - Description / next action = `Review the research and contact details. Draft a personal introduction for human approval. Do not send automatically.`
   - Due date = **Follow-up target** token from the trigger.
   - Status = Open
3. Action **Update record**, table Prospects, record ID = trigger's **Airtable record ID**; set Outreach created checked. Do not change Qualification status or overwrite Activities.
4. Use a dedicated clearly labelled temporary test prospect to test the trigger/actions in the editor. Editor action tests **create real rows**; record their IDs. Do not repeatedly test Create record against the same prospect. Keep these tests separate from the real-prospect evidence.
5. Enable the automation. For live evidence choose an imported prospect currently New, with count 0 / checkbox unchecked. Change it to Qualified once, then inspect **Automation history → Run History**. Capture successful run details, linked activity ID, due date and checked marker. A tested action alone is not unattended trigger proof.

Existing Qualified records do not automatically trigger on activation. For an intended initial qualification with no prior task, first change to New, then Qualified **after activation**. This is a real state transition, not a simulated automation; retain its actual run-history evidence.

Why two guards: creating the linked activity increases the rollup before the final checkbox step. If checkbox update fails, an already-created activity still suppresses new triggers. If creation failed, inspect history, verify **no task exists**, then change New → Qualified to retry. If a task exists, repair the checkbox without running Create record again.

**Operational limit:** Airtable native actions are not a transaction and the Free plan provides no unique constraint. Rapid qualification toggles while a run is pending can queue multiple runs before either guard updates. Wait for run completion before toggling again; do not claim arbitrary concurrent exactly-once task creation. Validate normal serial transitions below before enabling use. The bridge never modifies qualification, so its scheduled updates do not re-enter the trigger.

## 3. Configure secrets, initially disabled

On the existing Local Prospects Netlify site, set the following production-context variables with **Functions** scope. Mark AIRTABLE_TOKEN secret. Do not commit a PAT, paste it into chat, or put it in a URL. Create the PAT in Airtable's developer hub, restricted to this base with only `data.records:read` and `data.records:write`. No schema permission is required for this manual setup.

| Variable | Value |
|---|---|
| SIGNALDESK_ENABLED | `false` until setup verified; then `true` |
| AIRTABLE_TOKEN | Restricted PAT |
| AIRTABLE_BASE_ID | Actual `app...` ID |
| AIRTABLE_PROSPECTS_TABLE_ID | Actual `tbl...` ID |

Existing DASHBOARD_READ_PIN continues to protect the new GET `/api/signaldesk/status` endpoint. No new public write endpoint exists.

## 4. Review and deploy safely

The production site currently publishes from `fix/scheduled-write-outcomes`, **not main**. This PR targets main as requested but must not be merged automatically. Coordinate release from the actual production lineage; this feature includes the currently published Local Prospects UI wording, but does not include other branches' MCP or unrelated work. Do not deploy the repository wholesale or change another site's base directory.

Local Prospects build base must be `apps/local-prospects`, command `npm run build`, publish `public`, functions `netlify/functions`. The UI moved into public to avoid publishing source/test files. The state handler is unchanged. Node 24 is required for the dependency-free TypeScript test runner. From repository root:

```sh
npm ci
npm test --workspace @dashboarda/local-prospects
npm run build --workspace @dashboarda/local-prospects
```

A deploy preview cannot prove unattended scheduling: Netlify only schedules published production deploys. Preview and disabled invocations return disabled without reading the production source or touching Airtable. Keep production disabled for initial deployment. Review the bundled functions, public UI and existing API authentication before enabling. Redeploy after changing function environment variables.

Once enabled on a reviewed production deploy, use Netlify's **Run now** for first import (manual execution evidence). Check status through the existing PIN-protected API. Run again and verify five unchanged rows with zero writes. Do not introduce another importer or overlap Run now with the daily run. Then let the scheduler fire at **13:20 UTC daily** (9:20 EDT / 8:20 EST); capture its invocation timestamp and status independently. A Run now result does not meet unattended proof.

## 5. Acceptance evidence

Record actual dates, URLs, record IDs, counts and screenshots in EVIDENCE.md. Never check off an item from expected behavior alone.

| Check | Required observation |
|---|---|
| Initial import | An existing Dashboarda prospect, same External ID, mapped fields, actual Airtable record ID |
| Repeat | Same record IDs/count; status unchanged=5 and confirmed=0 for the current five-record snapshot |
| Human state | Edit qualification, Notes and a task's due date/status; repeat sync and show preservation |
| First qualification | Actual enabled automation run, linked activity, due date, checkbox and rollup=1 |
| Repeated research changes | Same initial task; no extra automation invocation caused by bridge fields |
| New → Qualified again | Wait for first run to finish; switch states; still one initial task |
| Completion | Complete task, show completion timestamp; requalify serially; no new initial task |
| Failure/recovery | Local fault tests plus a controlled test-base failure/recovery if feasible; never break production credentials to test |
| Unattended | Scheduled production invocation (not Run now) with persisted sanitized outcome |
| Dashboard | Existing UI loads, authorized state unchanged, unauthorized state still 401 |

## Operations and recovery

- Daily calls are bounded by the number of table pages plus changed batches. At the Free base maximum there are up to ten read pages; up to 100 changed batches cannot fit a single scheduled invocation. The deadline reports partial completion; subsequent runs skip confirmed changes and continue. This MVP is intended for a small prospect list, not a bulk backfill.
- 429 stops immediately, respecting Airtable's 30-second cooldown by deferring to the next daily run. After at least 30 seconds, an operator may use Run now if the monthly quota is available. Repeated quota failures require usage review, not faster retries.
- Network errors and 5xx retry up to three attempts under an 18-second Airtable budget; requests use timeouts, no redirects, and <=4 requests/second. Other clients share the base's rate cap.
- `confirmed` is acknowledged upserts, not all rows that may have been committed. `pending` is unconfirmed changes (including `uncertain`); `uncertain` is a conservative upper bound for the failed batch, not an additional disjoint count. Re-read and reconcile on retry.
- Duplicate destination External IDs fail before writes. Review and reconcile duplicates manually; the bridge never deletes or guesses a survivor.
- Invalid source data fails before destination writes. No source deletes propagate. Stale/out-of-scope prospects remain available for human disposition.
- `signaldesk-status/latest` is separate from dashboard state and records only sanitized counts/codes/timestamp. Function logs supply invocation history; status is only the latest attempt, not a durable audit log. Monitor Netlify failed scheduled invocations and Airtable failure notifications. Status writes can fail: that also fails the invocation.
- Disable SIGNALDESK_ENABLED and redeploy to stop new bridge work; existing ChatGPT tasks and dashboards continue. Rolling back a deploy with this function removes its schedule. No Airtable data is deleted during rollback.

## Existing setup — resume here

- Base: https://airtable.com/appRoOSGbph3XGzNu
- Review and enable native automation: https://airtable.com/appRoOSGbph3XGzNu/wflZOl0vNykBlcGGe
- Prospects interface (editor URL, already published): https://airtable.com/appRoOSGbph3XGzNu/pagLr8jLCUoblDkRU/edit
- Activities interface (editor URL, already published): https://airtable.com/appRoOSGbph3XGzNu/pagctCnZpxL77y5Cw/edit
- Native connector creates automations off and explicitly requires the user to review and turn them on in Airtable. Do this once; do not manually create an outreach Activity as a substitute.
- After enabling, use the clearly labelled QA prospect recHo67amPeWxIQox for first qualification, repeat updates and serial requalification tests. Leave real prospects' qualification decisions to the user.
- Netlify base/table IDs are already set with Functions scope in production, bridge disabled. Add only AIRTABLE_TOKEN through the secrets UI, restricted to this base with data.records:read and data.records:write. Connected plugin OAuth does not supply credentials to Netlify. Do not enable the bridge or deploy over the current production lineage until release review.
- New and Qualified, Follow-Up Due and Completed were created as native **interface filter tabs** across two grid pages. The base's default Grid views remain available; no additional base-grid views were created through the connector.

## Native acceptance completed — 21:44 UTC

The user enabled the automation. QA trigger run succeeded, creating the correctly linked task and two-day due date. Two subsequent serial qualification cycles did not duplicate it. Completed status, edited due date, Notes and links survived research refreshes. Do not repeat the editor Create record test against the handled QA prospect. Next: provision the independent Netlify runtime PAT, review release lineage, deploy only Local Prospects, and capture an actual scheduled invocation.
