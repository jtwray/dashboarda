# SignalDesk evidence ledger

Evidence date: 2026-10-14. **MVP definition of done is not yet met.** The base, linked schema, published outreach interface and validated and enabled native automation now exist. Live import/repeat, native execution, serial task deduplication and isolated user-state preservation are verified; unattended Netlify operation remains pending.

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
| Native automation run | User enabled wflZOl0vNykBlcGGe; run wfxrOpfFEjiBGAMN4 succeeded 2026-10-14T21:44:04Z–21:44:06Z | Verified native execution |
| Linked task/user-state retention | QA task rec8rbbYxbL4ZzECi linked correctly; Completed status, edited due date and prospect state survived sync and serial requalification | Verified live via core engine/connector |
| Scheduled invocation | Function implemented, disabled by default; not deployed | Unverified |
| Production source write | None attempted | Existing data untouched |

## Resume points

1. Native automation is enabled and tested; do not recreate or repeat its Create record action against an already-handled prospect.
2. Provision restricted production PAT and IDs through the secrets UI (never in chat/Git).
3. Resolve release lineage with the currently published branch, review/deploy the Local Prospects app, enable and redeploy.
4. Import/repeat, isolated task/field preservation, serial qualification and native run history are captured. Proceed to runtime deployment.
5. Capture a genuine scheduled invocation; only then mark the MVP complete and use the completed-work interview narrative.

## Evidence still to collect

- Base URL: https://airtable.com/appRoOSGbph3XGzNu; Prospects table tbloVnuQ2fVEcOlDx; initial import 2026-10-14T21:37:14.965Z. Record IDs and counts in live-evidence.json.
- Native automation URL: https://airtable.com/appRoOSGbph3XGzNu/wflZOl0vNykBlcGGe. Successful run wfxrOpfFEjiBGAMN4; task rec8rbbYxbL4ZzECi; original due date 2026-10-16T21:44:04Z.
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
- No Activities records were created manually. The native-created QA task is now Completed after the lifecycle test.
- The core syncProspects engine was transpiled directly from committed source and run in the tool orchestration runtime against an adapter calling authenticated Airtable list/upsert tools. This verifies the real mapper/diff/upsert engine, not the REST PAT client or Netlify function.
- Live initial import: five real source records, five acknowledged upserts. Repeat: unchanged=5, confirmed=0; all IDs retained.
- Live preservation: a separate synthetic QA prospect was synchronized, then Notes and qualification New were set on **that QA record only**. The QA source fixture workflow changed to v2; sync confirmed one update, and read-back preserved both user-owned fields. Source Dashboarda records were never modified or supplemented with QA data.
- Automatic approval review rejected an earlier proposed batch that would have set qualification and temporarily cleared a research field on real prospects. That rejected batch was not applied. The isolated QA test above was the materially safer alternative; no approval bypass was used.
- Added new Netlify production Functions variables AIRTABLE_BASE_ID and AIRTABLE_PROSPECTS_TABLE_ID with actual IDs, and SIGNALDESK_ENABLED=false. No existing variables were changed. AIRTABLE_TOKEN remains absent. No deployment performed.
- GitHub Actions SignalDesk checks run 38637841338 succeeded on commit 21ed9971283337d847a1cb0591597004a6e51629. Later changes in this milestone only update documentation/evidence.

## Native execution proof — 2026-10-14, 21:44 UTC

User enabled the valid automation. Read-back verified deploymentStatus=deployed and deploymentError=null before testing.

- Changed only labelled QA prospect recHo67amPeWxIQox from New to Qualified. Run wfxrOpfFEjiBGAMN4 started 21:44:04Z and succeeded 21:44:06Z (2 seconds), deployment wfdEP5oaORJWVYZHy.
- Native Create record produced rec8rbbYxbL4ZzECi at 21:44:05Z: Activity type Initial outreach, Status Open, linked QA prospect, Due date 2026-10-16T21:44:04Z (two days after qualification). Native Update record set Outreach created=true. Rollup=1 and reciprocal link verified.
- Core-engine research refresh v3 confirmed one update while retaining qualification, Notes, marker and activity link. Serial New → Qualified after successful run produced no second task.
- On that synthetic QA task only, changed Status to Completed and Due date to 2026-10-17T21:44:04Z. Research refresh v4 confirmed one update. Read-back retained Completed, edited due date, completion timestamp 2026-10-14T21:44:47Z and prospect-owned state.
- A second serial New → Qualified cycle after completion still left one task, count=1, marker=true and only the original successful native run. The computed prospect Follow-up target changes after requalification; the existing task's edited Due date remains independent.
- These are real Airtable native-run observations using a synthetic QA record. Real imported businesses were not qualified or contacted. Netlify schedule and REST PAT transport remain unverified.
- Complete structured receipts and the deployed native configuration are in live-evidence.json and native-automation.json.

## Runtime credential and redeploy check — 2026-10-14, 22:06 UTC

- User saved AIRTABLE_TOKEN and redeployed without cache. Netlify read-back confirms the key exists and is marked secret, with Functions scope and production context. Its plaintext was not read, logged or committed. Key existence is not proof its Airtable authorization works.
- Published deploy 6acffc6d1473b237a87a73bc is ready, production, published 2026-10-14T22:04:47.741Z. It rebuilt **fix/scheduled-write-outcomes**, commit b722b4f1d714c1925a36f2a90ad7b49bba07d045. Available functions: only state; function_schedules empty. `/api/signaldesk/status` returns 404. This deploy does not contain SignalDesk.
- Authenticated Dashboarda MCP read still returns five prospects, runs=1, updatedAt=2026-10-13T00:19:11.851Z. No source mutation occurred during QA.
- Verified Local Prospects UI is byte-identical between the production lineage's index.html and the feature branch's public/index.html. Existing state handler is byte-identical. Release must target **only** the existing Local Prospects site.
- Netlify connector write operations reported success for SIGNALDESK_ENABLED, AIRTABLE_BASE_ID and AIRTABLE_PROSPECTS_TABLE_ID, but fresh getAllEnvVars calls do not show those keys. Therefore configuration persistence is **not verified**, and earlier entries claiming those keys were configured are superseded. Do not infer success from the write acknowledgement; user must set/read back them in Netlify UI.
- Remaining settings: production branch feature/airtable-signaldesk; base directory apps/local-prospects; build npm run build; publish public (relative to base); functions netlify/functions. Add the two actual base/table IDs from live-evidence.json and SIGNALDESK_ENABLED=false in production Functions scope. Deploy and verify state, signaldesk-sync and signaldesk-status before enabling.
