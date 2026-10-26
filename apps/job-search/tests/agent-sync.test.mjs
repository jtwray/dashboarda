import test from "node:test";
import assert from "node:assert/strict";
import {
  STATUS, TABLES, canonicalUrl, findExisting, safeFields, diffFields,
  eventSpec, runFields, stableKey
} from "../agent/protocol.mjs";
import { Airtable, syncApplication, syncRun } from "../agent/airtable-writer.mjs";

const sourceJob = (overrides = {}) => ({
  employer: "Example Systems",
  role: "Frontend Engineer",
  postingUrl: "https://jobs.example.test/example-systems/12345?source=chat#top",
  requisition: "12345",
  status: STATUS.prepared,
  trackedDate: "2026-10-26",
  resumeDocx: "file_ref_123",
  source: "Verified local agent fixture",
  ...overrides
});

function mockAirtable({failWrites = false} = {}) {
  const store = Object.fromEntries(Object.values(TABLES).map(id => [id, []]));
  let serial = 1, writes = 0, reads = 0;
  const mockFetch = async (url, opts) => {
    const id = new URL(url).pathname.split("/").at(-1);
    const rows = store[id];
    if (!rows) return {ok: false, status: 404};
    if (opts.method === "GET") {
      reads++;
      return {ok: true, json: async () => ({records: structuredClone(rows)})};
    }
    writes++;
    if (failWrites) throw new Error("Lost connection after write");
    const body = JSON.parse(opts.body);
    const fields = body.records[0].fields;
    const key = body.performUpsert.fieldsToMergeOn[0];
    let match = rows.find(item => item.fields[key] === fields[key]);
    if (!match) {
      match = {id: "rec" + String(serial++).padStart(14,"0"), fields: {}};
      rows.push(match);
    }
    Object.assign(match.fields, fields);
    return {ok: true, json: async () => ({records: [structuredClone(match)]})};
  };
  return {store, mockFetch, stats: () => ({writes, reads})};
}

test("canonical posting ID excludes tracking params and fragment", () => {
  assert.equal(canonicalUrl("HTTPS://EXAMPLE.COM/a/b/?utm_campaign=abc#x"), "https://example.com/a/b");
  assert.equal(canonicalUrl("javascript:alert(1)"), "");
  assert.equal(stableKey(sourceJob()), stableKey(sourceJob({postingUrl:"https://jobs.example.test/example-systems/12345"})));
});

test("legacy imported application identified by its URL and requisition", () => {
  const row = {id:"rec1", fields:{
    "Application Key":"ExampleSystems_Frontend_Engineer",
    Employer:"Example Systems", Requisition:"12345",
    "Posting URL":"https://jobs.example.test/example-systems/12345"
  }};
  assert.equal(findExisting([row], sourceJob())?.id, "rec1");
  assert.throws(() => findExisting([row,{...row,id:"rec2"}],sourceJob()), /Ambiguous/);
});

test("conservative confirmed and uncertain transitions", () => {
  const submitted = {fields:{
    "Application Key":"original", "Current Status":STATUS.confirmed,
    "Confirmation Evidence":"Observed receipt", "Submission Date":"2026-10-25"
  }};
  assert.throws(() => safeFields(sourceJob(), submitted, "2026-10-26"), /demote/);
  const same = safeFields(sourceJob({
    status:STATUS.confirmed, submissionDate:"2026-10-26", confirmationEvidence:"Other observation"
  }),submitted,"2026-10-26");
  assert.equal(same["Confirmation Evidence"],"Observed receipt");
  assert.equal(same["Submission Date"],"2026-10-25");
  const uncertain={fields:{"Application Key":"original","Current Status":STATUS.uncertain}};
  assert.throws(() => safeFields(sourceJob({status:STATUS.confirmed,
    submissionDate:"2026-10-26",confirmationEvidence:"thanks"}),uncertain,"2026-10-26"),/reconciled/);
  assert.throws(() => safeFields(sourceJob({status:STATUS.confirmed,
    submissionDate:"2026-10-26",confirmationEvidence:"thanks",
    reconciliation:{reviewedByApplicant:true}}),uncertain,"2026-10-26"),/reconciliation evidence/);
});

test("never write a confirmed status without evidence or actual date", () => {
  assert.throws(() => safeFields(sourceJob({status:STATUS.confirmed}), null, "2026-10-26"),/requires observed evidence/);
  assert.throws(() => safeFields(sourceJob({status:STATUS.confirmed,
    confirmationEvidence:"Observed on official ATS confirmation",submissionDate:"bad"}),null,"2026-10-26"),/requires observed evidence/);
});

test("unknown private inputs are never copied into fields or events", () => {
  const job = sourceJob({
    optionalDisabilityAnswer:"PRIVATE", criminalHistory:"PRIVATE", password:"PRIVATE",
    medicalNotes:"PRIVATE", backgroundCheck:"PRIVATE"
  });
  const f = safeFields(job, null, "2026-10-26");
  const event = eventSpec(job, f["Application Key"],"run1","2026-10-26");
  assert.equal(JSON.stringify({f,event}).includes("PRIVATE"),false);
  assert.equal(f["Resume DOCX Reference"],"file_ref_123");
  assert.equal(f["Posting URL"],"https://jobs.example.test/example-systems/12345");
});

test("dry-run does not send any write; duplicate plan is no-op", async () => {
  const f = mockAirtable();
  const client = new Airtable({token:"test",fetchImpl:f.mockFetch});
  const first=await syncApplication(client,sourceJob(),"r1","2026-10-26");
  assert.equal(first.action,"create");
  assert.equal(first.applied,false);
  assert.equal(f.stats().writes,0);
});

test("new record is verified, event recorded, replay creates nothing new", async () => {
  const fake = mockAirtable();
  const client = new Airtable({token:"test",fetchImpl:fake.mockFetch});
  const job=sourceJob({status: STATUS.confirmed,confirmationEvidence:"Receipt received",
    submissionDate:"2026-10-26"});
  const first = await syncApplication(client,job,"r01","2026-10-26",{apply:true});
  assert.equal(first.event,"verified");
  assert.equal(first.action,"create");
  assert.equal(fake.store[TABLES.applications].length,1);
  assert.equal(fake.store[TABLES.events].length,1);
  const writes=fake.stats().writes;
  const second = await syncApplication(client,job,"r01","2026-10-26",{apply:true});
  assert.equal(second.action,"unchanged");
  assert.equal(fake.stats().writes,writes);
});

test("failed uncertain write is not retried", async () => {
  const fake = mockAirtable({failWrites:true});
  const client = new Airtable({token:"test",fetchImpl:fake.mockFetch});
  await assert.rejects(() => syncApplication(client,sourceJob(),"r01","2026-10-26",{apply:true}),/outcome uncertain/);
  assert.equal(fake.stats().writes,1);
});

test("stable run IDs are upserted, never duplicated", async () => {
  const fake = mockAirtable();
  const client = new Airtable({token:"test",fetchImpl:fake.mockFetch});
  const run = {id:"r42",screened:7,prepared:2,attempted:1,confirmed:0};
  const first = await syncRun(client,run,"2026-10-26",{apply:true});
  assert.equal(first.action,"create");
  const n=fake.stats().writes;
  const second=await syncRun(client,run,"2026-10-26",{apply:true});
  assert.equal(second.action,"unchanged");
  assert.equal(fake.store[TABLES.runs].length,1);
  assert.equal(fake.stats().writes,n);
  assert.throws(()=>runFields({id:"rbad",screened:-1},"2026-10-26"),/Invalid nonnegative/);
});
