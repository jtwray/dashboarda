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

## SignalDesk — Airtable Automation Bridge

The Local Prospects app includes an optional, disabled-by-default Airtable bridge.
See [architecture](docs/signaldesk/ARCHITECTURE.md), [setup and native automation](docs/signaldesk/SETUP.md),
[actual evidence and remaining gates](docs/signaldesk/EVIDENCE.md), and [portfolio wording](docs/signaldesk/PORTFOLIO.md).
Live connector import/repeat and isolated field preservation are verified. Native execution and serial task deduplication are verified; unattended Netlify execution remains pending; see the evidence ledger.
