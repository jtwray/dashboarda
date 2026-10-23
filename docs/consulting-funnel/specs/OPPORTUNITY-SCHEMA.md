# Opportunity record & lifecycle contract (proposal)

**This is a schema proposal for S1—not a statement that fields already exist in Dashboarda.** Store persistent UUID and source-derived canonical key. Never rely on title-only deduplication.

```json
{
  "id": "uuid",
  "type": "gig",
  "source": "upwork|make|n8n|reddit|hn|contra|local|direct|other",
  "sourceId": null,
  "canonicalUrl": "https://original-listing.example/...",
  "sourceTitle": "Client's original title",
  "buyerDisplayName": null,
  "location": "Remote US",
  "buyerTimezone": null,
  "postedAt": null,
  "postedAtEvidence": "unknown|source_page|api|author_message",
  "firstSeenAt": "2026-10-23T17:00:00Z",
  "lastSeenAt": "2026-10-23T17:00:00Z",
  "lastVerifiedAt": null,
  "availabilityStatus": "unverified",
  "compensation": {"type":"fixed|hourly|unknown", "currency":"USD", "min":null,"max":null,"stated":false},
  "effortEstimateHours": null,
  "competition": {"value":null,"asOf":null,"confidence":"unknown"},
  "requirements": [],
  "alignmentEvidenceIds": [],
  "scopeSummary": "",
  "caveats": [],
  "exclusionReason": null,
  "score": {"version":"v1","total":null,"components":{}},
  "stage": "discovered",
  "proposal": {"draft":"","suggestedPrice":null,"assumptions":[],"reviewedByUser":false},
  "appliedAt": null,
  "appliedVia": null,
  "buyerRepliedAt": null,
  "interviewAt": null,
  "contractWonAt": null,
  "collectedRevenue": null,
  "acquisitionHours": null,
  "deliveryHours": null,
  "feesPaid": null,
  "auditEvents": []
}
```

## Invariants

- `type=gig` is segregated from `employment` and W2 job boards.
- `postedAt` stays null unless original posting date/time is sourced; `firstSeenAt` is observation only.
- Persist exact source URL; if canonicalization removes tracking arguments, preserve `originalUrl` as well.
- Identity may be `source+sourceId` or stable canonical URL plus source; ambiguous collisions require a human merge decision.
- Re-scans increment observations / lastSeenAt but **must not overwrite** user-set `stage`, proposal work, or outcomes.
- `availabilityStatus=unverified` is not open/hiring evidence; avoid falsely claiming active availability.
- Multi-currency rate comparisons require a dated conversion source, else leave rates native.
- Score contains version and component rationale to support later auditing/reweighting.
- Personal contact, customer data and private application information are not exposed in public commits. Use authenticated storage/least privilege.

## Valid initial states

`discovered` → `qualifying` → `ready` → `applied` → `reply_received` → `interview` → `won` → `delivering` → `paid`.

Any pre-application record can also move to `skipped`, `stale`, or `blocked`; `applied` can become `closed_no_response` **only after a documented user rule**, never inferred silently. Maintain status event history with actor and time; allow reopen/reply after apparent closure. Do not prematurely mark payment on contract win.

## S1 API boundary

Document GET list/detail, POST observed/upsert, PATCH stage with authorization, and zero-results scan heartbeat. Reuse existing Netlify endpoints only after inspecting their behavior, auth and bounded history; version new APIs as needed rather than corrupt existing boards.
