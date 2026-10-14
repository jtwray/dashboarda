# SignalDesk evidence ledger

Evidence date: 2026-10-14. **MVP definition of done is not yet met.** No base or native automation is claimed to have been created.

| Item | Actual evidence | State |
|---|---|---|
| Repository baseline | main `56a0b1b`, isolated feature/airtable-signaldesk | Verified |
| Production deploy | Netlify deploy `6accdc55afffbfd7783a18a6`, commit `b722b4f1d714c1925a36f2a90ad7b49bba07d045`, published 2026-10-12T13:11:10.538Z, production, state ready | Verified read-only |
| Live UI/auth boundary | Homepage HTTP 200, unauthenticated state GET 401 | Verified read-only |
| Live source | Authenticated MCP read: five prospects; runs=1; updatedAt=2026-10-13T00:19:11.851Z | Verified read-only |
| Example source identity | DSB Lawn Service LLC, Danville VA; `_key=business:DSB Lawn Service LLC\|Danville, VA`; first/last seen=2026-10-13T00:19:11.851Z | Observed in actual MCP result; not an Airtable import |
| TypeScript bridge | Allowlisted mapping, native API upserts, diffing, pagination, pacing, retries, sanitized outcomes | Implemented locally |
| Unit and fault tests | See test command results in PR; HTTP responses are mocked, memory destination is explicitly a test double | Local evidence only |
| Real Airtable import/repeat | No credentials/base configured | Blocked |
| Native automation run | No authenticated Airtable creator session | Blocked; SETUP.md is a recipe, not an executed automation |
| Linked task/user-state retention | Local tests cover field preservation; no live Airtable task | Live proof blocked |
| Scheduled invocation | Function implemented, disabled by default; not deployed | Unverified |
| Production source write | None attempted | Existing data untouched |

## Resume points

1. Authenticate Airtable with Creator access and configure the two tables/native automation using SETUP.md.
2. Provision restricted production PAT and IDs through the secrets UI (never in chat/Git).
3. Resolve release lineage with the currently published branch, review/deploy the Local Prospects app, enable and redeploy.
4. Capture actual import/repeat, user-state preservation, serial qualification transitions and enabled automation history.
5. Capture a genuine scheduled invocation; only then mark the MVP complete and use the completed-work interview narrative.

## Evidence still to collect

- Base URL / Prospects table ID / initial-import timestamp / record IDs: **not available**.
- Native automation URL / enabled run ID / task ID / due date: **not available**.
- Repeat sync timestamp / destination counts and IDs: **not available**.
- Scheduled deploy and invocation ID / status snapshot: **not available**.
- Live failure and recovery timestamps: **not available**; fault-injection tests are not live evidence.

## Local verification results

- Clean `npm ci` succeeded.
- `npm test --workspace @dashboarda/local-prospects`: **19 passed, 0 failed** on Node 24.19.0.
- `npm run build --workspaces --if-present`: passed across all six workspaces; other apps retain their existing static build commands.
- `git diff --check`: passed.
- Test coverage includes an observed production prospect mapping and HTTP-client/synchronizer integration with an explicitly mocked destination, including an acknowledged recovery after a committed write loses its response. Neither test is a real Airtable import.
- CI workflow added for this feature branch and relevant pull-request paths. Remote CI results are tracked on the PR; adding the workflow does not assert that it ran.
