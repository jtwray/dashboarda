import type { Config } from "@netlify/functions";
import { env, json, hasSession, unauthorized } from "../../lib/auth.mts";
import { normalizeApplication, normalizeRun, summarize } from "../../lib/normalize.mjs";

const APPLICATIONS_TABLE = "tblQeAuDdLClWUXq8";
const RUNS_TABLE = "tbl5YzalPrS2fkY0I";
const BASE = "appsqe7i9ZeXspE0t";
const MAX_PAGES = 30;

async function fetchTable(table: string, token: string) {
  const records: any[] = [];
  let offset: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL("https://api.airtable.com/v0/" + BASE + "/" + table);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url, {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) throw new Error("Airtable read failed with status " + r.status);
    const data = await r.json();
    if (!Array.isArray(data.records)) throw new Error("Invalid Airtable response");
    records.push(...data.records);
    if (!data.offset) return records;
    offset = data.offset;
  }
  throw new Error("Airtable pagination cap reached; refusing partial counts");
}

export default async function handler(req: Request) {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  if (!hasSession(req)) return unauthorized();
  const token = env("AIRTABLE_JOB_SEARCH_READ_TOKEN");
  if (!token) return json({ error: "Airtable read access is not configured." }, 503);
  try {
    const [jobs, runs] = await Promise.all([
      fetchTable(APPLICATIONS_TABLE, token),
      fetchTable(RUNS_TABLE, token)
    ]);
    const applications = jobs.map(normalizeApplication);
    const runRecords = runs.map(normalizeRun);
    return json({
      items: applications,
      recentRuns: runRecords.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
      metrics: summarize(applications, runRecords),
      fetchedAt: new Date().toISOString(),
      origin: "Airtable / Employment Pipeline",
      readonly: true
    });
  } catch (err) {
    console.error("Employment dashboard read failed", String(err).replace(/Bearer\s+\S+/gi, "[redacted]"));
    return json({ error: "Could not load verified tracker records. Retry later." }, 502);
  }
}

export const config: Config = { path: "/api/pipeline" };
