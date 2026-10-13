/* Canonical shared UI. Run npm run sync:dashboards after editing this file. */
(function (root) {
  "use strict";

  const ACTIVE = new Set(["new", "open", "active", "pending", "unresolved", "todo", "needs-action", "action-required"]);
  const PRIORITIES = ["high", "medium", "low"];
  const text = value => value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  const escape = value => text(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const status = item => typeof item.status === "string" ? item.status.trim().toLowerCase() : "";
  const present = value => typeof value === "string" && value.trim().length > 0;

  function instant(value) {
    if (typeof value !== "string") return null;
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
    if (!m) return null;
    const [, year, month, day, hour, minute, second] = m.map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month < 1 || month > 12 || day < 1 || day > days[month - 1] || hour > 23 || minute > 59 || second > 59) return null;
    const result = Date.parse(value);
    return Number.isFinite(result) ? result : null;
  }

  function stable(value) {
    if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`;
    return JSON.stringify(value);
  }

  function identity(item) {
    if (item._key) return String(item._key);
    if (item.id) return `id:${item.id}`;
    if (item.messageId) return `message:${item.messageId}`;
    if (item.url) return `url:${item.url}`;
    if (item.business) return `business:${item.business}|${item.location ?? ""}`;
    if (item.employer && item.role) return `job:${item.employer}|${item.role}|${item.location ?? ""}`;
    if (item.vehicle) return `vehicle:${item.vehicle}|${item.location ?? ""}|${item.price ?? ""}`;
    if (item.from && item.subject) return `email:${item.from}|${item.subject}|${item.received ?? ""}`;
    const copy = { ...item };
    for (const k of ["_key", "firstSeenAt", "lastSeenAt", "seenCount"]) delete copy[k];
    return `fallback:${stable(copy)}`;
  }

  function codePointOrder(a, b) {
    const left = Array.from(a), right = Array.from(b);
    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      const difference = left[i].codePointAt(0) - right[i].codePointAt(0);
      if (difference) return difference;
    }
    return left.length - right.length;
  }

  function assessment(item, config) {
    if (config.dashboard === "email-action") return PRIORITIES.includes(item.priority) ? item.priority : null;
    const score = item[config.scoreField];
    return item.scoreVersion === 1 && Number.isInteger(score) && score >= 0 && score <= 100 ? score : null;
  }

  function compareItems(a, b, config) {
    const left = assessment(a, config), right = assessment(b, config);
    if (config.dashboard === "email-action") {
      const rank = p => p == null ? 3 : PRIORITIES.indexOf(p);
      const difference = rank(left) - rank(right);
      if (difference) return difference;
      const due = (instant(a.dueAt) ?? Infinity) - (instant(b.dueAt) ?? Infinity);
      if (due && !Number.isNaN(due)) return due;
    } else {
      if (left == null && right != null) return 1;
      if (left != null && right == null) return -1;
      if (left != null && right != null && left !== right) return right - left;
    }
    const seen = (instant(b.lastSeenAt) ?? -Infinity) - (instant(a.lastSeenAt) ?? -Infinity);
    if (seen && !Number.isNaN(seen)) return seen;
    return codePointOrder(identity(a), identity(b));
  }

  function safeURL(value) {
    if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return null;
    try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; }
    catch { return null; }
  }

  function reviewReady(item, config) {
    // An absent/default status is not evidence of an unresolved action.
    if (!ACTIVE.has(status(item))) return false;
    if (config.dashboard === "email-action") return present(item.subject) && present(item.action)
      && (present(item.messageId) || !!safeURL(item.url)) && !/\btest\b/i.test(text(item.category));
    if (config.dashboard === "local-prospects") return present(item.business) && present(item.location) && present(item.workflow) && present(item.hypothesis);
    if (config.dashboard === "jeep-watch") return present(item.vehicle) && !!safeURL(item.url) && present(item.condition);
    return present(item.employer) && present(item.role) && !!safeURL(item.url) && present(item.fit);
  }

  function reviewQueue(items, config) {
    return items.filter(item => reviewReady(item, config)).slice().sort((a, b) => compareItems(a, b, config));
  }

  function filterItems(items, query, selectedStatus, selectedAssessment, config) {
    const q = query.trim().toLowerCase();
    return items.filter(item => (!q || text(item).toLowerCase().includes(q))
      && (selectedStatus === "all" || (selectedStatus === "missing" ? !status(item) : status(item) === selectedStatus.replace(/^status:/, "")))
      && (selectedAssessment === "all" || (selectedAssessment === "assessed") === (assessment(item, config) != null)));
  }

  function validState(value) {
    return value && typeof value === "object" && !Array.isArray(value) && Array.isArray(value.items)
      && value.items.every(item => item && typeof item === "object" && !Array.isArray(item))
      && Number.isSafeInteger(value.runs) && value.runs >= 0
      && (value.updatedAt === null || instant(value.updatedAt) != null);
  }

  function createReader(options) {
    let saved = null, checkedAt = null, busy = false, pin = "";
    try { pin = options.readPin() || ""; } catch { /* Storage may be unavailable. */ }
    const stale = () => saved ? " Last checked data remains visible." : " Dashboard data has not been loaded.";
    return {
      getState: () => saved,
      getCheckedAt: () => checkedAt,
      async load() {
        if (busy) return;
        busy = true;
        options.onBusy(true);
        options.onStatus("info", "Refreshing saved dashboard…");
        const controller = new AbortController();
        let timer;
        try {
          if (!pin) pin = options.requestPin() || "";
          if (!pin) { options.onStatus("info", "Refresh cancelled." + stale()); return; }
          timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);
          const response = await options.fetch("/api/state", {
            method: "GET", cache: "no-store", headers: { "x-dashboard-pin": pin }, signal: controller.signal,
          });
          if (response.status === 401) {
            pin = "";
            try { options.clearPin(); } catch { /* Do not mask the auth failure. */ }
            options.onStatus("error", "PIN not accepted. Refresh to enter it again." + stale());
            return;
          }
          if (!response.ok) { options.onStatus("error", `Refresh failed (HTTP ${response.status}).` + stale()); return; }
          let next;
          try { next = await response.json(); }
          catch { options.onStatus("error", "Dashboard returned an unreadable state." + stale()); return; }
          if (!validState(next)) { options.onStatus("error", "Dashboard returned an invalid state." + stale()); return; }
          const same = saved != null && stable(saved) === stable(next);
          const initial = saved == null;
          saved = next;
          checkedAt = options.now().toISOString();
          try { options.savePin(pin); } catch { /* Still permit a successful read. */ }
          options.onState(saved, checkedAt);
          options.onStatus("success", initial ? "Dashboard loaded." : same ? "Refresh complete. No changes since last check." : "Refresh complete. Dashboard state changed.");
        } catch {
          options.onStatus("error", (controller.signal.aborted ? "Refresh timed out." : "Refresh failed. Check your connection and try again.") + stale());
        } finally {
          clearTimeout(timer);
          busy = false;
          options.onBusy(false);
        }
      },
    };
  }

  function mount(config) {
    const byId = id => document.getElementById(id);
    let state = null;
    const labels = { _key: "Record identity", firstSeenAt: "First persisted", lastSeenAt: "Last observed by persistence", seenCount: "Observation count", originallyObservedAt: "Originally observed", backfilled: "Historical import", dueAt: "Action deadline", postedAt: "Source posting time", fitScore: "Fit score", priorityScore: "Priority score", scoreVersion: "Score version", hourlyRateMin: "Hourly minimum", hourlyRateMax: "Hourly maximum", priceAmount: "Asking price (USD)", distanceMiles: "Distance (miles)" };
    const badge = item => {
      const value = assessment(item, config);
      return value == null ? (config.dashboard === "email-action" ? "Unprioritized" : "Unscored") : typeof value === "number" ? `${config.scoreLabel}: ${value}/100` : `${value[0].toUpperCase()}${value.slice(1)} priority`;
    };
    const title = item => config.titleFields.map(k => text(item[k])).filter(Boolean).join(" — ") || "Untitled record";
    const valueHTML = (key, value) => key === "url" && safeURL(value)
      ? `<a href="${escape(safeURL(value))}" target="_blank" rel="noopener noreferrer">Open source ↗</a>`
      : escape(text(value) || "—");

    function renderExplore() {
      if (!state) return;
      const filtered = filterItems(state.items, byId("search").value, byId("status-filter").value, byId("assessment-filter").value, config);
      byId("result-count").textContent = `${filtered.length} of ${state.items.length} records`;
      byId("rows").innerHTML = filtered.map(item => {
        const index = state.items.indexOf(item);
        const cells = config.cols.map(([key, label]) => `<td data-label="${escape(label)}">${key === "status" ? escape(text(item.status) || "Not supplied") : valueHTML(key, item[key])}</td>`).join("");
        const details = Object.entries(item).map(([key, value]) => `<dt>${escape(labels[key] || config.cols.find(c => c[0] === key)?.[1] || key)}</dt><dd>${valueHTML(key, value)}</dd>`).join("");
        return `<tr id="record-${index}">${cells}<td data-label="Record details"><span class="badge">${escape(badge(item))}</span>${item.backfilled === true ? '<span class="badge imported">Historical import</span>' : ""}<details><summary>All stored fields</summary><dl>${details}</dl></details></td></tr>`;
      }).join("");
      byId("empty").hidden = filtered.length > 0;
      byId("empty").textContent = state.items.length ? "No records match these filters." : "No saved records yet.";
    }

    function render() {
      if (!state) return;
      const items = state.items, queue = reviewQueue(items, config);
      byId("count").textContent = items.length;
      byId("new-count").textContent = items.filter(item => status(item) === "new").length;
      byId("runs").textContent = state.runs;
      byId("updated").textContent = state.updatedAt ? new Date(state.updatedAt).toLocaleString() : "Not synced";
      byId("queue-count").textContent = queue.length ? `Showing ${Math.min(3, queue.length)} of ${queue.length} records to review` : "No review-ready records";
      const card = item => {
        const index = items.indexOf(item);
        const detail = text(item[config.summaryField] || (config.dashboard === "jeep-watch" ? item.condition : ""));
        const due = instant(item.dueAt);
        return `<article class="review-card"><div class="badges"><span class="badge">${escape(badge(item))}</span>${item.backfilled === true ? '<span class="badge imported">Historical import</span>' : ""}</div><h3>${escape(title(item))}</h3><p>${escape(detail)}</p>${config.dashboard === "email-action" && due != null ? `<p class="deadline">Action deadline: ${escape(new Date(due).toLocaleString())}</p>` : ""}<a class="review-link" href="#record-${index}" data-record="${index}">Review record <span aria-hidden="true">→</span></a></article>`;
      };
      const shown = queue.slice(0, 3);
      const groups = config.dashboard === "email-action" ? [...PRIORITIES, null] : ["assessed", null];
      byId("queue").innerHTML = groups.map(group => {
        const members = shown.filter(item => config.dashboard === "email-action" ? assessment(item, config) === group : (assessment(item, config) != null) === (group !== null));
        const label = group === null ? (config.dashboard === "email-action" ? "Unprioritized records" : "Unscored records")
          : config.dashboard === "email-action" ? `${group[0].toUpperCase()}${group.slice(1)} priority` : "Assessed records";
        return members.length ? `<div class="review-group"><h3 class="group-label">${escape(label)}</h3><div class="review-grid">${members.map(card).join("")}</div></div>` : "";
      }).join("");
      byId("queue-empty").hidden = queue.length > 0;
      byId("notice-assessed").textContent = items.filter(item => assessment(item, config) != null).length;
      byId("notice-unassessed").textContent = items.filter(item => assessment(item, config) == null).length;
      byId("notice-imported").textContent = items.filter(item => item.backfilled === true).length;
      byId("notice-unassessed-label").textContent = config.dashboard === "email-action" ? "Unprioritized" : "Unscored";
      const selected = byId("status-filter").value;
      const statuses = [...new Set(items.map(status).filter(Boolean))].sort(codePointOrder);
      byId("status-filter").innerHTML = '<option value="all">All statuses</option><option value="missing">Status not supplied</option>' + statuses.map(s => `<option value="status:${escape(s)}">${escape(s)}</option>`).join("");
      byId("status-filter").value = [...byId("status-filter").options].some(o => o.value === selected) ? selected : "all";
      renderExplore();
    }

    const reader = createReader({
      fetch: (...args) => window.fetch(...args), now: () => new Date(),
      readPin: () => localStorage.getItem("dashboardPin"), savePin: pin => localStorage.setItem("dashboardPin", pin), clearPin: () => localStorage.removeItem("dashboardPin"),
      requestPin: () => window.prompt("Dashboard PIN"),
      onBusy: busy => { byId("refresh").disabled = busy; byId("refresh").textContent = busy ? "Refreshing…" : "Refresh"; byId("dashboard-content").setAttribute("aria-busy", String(busy)); },
      onStatus: (kind, message) => { byId("refresh-status").dataset.kind = kind; byId("refresh-status").textContent = message; },
      onState: (next, at) => { state = next; byId("checked").dateTime = at; byId("checked").textContent = new Date(at).toLocaleString(); render(); },
    });
    for (const id of ["search", "status-filter", "assessment-filter"]) byId(id).addEventListener(id === "search" ? "input" : "change", renderExplore);
    byId("refresh").addEventListener("click", () => reader.load());
    byId("queue").addEventListener("click", event => {
      const link = event.target.closest("a[data-record]");
      if (!link) return;
      event.preventDefault();
      byId("search").value = ""; byId("status-filter").value = "all"; byId("assessment-filter").value = "all";
      renderExplore();
      const row = byId(`record-${link.dataset.record}`);
      row?.querySelector("details")?.setAttribute("open", "");
      const summary = row?.querySelector("summary");
      summary?.focus();
      row?.scrollIntoView({ block: "start" });
    });
    reader.load();
    return reader;
  }

  const api = { instant, stable, identity, codePointOrder, assessment, compareItems, safeURL, reviewReady, reviewQueue, filterItems, validState, createReader, mount };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else {
    root.Dashboarda = api;
    const config = document.getElementById("dashboard-config");
    if (config) mount(JSON.parse(config.textContent));
  }
})(typeof window !== "undefined" ? window : globalThis);
