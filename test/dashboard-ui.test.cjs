const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ui = require("../shared/dashboard.js");

const root = path.resolve(__dirname, "..");
const dashboards = ["email-action", "christian-jobs", "local-prospects", "job-rates", "jeep-watch"];
const config = name => JSON.parse(fs.readFileSync(path.join(root, "apps", name, "index.html"), "utf8").match(/<script id="dashboard-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const jobs = config("christian-jobs");
const email = config("email-action");
const state = { items: [], runs: 2, updatedAt: "2026-10-12T12:12:16.863Z" };
const response = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => value });

function harness(fetch, extra = {}) {
  const statuses = [], busy = [], rendered = [], pins = [];
  let clock = 0, storedPin = "fixture-pin";
  const reader = ui.createReader({
    fetch, readPin: () => storedPin, savePin: pin => pins.push(pin), clearPin: () => { storedPin = null; },
    requestPin: () => "fixture-pin", now: () => new Date(Date.UTC(2026, 9, 12, 20, 0, clock++)),
    onStatus: (kind, message) => statuses.push({ kind, message }), onBusy: value => busy.push(value),
    onState: (value, at) => rendered.push({ value, at }), ...extra,
  });
  return { reader, statuses, busy, rendered, pins, getStoredPin: () => storedPin };
}

test("all five standalone sites use synchronized shared assets and retain their display fields", () => {
  for (const name of dashboards) {
    const html = fs.readFileSync(path.join(root, "apps", name, "index.html"), "utf8");
    assert.match(html, /lang="en"/);
    assert.match(html, /DO NEXT/); assert.match(html, /NOTICE/); assert.match(html, /EXPLORE/);
    assert.match(html, /Successful syncs/); assert.match(html, /Last successful sync/);
    assert.match(html, /Checked at/); assert.match(html, /aria-live="polite"/);
    assert.equal(config(name).dashboard, name);
    assert.ok(config(name).cols.length >= 6);
    for (const file of ["dashboard.js", "dashboard.css"]) {
      assert.equal(fs.readFileSync(path.join(root, "apps", name, file), "utf8"), fs.readFileSync(path.join(root, "shared", file), "utf8"));
    }
  }
});

test("only supported assessments rank; an assessed zero precedes missing/malformed/other-version scores", () => {
  const items = [{ id: "unknown" }, { id: "zero", fitScore: 0, scoreVersion: 1 }, { id: "best", fitScore: 100, scoreVersion: 1 }, { id: "old", fitScore: 99, scoreVersion: 2 }];
  assert.deepEqual(items.slice().sort((a, b) => ui.compareItems(a, b, jobs)).map(i => i.id), ["best", "zero", "old", "unknown"]);
  for (const value of [null, "90", NaN, Infinity, -1, 101, 42.5]) assert.equal(ui.assessment({ fitScore: value, scoreVersion: 1 }, jobs), null);
  assert.equal(ui.assessment({ fitScore: 90, scoreVersion: "1" }, jobs), null);
  assert.equal(ui.assessment({ priority: 1 }, config("job-rates")), null);
  assert.equal(ui.assessment({ priority: "medium" }, email), "medium");
  assert.equal(ui.assessment({ priority: "urgent" }, email), null);
});

test("email order uses supplied priority, real deadlines, observation time and identity without mutating urgency", () => {
  const items = [{ id: "low", priority: "low", dueAt: "2026-10-01T00:00:00Z" }, { id: "unknown" }, { id: "late", priority: "high", dueAt: "2026-10-14T00:00:00Z" }, { id: "first", priority: "high", dueAt: "2026-10-13T00:00:00Z" }, { id: "missing", priority: "high", dueAt: "Tomorrow" }];
  const before = JSON.stringify(items);
  assert.deepEqual(items.slice().sort((a, b) => ui.compareItems(a, b, email)).map(i => i.id), ["first", "late", "missing", "low", "unknown"]);
  assert.equal(JSON.stringify(items), before);
  assert.equal(ui.instant("2026-10-13"), null);
  assert.equal(ui.instant("2026-02-30T00:00:00Z"), null);
  assert.equal(ui.instant("2026-10-13T00:00:00"), null);
  assert.equal(ui.instant("2026-10-13T00:00:00Z"), ui.instant("2026-10-12T20:00:00-04:00"));
});

