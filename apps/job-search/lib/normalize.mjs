export const STATUS = Object.freeze({
  SUBMITTED: "SUBMITTED_CONFIRMED",
  UNCERTAIN: "SUBMISSION_UNCERTAIN",
  PREPARED: "PREPARED"
});

const text = (v, cap = 3200) =>
  typeof v === "string" ? v.slice(0, cap) : v == null ? "" : String(v).slice(0, cap);

const safeUrl = (v) => {
  if (typeof v !== "string") return "";
  try {
    const parsed = new URL(v);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : "";
  } catch { return ""; }
};

const dateOnly = (v) => typeof v === "string" && /^\\d{4}-\\d{2}-\\d{2}$/.test(v) ? v : "";

export function normalizeApplication(record) {
  const f = record?.fields ?? {};
  const status = text(f["Current Status"], 70) || "PREPARED";
  const confirmation = text(f["Confirmation Evidence"], 2000);
  return {
    id: text(record?.id, 100),
    key: text(f["Application Key"], 300),
    employer: text(f["Employer"], 200),
    role: text(f["Role"], 300),
    requisition: text(f["Requisition"], 200),
    postingUrl: safeUrl(f["Posting URL"]),
    trackedDate: dateOnly(f["Tracked Date"]),
    submissionDate: dateOnly(f["Submission Date"]),
    status,
    compensation: text(f["Compensation"], 250),
    location: text(f["Location / Remote"], 500),
    fit: text(f["Fit / Evidence"], 1600),
    risks: text(f["Risks / Caveats"], 1600),
    blocker: text(f["Blocker"], 1600),
    nextAction: text(f["Next Action"], 1600),
    confirmation: status === STATUS.SUBMITTED ? confirmation : "",
    artifacts: {
      docx: text(f["Resume DOCX Reference"], 500),
      pdf: text(f["Resume PDF Reference"], 500),
      txt: text(f["Resume TXT Reference"], 500),
      cover: text(f["Cover Letter Reference"], 500)
    }
  };
}

export function normalizeRun(record) {
  const f = record?.fields ?? {};
  const numeric = key => Number.isFinite(f[key]) && f[key] >= 0 ? f[key] : null;
  return {
    id: text(f["Run ID"], 150),
    date: dateOnly(f["Run Date"]),
    label: text(f["Label"], 300),
    screened: numeric("Screened"),
    prepared: numeric("Prepared"),
    attempted: numeric("Attempted"),
    confirmed: numeric("Confirmed")
  };
}

export function localDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date);
}

export function summarize(applications, runs, day = localDay()) {
  const counts = Object.create(null);
  const submittedByDay = Object.create(null);
  for (const a of applications) {
    counts[a.status] = (counts[a.status] || 0) + 1;
    if (a.status === STATUS.SUBMITTED && a.submissionDate) {
      submittedByDay[a.submissionDate] = (submittedByDay[a.submissionDate] || 0) + 1;
    }
  }
  const blocked = Object.entries(counts).reduce((total, [name, value]) =>
    name.startsWith("BLOCKED_") ? total + value : total, 0);
  return {
    applications: applications.length,
    submitted: counts[STATUS.SUBMITTED] || 0,
    today: submittedByDay[day] || 0,
    blocked,
    uncertain: counts[STATUS.UNCERTAIN] || 0,
    prepared: counts[STATUS.PREPARED] || 0,
    days: Object.entries(submittedByDay).sort(([a], [b]) => a.localeCompare(b))
      .slice(-14).map(([date, count]) => ({ date, count })),
    runs: runs.length,
    reportDay: day,
    lastTrackedDate: applications.map(a => a.trackedDate).filter(Boolean).sort().at(-1) || null
  };
}
