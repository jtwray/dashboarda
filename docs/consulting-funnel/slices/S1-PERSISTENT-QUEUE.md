# Slice S1 · Persistent ranked gig queue (MVP)

**Status:** Ready for owner scope review · **not implemented**.  
**Target:** `jtwray/dashboarda` · `feat/gig-radar-persistent-queue` · owner-reviewed PR.

## Goal

Replace recurring scroll-only gig lists with an authenticated, persistent, sortable dashboard. Display small current and historical paid-opportunity records independently of W2 job boards.

## In scope

- Add `apps/gig-radar` with deployed-readable GET and authorized upsert per existing Dashboarda patterns, after reviewing the actual auth implementation.
- Define and validate record contract / stage transitions per `specs/OPPORTUNITY-SCHEMA.md`; preserve source provenance and unknown values.
- Canonicalize source identity/dedup safely, separate `postedAt` from `firstSeenAt`, preserve user status during re-ingest.
- Responsive table with source link, pay type, score, age confidence, stage and caveats; client-side sort and core filters.
- Test fixtures (3+ synthetic leads, with one duplicate and one unknown posting date); empty-run heartbeat; controlled stage updates.
- Extend connector allowlist explicitly, if applicable; verify no other dashboard data is affected.
- README with local run/build and authorized deployment procedure.

## Acceptance tests (reviewer must execute)

1. Upsert same source twice → one stable item, updated observations, preserved status.
2. Two different sources with same title → no unintended merge.
3. Unknown postedAt → UI says **unknown**, never 'posted today' because firstSeenAt is recent.
4. Sorting and filtering work on mobile viewport; source links open actual original URLs from fixture.
5. Change status to `ready` then re-sync → `ready` remains.
6. Empty-items scan increments run metadata without deleting items.
7. Unauthorized GET/POST denied; test no cross-board writes.
8. No automatic application/submission button; no original client contacts.
9. Run automated tests/build, capture command output and preview screenshots in PR.

## Non-goals / park for S2+

Web scraping, live scheduled sources, scoring ML, user data enrichment, ProofTree retrieval, proposals, autobid, notifications, new deployment framework, analytics experiments.

## Dev agent handoff

Inspect repository storage/API patterns first, present any migration/interface risk, implement on feature branch with atomic commits. Keep tests and sample fixtures deterministic. Report actual tests run, failed checks and unverified external deployment steps.

## Independent review

Check real code, auth and test evidence, not only agent summary. Reproduce the acceptance tests including replay and authorization; inspect deployed preview if available; verify that `main` is unchanged. Flag overreach, especially unrelated modifications or risky live-state migration.