test("tie breaks honor persistence time, missing dates last, endpoint identity and Unicode code-point order", () => {
  const items = [{ id: "z" }, { id: "old", lastSeenAt: "2026-10-12T00:00:00Z" }, { id: "b", lastSeenAt: "2026-10-13T00:00:00Z" }, { id: "a", lastSeenAt: "2026-10-13T00:00:00Z" }];
  assert.deepEqual(items.slice().sort((a, b) => ui.compareItems(a, b, jobs)).map(i => i.id), ["a", "b", "old", "z"]);
  assert.equal(ui.identity({ _key: "saved", id: "id", messageId: "message", url: "url" }), "saved");
  assert.equal(ui.identity({ id: "id", messageId: "message" }), "id:id");
  assert.equal(ui.identity({ messageId: "message", url: "url" }), "message:message");
  assert.equal(ui.identity({ url: "url", business: "name" }), "url:url");
  assert.equal(ui.identity({ business: "Holland Fence", location: "Axton, VA" }), "business:Holland Fence|Axton, VA");
  assert.equal(ui.identity({ employer: "Employer", role: "Role", location: "VA" }), "job:Employer|Role|VA");
  assert.equal(ui.identity({ vehicle: "Jeep", price: "$1", location: "VA" }), "vehicle:Jeep|VA|$1");
  assert.equal(ui.identity({ from: "Sender", subject: "Subject", received: "Today" }), "email:Sender|Subject|Today");
  assert.equal(ui.identity({ note: "x", firstSeenAt: "ignore", lastSeenAt: "ignore", seenCount: 10 }), 'fallback:{"note":"x"}');
  assert.ok(ui.codePointOrder("\uE000", "\u{10000}") < 0);
});

test("review queue requires explicit active status and supporting fields, excludes tests/closed/blocked rows, and preserves all records in EXPLORE", () => {
  const ready = { employer: "Employer", role: "Role", fit: "Source rationale", url: "https://example.test/role", status: "new", fitScore: 80, scoreVersion: 1 };
  const items = [ready, { ...ready, status: "closed", fitScore: 100 }, { ...ready, status: "blocked", fitScore: 100 }, { ...ready, status: undefined }, { ...ready, url: "javascript:alert(1)" }];
  assert.deepEqual(ui.reviewQueue(items, jobs), [ready]);
  assert.equal(ui.filterItems(items, "", "all", "all", jobs).length, 5);
  assert.equal(ui.reviewReady({ subject: "Bill", action: "Review bill", status: "new", messageId: "real-id" }, email), true);
  assert.equal(ui.reviewReady({ subject: "Test", action: "Review", status: "new", messageId: "id", category: "test" }, email), false);
  assert.equal(ui.reviewReady({ subject: "Bill", action: "Review", status: "new" }, email), false);
  assert.equal(ui.reviewReady({ business: "Business", workflow: "Intake", hypothesis: "Hypothesis", status: "new" }, config("local-prospects")), false);
});

test("EXPLORE searches arbitrary stored fields and filters missing status/unassessed records without hiding them by default", () => {
  const items = [{ id: "one", status: "new", fitScore: 0, scoreVersion: 1 }, { id: "two", notes: { detail: "Secret search phrase" } }, { id: "three", status: "closed" }];
  assert.deepEqual(ui.filterItems(items, "secret search", "all", "all", jobs), [items[1]]);
  assert.deepEqual(ui.filterItems(items, "", "missing", "unassessed", jobs), [items[1]]);
  assert.deepEqual(ui.filterItems(items, "", "new", "assessed", jobs), [items[0]]);
  assert.deepEqual(ui.filterItems([{ status: "missing" }, {}], "", "status:missing", "all", jobs), [{ status: "missing" }]);
  assert.equal(ui.safeURL("javascript:alert(1)"), null);
  assert.equal(ui.safeURL("data:text/html,test"), null);
  assert.equal(ui.safeURL("/relative"), null);
  assert.equal(ui.safeURL("https://example.test/role"), "https://example.test/role");
});

