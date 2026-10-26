# JS-03 — Application agent persistence: bounded integration

**Stacked branch:** feat/js-03-application-sync on feat/js-02-employment-cockpit (PR #4).

## Goal

Put stable applicant policy in a short scheduled-task prompt, and persist changing job/application state and run evidence outside the prompt. Candidate source of truth: private Airtable Employment Pipeline, with the original ChatGPT Library tracker as a preserved rollback/evidence source until cutover.

This slice DOES NOT send job applications, change the active scheduled task, publish a write API, or deploy writer secrets. These require separate gated approval/verification.

## Current verified constraints (October 26, 2026)

- Source Airtable base appsqe7i9ZeXspE0t: Applications 47, confirmed 22, blocked 24, uncertain 1; Events 47 migration snapshots, Agent Runs 32 historical.
- Dashboarda JS-02 displays Airtable records on a separately deployed Netlify site and is READ-ONLY.
- The running ChatGPT automation is titled "Apply to matching jobs" and is scheduled eight times per day at 00, 03, 06, 09, 12, 15, 18, 21 America/New_York; the quota is TEN confirmed suitable applications per local calendar day, not 10 per check.
- The existing task text still contains dated October 22–23 checkpoints and incorrectly says the applicant lacks a car. Confirm user mobility and current applicant facts before replacing its prompt; do not lose the supplied historical screening authorizations.
- The account's connected Airtable app supports read, create, update and performUpsert operations. A *future scheduled task run* must still verify it can invoke the connector before making Airtable authoritative.

## Persistent schema

| Table | Stable identity | Purpose |
|---|---|---|
| Applications (tblQeAuDdLClWUXq8) | Application Key, plus canonical URL/requisition dedup | One current row per employer/requisition. Never label attempts as successful. |
| Application Events (tblvu1kzsrVXD140l) | Event ID | Append-once evidence of a change; don't overwrite conflicting events. |
| Agent Runs (tbl5YzalPrS2fkY0I) | Run ID | One run summary with observed denominators and failure modes. |

The agent should **read before write**, match by exact Application Key OR normalized posting URL OR employer+requisition, and stop on ambiguous multiple matches.

Existing legacy Application Keys are retained on updates, not replaced by a new hashing scheme.

## Local, audited writer

- Pure contract: apps/job-search/agent/protocol.mjs
- Airtable REST v0 adapter: apps/job-search/agent/airtable-writer.mjs
- Optional Node CLI: apps/job-search/agent/cli.mjs
- Tests: apps/job-search/tests/agent-sync.test.mjs
- Sample: apps/job-search/agent/sample-run.json

By default CLI only reads and previews. Writes require both --apply and JOB_SEARCH_AGENT_WRITE_ENABLED=1 plus a separate, narrow read/write Airtable token in the *agent's trusted execution environment*. The Netlify dashboard only requires a READ token: **do not add the writer token to the website**.

The adapter verifies readback before proceeding, does not automatically retry a failed/uncertain write, and stops when any step cannot be verified. Every save is still nontransactional across the three Airtable tables. Concurrent writers are NOT proven exactly-once.

### Usage

    cd apps/job-search
    AIRTABLE_JOB_SEARCH_READ_TOKEN=<redacted> node agent/cli.mjs agent/sample-run.json

The sample is fictional and *preview-only*. To apply an actual authorized run after stage gates, supply a private input file with observed application evidence, then:

    JOB_SEARCH_AGENT_WRITE_ENABLED=1 AIRTABLE_JOB_SEARCH_WRITE_TOKEN=<redacted> node agent/cli.mjs /private/verified-run.json --apply

Do not put real job-run data with personally sensitive screening answers or bearer tokens in Git. If connector-native Airtable writes are used instead of this CLI, they MUST implement the same lookup/transition/confirmation/reconciliation contract.

## Guardrails

- Submission confirmation requires an observed receipt/ID and actual local submission date. A mere Submit click, pending OTP or CAPTCHA is not confirmation.
- Existing confirmed applications cannot be demoted and are never automatically submitted again.
- Existing uncertain applications may not be retried or converted to confirmed without explicit applicant review and corroborating evidence.
- A partial or rejected Airtable write is not automatically retried; re-read and reconcile with destination and Library before manual continuation.
- Never persist disability self-ID, criminal history, protected-demographic answers, medical information, passwords, MFA codes, identity attestations, or full resume contents in these Airtable tables. Store only references to immutable application-specific documents, no publicly accessible links without authorization.
- Preserve the original Library file and avoid simultaneous competing writers.
- Metrics calculated from confirmed status rows and recorded Eastern-local submission dates; no fabricated aggregate rates.
- A scheduled task may send a daily summary email only after verified delivery, with no sensitive screening answers.

## Acceptance gates

- [x] Writer and guardrail tests authored on JS-03 branch
- [ ] GitHub CI passes with replay/uncertain/partial failure coverage
- [ ] Real Airtable *isolated QA-table* test: repeated upsert by ID does not create duplicates, readback confirms one row
- [ ] Read-only dry-run matches 47 historical rows and counts without modifying canonical records
- [ ] No hardcoded credentials or accidental public write endpoint; independent security review
- [ ] Trial run explicitly verifies Airtable connector access, new record write, event, run, dashboard sync, and rollback steps
- [ ] Owner review before changing scheduled prompt or making Airtable authoritative

## JS-04 cutover candidate

Shorten the scheduled automation prompt, replacing old chronological checkpoints with links to current persistent records. Correct driving/commute facts. Preserve verified applicant instructions/consents in a separate authoritative profile. Change only after read/write and dedup gate is proven. Keep eight-per-day checking and ten-per-*day* cap unless the applicant explicitly changes it. Restrict the new dashboard to read-only.
