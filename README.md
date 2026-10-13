# Dashboarda

A lean monorepo of tiny personal dashboards.

## Apps
- christian-jobs
- job-rates
- local-prospects
- jeep-watch
- email-action
- home-board

Each app is independently deployable to Netlify from this single repository.

## Shared task-dashboard UI — Slice 4C

The five task dashboards share DO NEXT (record review), NOTICE (assessment/import coverage), and EXPLORE (all stored records). Refresh is a PIN-authenticated, no-store GET of saved state; it never executes a task or writes records. Client **Checked at** is separate from server **Last successful sync**. Domain-specific recommendations and charts remain later slices; see [DECISIONS.md](docs/DECISIONS.md#slice-4c--shared-ui-and-refresh).

Edit `shared/dashboard.js` / `shared/dashboard.css`, then run `npm run sync:dashboards`. Site-local copies are committed because each app still publishes its own `.` directory; each task-app build also copies its assets. Do not edit the generated copies individually. App-specific titles, display columns and field mappings remain in each `index.html` configuration. No framework, new runtime dependency or Netlify routing change is needed.

From the repository root:

```sh
npm ci
npm test
npm run typecheck
npm run build
```

`npm test` runs the shared UI/controller tests and existing MCP tests. The UI tests use local fixtures; they do not call production. 4C is implemented on `feature/shared-dashboard-ui`; production deployment is a separate operator step, scoped to the five task sites. Home Board and MCP do not require deployment for this UI change.