test("Refresh always reads with PIN and no-store; successful unchanged/empty reads advance only client checked time", async () => {
  const calls = [];
  const h = harness(async (url, opts) => { calls.push({ url, opts }); return response(structuredClone(state)); });
  await h.reader.load(); const firstCheck = h.reader.getCheckedAt();
  await h.reader.load();
  assert.equal(calls.length, 2);
  for (const { url, opts } of calls) { assert.equal(url, "/api/state"); assert.equal(opts.method, "GET"); assert.equal(opts.cache, "no-store"); assert.equal(opts.headers["x-dashboard-pin"], "fixture-pin"); assert.equal(opts.body, undefined); }
  assert.notEqual(h.reader.getCheckedAt(), firstCheck);
  assert.deepEqual(h.reader.getState(), state);
  assert.match(h.statuses.at(-1).message, /No changes/);
  assert.deepEqual(h.busy, [true, false, true, false]);
});

test("a later empty persisted sync is shown as a state change without claiming source results or rewriting run metadata", async () => {
  let calls = 0;
  const next = { ...state, runs: 3, updatedAt: "2026-10-13T00:00:00Z" };
  const h = harness(async () => response(calls++ ? next : state));
  await h.reader.load(); await h.reader.load();
  assert.deepEqual(h.reader.getState(), next);
  assert.match(h.statuses.at(-1).message, /Dashboard state changed/);
  assert.notEqual(h.reader.getCheckedAt(), next.updatedAt);
});

test("HTTP, network, malformed JSON and invalid envelopes retain last good data/check time and finish Refresh", async () => {
  const failures = [async () => response({}, 500), async () => { throw Error("private error body"); }, async () => ({ ok: true, status: 200, json: async () => { throw Error("private JSON error"); } }), async () => response({ ...state, items: [null] }), async () => response({ ...state, updatedAt: "Yesterday" })];
  for (const fail of failures) {
    let once = true;
    const h = harness((...args) => { if (once) { once = false; return Promise.resolve(response(state)); } return fail(...args); });
    await h.reader.load(); const at = h.reader.getCheckedAt();
    await h.reader.load();
    assert.deepEqual(h.reader.getState(), state); assert.equal(h.reader.getCheckedAt(), at);
    assert.equal(h.statuses.at(-1).kind, "error"); assert.match(h.statuses.at(-1).message, /Last checked data/);
    assert.doesNotMatch(h.statuses.at(-1).message, /private/); assert.equal(h.busy.at(-1), false);
  }
});

test("wrong PIN clears saved PIN without auto retry; cancelled initial PIN never fetches or claims zero results", async () => {
  let calls = 0, prompts = 0;
  const h = harness(async () => { calls++; return response({}, 401); }, { requestPin: () => { prompts++; return "new-pin"; } });
  await h.reader.load();
  assert.equal(h.getStoredPin(), null); assert.equal(calls, 1); assert.equal(prompts, 0);
  assert.equal(h.reader.getCheckedAt(), null); assert.equal(h.reader.getState(), null);
  await h.reader.load(); assert.equal(prompts, 1); assert.equal(calls, 2);
  const cancelled = harness(async () => { throw Error("must not fetch"); }, { readPin: () => "", requestPin: () => null });
  await cancelled.reader.load(); assert.equal(cancelled.reader.getState(), null); assert.equal(cancelled.reader.getCheckedAt(), null);
  assert.match(cancelled.statuses.at(-1).message, /cancelled/); assert.equal(cancelled.busy.at(-1), false);
});

test("concurrent refresh clicks share one in-flight GET; timed-out reads do not retry", async () => {
  let finish, calls = 0;
  const h = harness(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
  const first = h.reader.load(); await h.reader.load(); assert.equal(calls, 1);
  finish(response(state)); await first;
  const timed = harness((url, opts) => new Promise((resolve, reject) => { calls++; opts.signal.addEventListener("abort", () => reject(Error("abort"))); }), { timeoutMs: 1 });
  await timed.reader.load(); assert.equal(calls, 2); assert.match(timed.statuses.at(-1).message, /timed out/); assert.equal(timed.busy.at(-1), false);
});

test("unavailable local storage does not prevent an authorized read", async () => {
  const unavailable = () => { throw Error("storage unavailable"); };
  const h = harness(async () => response(state), { readPin: unavailable, savePin: unavailable });
  await h.reader.load(); assert.deepEqual(h.reader.getState(), state); assert.equal(h.statuses.at(-1).kind, "success");
});
