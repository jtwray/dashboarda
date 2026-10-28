import test from "node:test";
import assert from "node:assert/strict";
import { normalizeApplication, normalizeRun, summarize, localDay } from "../lib/normalize.mjs";

test("projects only approved display fields and strips unsafe posting links", () => {
  const result = normalizeApplication({ id: "rec-1", fields: {
    "Application Key": "X_123", Employer: "X", Role: "Engineer",
    "Posting URL": "javascript:alert(1)",
    "Current Status": "SUBMISSION_UNCERTAIN",
    "Confirmation Evidence": "Should not imply success",
    "Resume PDF Reference": "private-document-ref",
    "Sensitive Disclosure": "Never display"
  }});
  assert.equal(result.postingUrl, "");
  assert.equal(result.confirmation, "");
  assert.equal(result.artifacts.pdf, "private-document-ref");
  assert.equal(JSON.stringify(result).includes("Sensitive Disclosure"), false);
});

test("counts only confirmed status, keeps uncertain separate", () => {
  const jobs = [
    { status: "SUBMITTED_CONFIRMED", submissionDate: "2026-10-26", trackedDate: "" },
    { status: "BLOCKED_HUMAN", submissionDate: "", trackedDate: "" },
    { status: "SUBMISSION_UNCERTAIN", submissionDate: "2026-10-26", trackedDate: "" },
    { status: "PREPARED", submissionDate: "", trackedDate: "" }
  ];
  const summary = summarize(jobs, [], "2026-10-26");
  assert.deepEqual([summary.applications, summary.submitted, summary.today, summary.blocked, summary.uncertain],
    [4, 1, 1, 1, 1]);
});

test("projects run stats without guessing missing denominators", () => {
  const item = normalizeRun({ fields: { "Run ID": "r01", "Confirmed": 2, "Attempted": 0, "Screened": "" }});
  assert.equal(item.confirmed, 2);
  assert.equal(item.attempted, 0);
  assert.equal(item.screened, null);
});

test("Eastern local day is stable across timezone offsets", () => {
  assert.equal(localDay(new Date("2026-10-27T01:15:00Z")), "2026-10-26");
  assert.equal(localDay(new Date("2026-12-27T01:15:00Z")), "2026-12-26");
});

test("date fields accept only ISO day values", () => {
  const a = normalizeApplication({ fields: {
    "Tracked Date": "26/10/2026", "Submission Date": "2026-10-26",
    "Current Status": "SUBMITTED_CONFIRMED"
  }});
  assert.equal(a.trackedDate, "");
  assert.equal(a.submissionDate, "2026-10-26");
});
