import { createHash } from "node:crypto";

/**
 * JS-03 protected application-persistence contract.
 * Never store protected demographic answers, medical/health information,
 * legal screening responses, auth secrets, or full resumes in Airtable.
 */
export const BASE_ID = "appsqe7i9ZeXspE0t";
export const TABLES = Object.freeze({
  applications: "tblQeAuDdLClWUXq8",
  events: "tblvu1kzsrVXD140l",
  runs: "tbl5YzalPrS2fkY0I"
});
export const STATUS = Object.freeze({
  prepared: "PREPARED",
  confirmed: "SUBMITTED_CONFIRMED",
  uncertain: "SUBMISSION_UNCERTAIN",
  blockedHuman: "BLOCKED_HUMAN",
  blockedTechnical: "BLOCKED_TECHNICAL",
  blockedFacts: "BLOCKED_REQUIRED_FACTS",
  blockedEligibility: "BLOCKED_ELIGIBILITY",
  excluded: "EXCLUDED",
  closed: "CLOSED"
});
const statusSet = new Set(Object.values(STATUS));
const SHA = value => createHash("sha256").update(value).digest("hex");
const date = v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const str = (v, n) => typeof v === "string" ? v.trim().slice(0, n) : "";

export function canonicalUrl(input) {
  if (typeof input !== "string" || input.length > 2048) return "";
  try {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    url.hash = ""; url.search = "";
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch { return ""; }
}

export function normalizeEmployer(value) {
  return str(value, 200).toLocaleLowerCase("en-US").replace(/[^a-z0-9]/g, "");
}

export function stableKey(job) {
  const employer = normalizeEmployer(job.employer);
  const ref = str(job.requisition, 300).toLowerCase() || canonicalUrl(job.postingUrl);
  if (!employer || !ref) throw new Error("Employer and requisition or official posting URL are required");
  return "js03_" + SHA(employer + "|" + ref).slice(0, 28);
}

/**
 * Match the existing imported rows before deriving a new ID. Both a canonical
 * posting link and employer + requisition are checked, to prevent reimporting
 * existing historical records that used a different keying convention.
 */
export function findExisting(jobs, incoming) {
  const employer = normalizeEmployer(incoming.employer);
  const requisition = str(incoming.requisition, 300).toLowerCase();
  const url = canonicalUrl(incoming.postingUrl);
  const explicitKey = str(incoming.applicationKey, 300);
  const derived = stableKey(incoming);
  const matches = jobs.filter(row => {
    const f = row.fields || {};
    const key = f["Application Key"];
    const rowReq = str(f.Requisition, 300).toLowerCase();
    return (
      (explicitKey && key === explicitKey) ||
      key === derived ||
      (!!url && canonicalUrl(f["Posting URL"]) === url) ||
      (!!requisition && rowReq === requisition &&
       normalizeEmployer(f.Employer) === employer)
    );
  });
  if (matches.length > 1) throw new Error("Ambiguous application duplicate; human reconciliation required");
  return matches[0] || null;
}

/** Only prepare field names present on our reviewed Airtable schema. */
export function safeFields(candidate, existing = null, localDate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
    throw new Error("Expected application object");
  const employer = str(candidate.employer, 200);
  const role = str(candidate.role, 300);
  const url = canonicalUrl(candidate.postingUrl);
  const requisition = str(candidate.requisition, 300);
  if (!employer || !role || !url) throw new Error("Employer, role, and HTTP(S) posting required");
  if (!requisition && !url) throw new Error("Requisition or official link required");
  if (!date(localDate)) throw new Error("Local date must be YYYY-MM-DD");
  if (!statusSet.has(candidate.status)) throw new Error("Unrecognized status");
  const previous = existing?.fields || {};
  const before = previous["Current Status"];
  const beforeStatus = typeof before === "object" ? before.name : before;

  if (beforeStatus === STATUS.confirmed && candidate.status !== STATUS.confirmed)
    throw new Error("Refusing to demote a confirmed submission");
  if (beforeStatus === STATUS.uncertain && candidate.status !== STATUS.uncertain &&
      candidate.reconciliation?.reviewedByApplicant !== true)
    throw new Error("Uncertain submission must be reconciled by applicant");
  if (candidate.status === STATUS.confirmed) {
    if (!str(candidate.confirmationEvidence, 2000) || !date(candidate.submissionDate))
      throw new Error("Confirmed status requires observed evidence and valid submission date");
    if (beforeStatus === STATUS.uncertain &&
        !str(candidate.reconciliation?.evidence, 1600))
      throw new Error("Uncertain-to-confirmed transition requires reconciliation evidence");
  }
  const fields = {
    "Application Key": existing ? str(previous["Application Key"], 300) : stableKey(candidate),
    Employer: employer,
    Role: role,
    "Posting URL": url,
    "Current Status": candidate.status,
    "Tracked Date": str(candidate.trackedDate, 10) || localDate
  };
  if (requisition) fields.Requisition = requisition;
  if (candidate.status === STATUS.confirmed) {
    fields["Confirmation Evidence"] = str(candidate.confirmationEvidence, 2000);
    fields["Submission Date"] = candidate.submissionDate;
  }
  const allow = [
    ["Compensation", "compensation", 250],
    ["Location / Remote", "location", 800],
    ["Fit / Evidence", "fit", 2000],
    ["Risks / Caveats", "risks", 2000],
    ["Blocker", "blocker", 2000],
    ["Next Action", "nextAction", 2000],
    ["Resume DOCX Reference", "resumeDocx", 700],
    ["Resume PDF Reference", "resumePdf", 700],
    ["Resume TXT Reference", "resumeTxt", 700],
    ["Cover Letter Reference", "coverLetterRef", 700],
    ["Resume SHA256", "resumeSha256", 64],
    ["Source Tracker", "source", 250]
  ];
  for (const [field, property, max] of allow) {
    const content = str(candidate[property], max);
    if (content) fields[field] = content;
  }
  if (beforeStatus === STATUS.confirmed) {
    // Never overwrite the proof of a submitted application with a later run's
    // approximations; only fill missing harmless fields.
    fields["Confirmation Evidence"] = previous["Confirmation Evidence"];
    fields["Submission Date"] = previous["Submission Date"];
  }
  // PATCH only includes allowlisted fields; omitted fields in Airtable are preserved.
  // Never echo source fields unknown to this schema, including private answers.
  return fields;
}

export function diffFields(existing, desired) {
  const old = existing?.fields || {};
  const changed = {};
  for (const [key, val] of Object.entries(desired)) {
    const prev = old[key];
    const previousValue = typeof prev === "object" && prev?.name ? prev.name : prev;
    if (previousValue !== val) changed[key] = val;
  }
  return changed;
}

export function eventSpec(job, applicationKey, runId, dateValue) {
  const status = job.status;
  const kind = status === STATUS.confirmed ? "SUBMISSION_CONFIRMED" :
    status === STATUS.uncertain ? "BLOCKER" :
    status.startsWith("BLOCKED_") ? "BLOCKER" : "STATUS_CHANGE";
  const digest = SHA(JSON.stringify([
    runId, applicationKey, kind, status,
    job.confirmationEvidence || "", job.blocker || "", job.nextAction || ""
  ])).slice(0, 36);
  const event = {
    "Event ID": "js03_" + digest,
    "Application Key": applicationKey,
    "Event Kind": kind,
    "Occurred Date": dateValue,
    Status: status,
    Source: "JS-03 verified agent write"
  };
  const description = str(job.eventEvidence || job.confirmationEvidence || job.blocker || job.nextAction || "", 2000);
  if (description) event["Evidence / Notes"] = description;
  return event;
}

export function runFields(run, localDate) {
  if (!str(run?.id, 200) || !date(localDate))
    throw new Error("Run ID and Eastern-local date required");
  const f = {"Run ID": str(run.id, 200), "Run Date": localDate,
    Label: str(run.label, 200) || "Application agent run",
    Source: "JS-03 verified agent write"};
  for (const [out, key] of [
    ["Screened","screened"],["Prepared","prepared"],["Attempted","attempted"],
    ["Confirmed","confirmed"],["Reported Daily Total","dailyConfirmed"]]) {
    const value = run[key];
    if (value !== undefined) {
      if (!Number.isInteger(value) || value < 0) throw new Error("Invalid nonnegative run count " + key);
      f[out] = value;
    }
  }
  if (str(run.notes, 1600)) f.Notes = str(run.notes, 1600);
  return f;
}
