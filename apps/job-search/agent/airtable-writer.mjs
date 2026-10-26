import {
  BASE_ID, TABLES, findExisting, safeFields, diffFields, eventSpec, runFields
} from "./protocol.mjs";

/**
 * Airtable REST v0 write adapter. Default callers run in dry-run; no server-side
 * endpoint is exposed by this module. Each HTTP result is checked once.
 * An uncertain provider response is never retried automatically.
 */
export class Airtable {
  constructor({ token, fetchImpl = fetch, baseId = BASE_ID } = {}) {
    if (!token || typeof token !== "string") throw new Error("Scoped Airtable token required");
    this.token = token; this.fetch = fetchImpl; this.baseId = baseId;
  }
  async request(table, method = "GET", body, search) {
    const url = new URL("https://api.airtable.com/v0/" + this.baseId + "/" + table);
    if (search) for (const [key, value] of Object.entries(search)) url.searchParams.set(key, value);
    let response;
    try {
      response = await this.fetch(url, {
        method,
        headers: {
          Authorization: "Bearer " + this.token,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {})
        },
        ...(body ? {body: JSON.stringify(body)} : {}),
        signal: AbortSignal.timeout(12000)
      });
    } catch {
      throw new Error("Airtable network outcome uncertain; no automatic retry permitted");
    }
    if (!response.ok) {
      // Even 409/429/500 results should be reconciled by re-reading before any
      // further mutation; do not automatically repeat a create/upsert.
      throw new Error("Airtable HTTP " + response.status +
        ": stop, inspect destination before manually resuming");
    }
    const data = await response.json();
    if (!data || typeof data !== "object")
      throw new Error("Unexpected Airtable response; status uncertain");
    return data;
  }
  async list(table) {
    const result = [];
    let offset = null;
    for (let i = 0; i < 30; i++) {
      const data = await this.request(table, "GET", undefined,
        {pageSize: "100", ...(offset ? {offset} : {})});
      if (!Array.isArray(data.records)) throw new Error("Airtable listing missing records");
      result.push(...data.records);
      if (!data.offset) return result;
      offset = data.offset;
    }
    throw new Error("Pagination exceeded 30 pages; refusing partial duplicate scan");
  }
  async merge(table, fields, mergeName) {
    const response = await this.request(table, "PATCH", {
      performUpsert: {fieldsToMergeOn: [mergeName]},
      typecast: false, records: [{fields}]
    });
    if (response.records?.length !== 1 || !response.records[0].id)
      throw new Error("Airtable upsert status uncertain; inspect before retrying");
    return response.records[0];
  }
}

const cmp = (a, b) => JSON.stringify(Object.fromEntries(Object.entries(a).sort())) ===
  JSON.stringify(Object.fromEntries(Object.entries(b).sort()));

function eventRecord(existingEvents, eventFields) {
  const id = eventFields["Event ID"];
  const candidates = existingEvents.filter(e => e.fields?.["Event ID"] === id);
  if (candidates.length > 1) throw new Error("Duplicate event IDs already exist; stop and reconcile");
  if (!candidates.length) return null;
  if (!cmp(candidates[0].fields, eventFields))
    throw new Error("Existing event ID has conflicting contents; append-only integrity failure");
  return candidates[0];
}

/**
 * Optional injected read state supports deterministic unit tests. Actual write
 * mode ALWAYS rereads destination before mutating, making stale plans inapplicable.
 */
export async function syncApplication(client, job, runId, localDate, {
  apply = false, state = null
} = {}) {
  if (!runId || typeof runId !== "string") throw new Error("Unique source runId required");
  if (apply && state) throw new Error("Cannot apply with injected/stale data");
  const rows = state?.applications || await client.list(TABLES.applications);
  const existing = findExisting(rows, job);
  const desired = safeFields(job, existing, localDate);
  const changed = diffFields(existing, desired);
  const operation = existing
    ? Object.keys(changed).length ? "update" : "unchanged"
    : "create";
  const key = desired["Application Key"];
  const event = eventSpec(job, key, runId, localDate);
  if (!apply) return {applied: false, action: operation, applicationKey: key,
    status: job.status, changedFields: Object.keys(changed), eventId: event["Event ID"]};
  if (operation === "unchanged")
    return {applied: true, action: "unchanged", applicationKey: key,
      status: job.status, event: "skipped"};
  // Require a fresh read after the previous planning call; cannot trust cached records.
  // The Airtable merge-on-key operation protects serial duplicate submission logs.
  const saved = await client.merge(TABLES.applications, desired, "Application Key");
  const verificationRows = await client.list(TABLES.applications);
  const verified = findExisting(verificationRows, job);
  if (!verified || verified.id !== saved.id ||
      diffFields(verified, desired)["Current Status"] !== undefined)
    throw new Error("Post-write application readback uncertain; do not retry automatically");
  const events = await client.list(TABLES.events);
  if (!eventRecord(events, event)) {
    await client.merge(TABLES.events, event, "Event ID");
    const post = await client.list(TABLES.events);
    if (!eventRecord(post, event))
      throw new Error("Event write unverified; do not retry automatically");
  }
  return {applied: true, action: operation, applicationKey: key,
    status: job.status, event: "verified"};
}

export async function syncRun(client, run, localDate, { apply = false } = {}) {
  const desired = runFields(run, localDate);
  const rows = await client.list(TABLES.runs);
  const matches = rows.filter(r => r.fields?.["Run ID"] === desired["Run ID"]);
  if (matches.length > 1) throw new Error("Duplicate Run ID exists");
  const old = matches[0] || null;
  const delta = diffFields(old, desired);
  if (!apply) return {applied: false, action: old
    ? Object.keys(delta).length ? "update" : "unchanged" : "create", runId: run.id,
    changedFields: Object.keys(delta)};
  if (old && !Object.keys(delta).length)
    return {applied: true, action: "unchanged", runId: run.id};
  const saved = await client.merge(TABLES.runs, desired, "Run ID");
  const check = await client.list(TABLES.runs);
  if (check.filter(r => r.fields?.["Run ID"] === desired["Run ID"] &&
    r.id === saved.id).length !== 1)
    throw new Error("Run write unverified; no blind retry");
  return {applied: true, action: old ? "update" : "create", runId: run.id};
}
