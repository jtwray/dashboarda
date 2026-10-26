const byId = id => document.getElementById(id);
const ui = {
  unlock: byId("unlock"), app: byId("app"), loginForm: byId("login-form"),
  passphrase: byId("passphrase"), loginError: byId("login-error"),
  dataError: byId("data-error"), logout: byId("logout"),
  refresh: byId("refresh"), search: byId("search"),
  jobList: byId("job-list"), actionList: byId("action-list")
};
let snapshot = { items: [], recentRuns: [], metrics: null };
let filter = "all";

function node(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined && value !== null) element.textContent = String(value);
  return element;
}

function showLogin(message = "") {
  ui.app.hidden = true;
  ui.logout.hidden = true;
  ui.unlock.hidden = false;
  ui.loginError.hidden = !message;
  ui.loginError.textContent = message;
}
function showApp() {
  ui.unlock.hidden = true;
  ui.logout.hidden = false;
  ui.app.hidden = false;
}

async function api(path, init = {}) {
  const response = await fetch(path, {
    credentials: "same-origin", cache: "no-store", ...init
  });
  let result = {};
  try { result = await response.json(); } catch { /* Preserve HTTP status. */ }
  if (!response.ok) {
    const error = new Error(result.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  return result;
}

const isBlocked = status => String(status).startsWith("BLOCKED_");
const displayStatus = status => status === "SUBMITTED_CONFIRMED" ? "Submitted" :
  status === "SUBMISSION_UNCERTAIN" ? "Uncertain" :
  status === "PREPARED" ? "Prepared" :
  isBlocked(status) ? "Blocked" : (status || "Unknown").replaceAll("_", " ");
const statusStyle = status => status === "SUBMITTED_CONFIRMED" ? "confirmed" :
  status === "SUBMISSION_UNCERTAIN" ? "uncertain" :
  status === "PREPARED" ? "prepared" : isBlocked(status) ? "blocked" : "";
const isMatch = (job, selected) => selected === "all" ? true :
  selected === "blocked" ? isBlocked(job.status) :
  selected === "submitted" ? job.status === "SUBMITTED_CONFIRMED" :
  selected === "uncertain" ? job.status === "SUBMISSION_UNCERTAIN" :
  selected === "prepared" ? job.status === "PREPARED" : false;

function addDetail(parent, label, value) {
  if (!value) return;
  const p = node("p");
  p.append(node("strong", "", label + ": "), document.createTextNode(value));
  parent.append(p);
}

function jobCard(job) {
  const root = node("article", "job");
  const head = node("div", "job-main");
  const description = node("div");
  description.append(node("h3", "job-title", job.employer || "Unnamed employer"),
    node("p", "job-role", job.role || "Role not recorded"));
  head.append(description, node("span", "tag " + statusStyle(job.status),
    displayStatus(job.status)));
  root.append(head);
  const meta = node("div", "job-meta");
  const chips = [
    job.trackedDate ? "Tracked " + job.trackedDate : "",
    job.compensation, job.location, job.requisition ? "Req " + job.requisition : ""
  ];
  for (const c of chips.filter(Boolean)) meta.append(node("span", "", c));
  root.append(meta);
  const details = node("details");
  details.append(node("summary", "", "Evidence, blocker & next action"));
  const body = node("div", "details-body");
  addDetail(body, "Status", displayStatus(job.status));
  addDetail(body, "Submission date", job.submissionDate);
  addDetail(body, "Fit", job.fit);
  addDetail(body, "Caveats", job.risks);
  addDetail(body, "Blocker", job.blocker);
  addDetail(body, "Next action", job.nextAction);
  addDetail(body, "Confirmation evidence", job.confirmation);
  const files = job.artifacts || {};
  addDetail(body, "Resume DOCX", files.docx);
  addDetail(body, "Resume PDF", files.pdf);
  addDetail(body, "Resume TXT", files.txt);
  addDetail(body, "Cover letter", files.cover);
  if (job.postingUrl) {
    const a = node("a", "", "Open official job posting ↗");
    a.href = job.postingUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    body.append(a);
  }
  details.append(body);
  root.append(details);
  return root;
}

function renderJobs() {
  const query = ui.search.value.trim().toLowerCase();
  const ranked = [...snapshot.items].sort((a, b) => {
    const priority = s => s === "SUBMISSION_UNCERTAIN" ? 0 :
      isBlocked(s) ? 1 : s === "PREPARED" ? 2 : 3;
    return priority(a.status) - priority(b.status) ||
      (b.submissionDate || b.trackedDate || "").localeCompare(a.submissionDate || a.trackedDate || "");
  });
  const jobs = ranked.filter(j => isMatch(j, filter) &&
    [j.employer, j.role, j.requisition, j.key].some(v => String(v || "").toLowerCase().includes(query)));
  ui.jobList.replaceChildren(...jobs.map(jobCard));
  byId("record-count").textContent = jobs.length + " of " + snapshot.items.length + " records";
  byId("empty").hidden = jobs.length > 0;
}

function renderActions() {
  const queue = snapshot.items
    .filter(j => isBlocked(j.status) || j.status === "SUBMISSION_UNCERTAIN")
    .sort((a, b) => {
      const priority = j => j.status === "SUBMISSION_UNCERTAIN" ? 0 : 1;
      return priority(a) - priority(b) ||
        (b.trackedDate || "").localeCompare(a.trackedDate || "");
    }).slice(0, 6);
  const parts = queue.map(j => {
    const item = node("div", "action-item");
    item.append(node("h3", "", j.employer + " · " + j.role),
      node("p", "action-kind", displayStatus(j.status)),
      node("p", "", j.nextAction || j.blocker || "Inspect tracker for next step"));
    return item;
  });
  ui.actionList.replaceChildren(...(parts.length ? parts : [node("p", "muted", "No blocked or uncertain records.")]));
}

function renderDaily() {
  const items = (snapshot.metrics?.days || []).slice(-7);
  const max = Math.max(1, ...items.map(x => x.count));
  const parts = items.map(day => {
    const row = node("div", "daily-row");
    const label = node("span", "", day.date.slice(5));
    const track = node("div", "bar");
    const fill = node("span");
    fill.style.width = (100 * day.count / max).toFixed(1) + "%";
    track.append(fill);
    row.append(label, track, node("strong", "", day.count));
    return row;
  });
  byId("daily-list").replaceChildren(...(parts.length ? parts : [node("p", "muted", "No recorded confirmation dates.")]));
}

function renderRuns() {
  const runs = snapshot.recentRuns.slice(0, 4);
  const elements = runs.map(r => {
    const item = node("div", "run-item");
    item.append(node("b", "", r.date || "Undated run"),
      node("span", "", [r.label, r.confirmed === null ? "" : r.confirmed + " confirmed in run"].filter(Boolean).join(" · ")));
    return item;
  });
  byId("runs-list").replaceChildren(...(elements.length ? elements : [node("p", "muted", "No run history yet.")]));
}

function render() {
  const m = snapshot.metrics || {};
  for (const [id, value] of Object.entries({
    total: m.applications, submitted: m.submitted, today: m.today,
    blocked: m.blocked, uncertain: m.uncertain
  })) byId(id).textContent = value ?? "—";
  byId("day-label").textContent = m.reportDay ? "(" + m.reportDay + ")" : "";
  renderJobs(); renderActions(); renderDaily(); renderRuns();
}

async function refresh() {
  ui.refresh.disabled = true;
  byId("sync-status").textContent = "Refreshing…";
  ui.dataError.hidden = true;
  try {
    const data = await api("/api/pipeline");
    if (!Array.isArray(data.items) || !data.metrics) throw new Error("Tracker returned invalid data");
    snapshot = data;
    render();
    document.querySelector(".live-indicator").classList.add("ok");
    byId("sync-status").textContent = "Synced " + new Date(data.fetchedAt).toLocaleString();
  } catch (error) {
    document.querySelector(".live-indicator").classList.remove("ok");
    byId("sync-status").textContent = "Sync unavailable";
    if (error.status === 401) showLogin("Session expired. Unlock again.");
    else {
      ui.dataError.textContent = error.message;
      ui.dataError.hidden = false;
    }
  } finally { ui.refresh.disabled = false; }
}

ui.loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const passphrase = ui.passphrase.value;
  byId("unlock-button").disabled = true;
  ui.loginError.hidden = true;
  try {
    await api("/api/session", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase })
    });
    ui.passphrase.value = "";
    showApp();
    await refresh();
  } catch (error) {
    showLogin(error.message);
  } finally { byId("unlock-button").disabled = false; }
});

ui.logout.addEventListener("click", async () => {
  try { await api("/api/session", { method: "DELETE" }); }
  finally {
    snapshot = { items: [], recentRuns: [], metrics: null };
    ui.jobList.replaceChildren();
    showLogin();
  }
});

ui.refresh.addEventListener("click", refresh);
ui.search.addEventListener("input", renderJobs);
document.querySelectorAll(".filter").forEach(button =>
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach(b => {
      const active = b === button;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    renderJobs();
  })
);

try {
  await api("/api/session");
  showApp();
  await refresh();
} catch (error) {
  showLogin(error.status === 503 ? error.message : "");
}
