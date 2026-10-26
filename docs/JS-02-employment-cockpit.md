# JS-02 — Employment Cockpit

## Purpose

Provide a private read-only Dashboarda cockpit for the user's verified job-application tracker, with attention queue, recent agent runs, and confirmed-by-day metrics. Keep stable prompt instructions out of the log.

## Boundary

Feature branch only. No existing Dashboarda apps modified. No changes to running job-search task. No production deployment or secret provisioning. No application write APIs.

## Source inputs

- Airtable Employment Pipeline — Private, created October 26, 2026
- Applications (47 imported records); Application Events (47 migration snapshots); Agent Runs (32 imported records)
- Original ChatGPT Library application_tracker.json preserved as fallback and audit
- GitHub repo jtwray/dashboarda on main, existing PRs #1, #2, #3 unaffected

## Design decisions

- Airtable is candidate canonical state; original Library tracker remains authoritative until JS-03 validated cutover.
- JobHawk's free tier is too limited for the 10/day goal.
- App uses read-only Airtable API via Netlify Functions; browser gets only projected fields after server authentication.
- PIN-style unlock is implemented with a long passphrase + signed HttpOnly session, not a short numeric PIN or localStorage.
- Blocked and uncertain applications must not be represented as submitted.
- No public dashboard data, applicant self-identification answers or repository secrets.
- Read-only app can be reviewed without changing any external application state.

## Acceptance gate

- [x] Isolated app code on feature branch
- [x] Server authentication, read-only pagination and restricted display projection authored
- [x] Responsive UI, accessible filters and careful status counts authored
- [x] Self-contained Node tests authored
- [ ] CI/build results verified
- [ ] Independent security and functional review
- [ ] Deploy preview privately verified with server secrets
- [ ] Owner approves merge, deployment, and future JS-03 cutover
