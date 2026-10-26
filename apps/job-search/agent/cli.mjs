#!/usr/bin/env node
/**
 * Explicitly operator-invoked CLI for an agent environment that supports Node.
 * It is NOT part of the public Dashboarda Functions/routes.
 *
 * node agent/cli.mjs job-run.json                    # read-only preview
 * JOB_SEARCH_AGENT_WRITE_ENABLED=1 node agent/cli.mjs job-run.json --apply
 */
import { readFile } from "node:fs/promises";
import { Airtable, syncApplication, syncRun } from "./airtable-writer.mjs";

function easternToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());
}
function fail(message) {
  console.error("JS-03 stopped: " + message);
  process.exitCode = 1;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.length > 2 || args.some(x => x.startsWith("-") && x !== "--apply"))
    throw new Error("Usage: node agent/cli.mjs /private/job-run.json [--apply]");
  const apply = args.includes("--apply");
  if (apply && process.env.JOB_SEARCH_AGENT_WRITE_ENABLED !== "1")
    throw new Error("Write gated: set JOB_SEARCH_AGENT_WRITE_ENABLED=1 only after review");
  const file = args.find(x => x !== "--apply");
  const payload = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(payload.applications) || payload.applications.length > 15)
    throw new Error("Expect at most 15 applicant applications in one bounded batch");
  if (typeof payload.runId !== "string" || !payload.runId.trim())
    throw new Error("Every batch requires a stable source runId");
  const date = payload.localDate || easternToday();
  const token = apply
    ? process.env.AIRTABLE_JOB_SEARCH_WRITE_TOKEN
    : process.env.AIRTABLE_JOB_SEARCH_READ_TOKEN;
  if (!token) throw new Error("Missing scoped Airtable token");
  const client = new Airtable({token});
  let changed = 0;
  for (const job of payload.applications) {
    // One source job at a time; failure stops the batch. No retry loops.
    const result = await syncApplication(client, job, payload.runId, date, {apply});
    if (result.action !== "unchanged") changed++;
    // No application-specific screening answers or protected details in stdout.
    console.log(JSON.stringify({
      applicationKey: result.applicationKey,
      status: result.status,
      action: result.action, applied: result.applied,
      event: result.event || "not-written",
      changedFields: apply ? undefined : result.changedFields
    }));
  }
  if (payload.run) {
    const result = await syncRun(client, {...payload.run, id: payload.runId}, date, {apply});
    console.log(JSON.stringify({runId: result.runId, action: result.action, applied: result.applied}));
  }
  console.log(JSON.stringify({mode: apply ? "APPLY" : "DRY_RUN", proposed: changed,
    count: payload.applications.length,
    message: apply ? "Verify destination and Library backup before any agent cutover"
      : "No writes performed; this does not authorize agent cutover"}));
}
try { await main(); } catch (err) { fail(String(err?.message || err)); }
