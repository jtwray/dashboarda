# SignalDesk evidence ledger

Evidence date: 2026-10-14. **MVP definition of done is not yet met.** The base, linked schema, published outreach interface and validated native automation draft now exist. Live import/repeat and isolated user-state preservation are verified; native execution and unattended Netlify operation remain pending.

| Item | Actual evidence | State |
|---|---|---|
| Repository baseline | main `56a0b1b`, isolated feature/airtable-signaldesk | Verified |
| Production deploy | Netlify deploy `6accdc55afffbfd7783a18a6`, commit `b722b4f1d714c1925a36f2a90ad7b49bba07d045`, published 2026-10-12T13:11:10.538Z, production, state ready | Verified read-only |
| Live UI/auth boundary | Homepage HTTP 200, unauthenticated state GET 401 | Verified read-only |
| Live source | Authenticated MCP read: five prospects; runs=1; updatedAt=2026-10-13T00:19:11.851Z | Verified read-only |
| Example source identity | DSB Lawn Service LLC, Danville VA; `_key=business:DSB Lawn Service LLC\|Danville, VA`; first/last seen=2026-10-13T00:19:11.851Z | Observed in actual MCP result; not an Airtable import |
| TypeScript bridge | Allowlisted mapping, native API upserts, diffing, pagination, pacing, retries, sanitized outcomes | Implemented locally |
| Unit and fault tests | See test command results in PR; HTTP responses are mocked, memory destination is explicitly a test double | Local evidence only |
| Real Airtable import/repeat | Five existing prospects imported through core TypeScript sync engine + authenticated connector adapter at 21:37:14Z; repeat at 21:37:15Z: unchanged=5, confirmed=0, same IDs | Verified live via connector; REST PAT transport not yet verified |
| Native automation run | Validated draft wflZOl0vNykBlcGGe, configurationStatus=valid, deploymentStatus=undeployed; run history empty | Created; user must review/enable before execution test |
| Linked task/user-state retention | Isolated QA record recHo67amPeWxIQox: research workflow updated by sync, qualification New and Notes preserved | User-state preservation verified live; linked task proof pending native activation |
| Scheduled invocation | Function implemented, disabled by default; not deployed | Unverified |
| Production source write | None attempted | Existing data untouched |

## Resume points

1. Review and enable the created native automation in Airtable; connector authorization is working and table setup is complete.
2. Provision restricted production PAT and IDs through the secrets UI (never in chat/Git).
3. Resolve release lineage with the currently published branch, review/deploy the Local Prospects app, enable and redeploy.
4. Import/repeat and isolated user-state preservation are captured; next capture serial qualification transitions and enabled automation history.
5. Capture a genuine scheduled invocation; only then mark the MVP complete and use the completed-work interview narrative.

## Evidence still to collect

- Base URL: https://airtable.com/appRoOSGbph3XGzNu; Prospects table tbloVnuQ2fVEcOlDx; initial import 2026-10-14T21:37:14.965Z. Record IDs and counts in live-evidence.json.
- Native automation URL: https://airtable.com/appRoOSGbph3XGzNu/wflZOl0vNykBlcGGe. Enabled run ID/task ID/due date: **not available**; no run claimed.
- Repeat sync: 2026-10-14T21:37:15.619Z, five unchanged, zero writes, identical IDs. Destination now also contains one clearly labelled synthetic QA record; it is not an actual prospect.
- Scheduled deploy and invocation ID / status snapshot: **not available**.
- Live failure and recovery timestamps: **not available**; fault-injection tests are not live evidence.

## Local verification results

- Clean `npm ci` succeeded.
- `npm test --workspace @dashboarda/local-prospects`: **19 passed, 0 failed** on Node 24.19.0.
- `npm run build --workspaces --if-present`: passed across all six workspaces; other apps retain their existing static build commands.
- `git diff --check`: passed.
- Test coverage includes an observed production prospect mapping and HTTP-client/synchronizer integration with an explicitly mocked destination, including an acknowledged recovery after a committed write loses its response. Neither test is a real Airtable import.
- CI workflow added for this feature branch and relevant pull-request paths. Remote CI results are tracked on the PR; adding the workflow does not assert that it ran.

## Live configuration and test details

See live-evidence.json for base/table/field/record IDs and exact sync outcomes; native-automation.json contains the read-back persisted draft configuration.

- Authenticated Airtable connector lists one owned workspace, My First Workspace (wspqn90b61oJtJ4qF). Created dedicated SignalDesk — Southside Automation base appRoOSGbph3XGzNu without changing pre-existing bases.
- Created linked Prospects and Activities, formulas, lookup and qualifying-task rollup. All formula fields report valid; the rollup currently reads zero. Its nonzero behavior still requires native task execution.
- Created and published SignalDesk Outreach interface pbdho1EkXnvdzS8fC, Prospects page pagLr8jLCUoblDkRU with New/Qualified filter tabs, Activities page pagctCnZpxL77y5Cw with Follow-Up Due/Completed filter tabs. These are native interface views, not separately created base-grid views. Record editing usability has not been visually checked in the user's browser.
- No Activities records were created manually. Native creation remains the only planned path for the initial outreach task.
- The core syncProspects engine was transpiled directly from committed source and run in the tool orchestration runtime against an adapter calling authenticated Airtable list/upsert tools. This verifies the real mapper/diff/upsert engine, not the REST PAT client or Netlify function.
- Live initial import: five real source records, five acknowledged upserts. Repeat: unchanged=5, confirmed=0; all IDs retained.
- Live preservation: a separate synthetic QA prospect was synchronized, then Notes and qualification New were set on **that QA record only**. The QA source fixture workflow changed to v2; sync confirmed one update, and read-back preserved both user-owned fields. Source Dashboarda records were never modified or supplemented with QA data.
- Automatic approval review rejected an earlier proposed batch that would have set qualification and temporarily cleared a research field on real prospects. That rejected batch was not applied. The isolated QA test above was the materially safer alternative; no approval bypass was used.
- Added new Netlify production Functions variables AIRTABLE_BASE_ID and AIRTABLE_PROSPECTS_TABLE_ID with actual IDs, and SIGNALDESK_ENABLED=false. No existing variables were changed. AIRTABLE_TOKEN remains absent. No deployment performed.
- GitHub Actions SignalDesk checks run 38637841338 succeeded on commit 21ed9971283337d847a1cb0591597004a6e51629. Later changes in this milestone only update documentation/evidence.
