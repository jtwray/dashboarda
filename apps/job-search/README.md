# Employment Cockpit — JS-02

Read-only mobile dashboard for the **Employment Pipeline — Private** Airtable base. This feature branch has not been deployed and does not change the running application automation.

## Data

- Source base: appsqe7i9ZeXspE0t
- Applications: tblQeAuDdLClWUXq8
- Agent Runs: tbl5YzalPrS2fkY0I
- Source Library tracker remains an independent audit/rollback record.
- The original migration imported 47 jobs, 47 migration snapshot events and 32 agent runs.

The server explicitly maps non-screening fields to a display model and never serves a raw Airtable record. It does not fetch private applicant profile, criminal history, disability self-identification, or other demographic fields.

## Netlify deployment after PR review

Create a **separate Netlify site** from the Dashboarda monorepo with:

- Base directory: apps/job-search
- Build command: npm run build
- Publish directory: .
- Functions directory: netlify/functions
- Node runtime: 22+

Configure these secret environment variables **in Netlify** (never in GitHub or browser storage):

- AIRTABLE_JOB_SEARCH_READ_TOKEN: a personal access token restricted to the Employment Pipeline base with data.records:read only. ChatGPT's connected Airtable account does not automatically grant this to a deployed Netlify site.
- JOB_DASHBOARD_PASSPHRASE: a unique high-entropy passphrase of at least 16 characters, not a 4-digit PIN.
- JOB_DASHBOARD_SESSION_SECRET: a separately generated secret of at least 32 characters.

For stronger protection, put the entire site behind Netlify site-level authentication or an identity-aware access gateway where available. The code-level unlock is a first layer, not a promise of enterprise-grade authentication.

## Security and API behavior

- GET /api/session: reports session state (401 when locked).
- POST /api/session: origin-checked passphrase login, with 5 failed attempts per 15-minute window stored in a Netlify Blob; fails closed if rate-limit storage fails.
- DELETE /api/session: clears the browser cookie.
- GET /api/pipeline: reads Applications and Agent Runs with the server-only Airtable token after a session check; all other methods rejected.
- The session is a 12-hour HMAC-signed HttpOnly SameSite=Strict cookie. A successful logout clears it in the browser. Rotating the signing key invalidates old sessions.
- Cookies require HTTPS outside localhost. Responses are no-store. Client scripts never keep the passphrase in localStorage.
- Airtable API results are paginated; data beyond the safety cap generates an error rather than incorrect totals.

No job application writes or submissions are performed by this app.

## Status/count caveats

- Only SUBMITTED_CONFIRMED counts as submitted.
- SUBMISSION_UNCERTAIN is always shown separately and never automatically retried.
- Historical "Submission Date" values were migrated from the older tracker; some historical exact timestamps may require reconciliation.
- The UI is a **view of the last verified Airtable tracker**; it does not independently query ATS systems or live Gmail.
- Source artifact references are displayed as labels rather than invented download links.

## Verification before release

1. Run node --check apps/job-search/main.js and node --test apps/job-search/tests/*.test.mjs.
2. Verify a deploy preview bundles both Netlify Functions and correct base directory.
3. Verify unauthenticated /api/pipeline returns 401 and no Airtable data.
4. Verify wrong passphrase and lockout, then unlock and logout.
5. Verify 47 imported applications, 22 confirmed, 1 uncertain and status filtering against current Airtable state (counts will change as new records arrive).
6. Verify mobile layouts and confirm no sensitive screening-response data appears.
7. Only after owner review and independent security review, merge/deploy. Keep JS-03 agent cutover a separate slice.

## Maintenance

Use the existing Airtable source as a read-only dependency. Do not change the existing scheduled task in JS-02. Require an independent migration and deduplication verification before switching its write destination.
