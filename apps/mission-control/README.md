# Mission Control — App Shipping Board (SHIP-01)

A lightweight, read-only inventory of the apps and engineering projects being shipped across GitHub repos and agent work sessions.

## v0.1 snapshot (October 27, 2026)
- One project per swimlane, from Define → Slice plan → Build → Validate → Publish → Real use
- Filter by category, search projects or slices, sort by attention/shipping/name
- Click a row to inspect ordered slices, evidence links, dependencies, and the next action
- Source-based states: verified, partial, needs review, blocked, planned, or unverified
- No invented completion percentages

This is **a frozen snapshot**, not live GitHub/Netlify/Airtable sync. Status labels are provisional until accepted by the owning project's repository and reviewer. Some linked repositories and PRs are private; the board is intentionally usable without access to them.

## Preview locally
Open `index.html` in any browser; it is self-contained and requires no dependency install, build, API key, or runtime server.

## Deploy on Netlify
Netlify project reserved: https://app.netlify.com/projects/mission-control-jtwray

**First manual deployment:** use Netlify's Deploys page to drag in the contents of this directory (or a ZIP whose root contains `index.html`). This is independent of the other Dashboarda sites.

**Continuous deployment after reviewing/merging the slice:** connect repository `jtwray/dashboarda` to the Mission Control Netlify project. Production branch: `main`. Base directory: `apps/mission-control`. Publish directory: `.`. Build command: blank. No environment variables.

Do not configure the project's root as the publish directory; this is one independently deployed child app in a monorepo. A Git-linked production deploy replaces an earlier manually published version on subsequent pushes.

## Guardrails
- Static read-only presentation. No login, backend, persistence, GitHub token, crawler, agent control, or automatic writes.
- Public hosting of this snapshot exposes project names and progress descriptions. Do not add private records, unpublished client information, customer details, resumes, tokens, or applicant records.
- Keep each source project, PR, and evidence ledger authoritative. An agent reporting a slice done is **not** a verified deployment.
- SHIP-02 candidate: scheduled source ingestion and verifiable last-updated timestamps. Keep it independently reviewed before implementation.
