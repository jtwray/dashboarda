# Slice S6 · Dashboarda app-instantiation audit before automation

**Status:** Discovery/backlog; user investigating manually.

## Scope of first audit

Inspect actual `jtwray/dashboarda` `main` and PR history for app creation tooling, Netlify site provisioning, env vars and dashboard allowlist updates. Classify each step: currently automated, semi-manual, manually required, unverified. Produce a reproducible checklist to instantiate `apps/gig-radar` in staging without touching live data.

**Verified so far:** root `package.json` contains `workspaces: ["apps/*"]`; app-specific example `apps/job-rates/package.json` has `netlify dev` and static `build`, existing app and MCP read interface are present. Search did not find a clear `scaffold` workflow by name; that does **not** prove there is none. Need inspect GitHub Actions, scripts and Netlify configuration, and user may have existing orchestration in ChatGPT rather than repo.

## Follow-on implementation (only after audit)

If absent, create a parameterized script/config that generates app workspace, minimal UI, storage/API registration, auth/allowlist wiring, tests, Netlify setup checklist, preview deploy, rollback instructions. Anything involving provider/site creation requires explicit owner approval and tested permissions.

**Acceptance:** staging instantiation repeated from clean checkout, no credentials written into git, preview tested, generated files deterministic, reviewer confirms unrelated dashboards unchanged. Park until S1 is unblocked and scope approved.
