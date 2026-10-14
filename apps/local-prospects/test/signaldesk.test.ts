import {test} from 'node:test';
import assert from 'node:assert/strict';
import {airtableClient} from '../signaldesk/airtable.ts';
import {mapProspect, syncProspects, SyncError, type Fields, type AirtableRecord} from '../signaldesk/sync.ts';
import {run, type Runtime} from '../signaldesk/runner.ts';

const prospect = (i=0) => ({_key:`business:Example ${i}|VA`, business:`Example ${i}`, location:'VA', workflow:'Appointment intake', hypothesis:'Connect intake to scheduling', phone:'555-0100', status:'new', firstSeenAt:'2026-10-13T00:00:00Z', lastSeenAt:'2026-10-14T00:00:00Z'});
function memory(initial: AirtableRecord[] = []) {
  const records = initial;
  const batches: Fields[][] = [];
  return {records, batches, async list(){return records;}, async upsert(fields: Fields[]) {
    batches.push(fields);
    for (const f of fields) {
      const existing = records.find(r=>r.fields['External ID'] === f['External ID']);
      if (existing) Object.assign(existing.fields, f);
      else records.push({id:`rec${records.length}`,fields:{...f}});
    }
  }};
}
function http(responses: (Response | Error)[]) {
  const calls: {url:string; init?:RequestInit}[]=[];
  const waits:number[]=[];
  let clock=0;
  const client=airtableClient({token:'secret-canary',base:'appExample',table:'tblExample',now:()=>clock,
    sleep:async ms=>{clock+=ms;waits.push(ms);},
    fetch:(async (url, init)=>{calls.push({url:String(url),init});const r=responses.shift();if(r instanceof Error)throw r;if(!r)throw Error('no fixture');return r;}) as typeof fetch});
  return {client,calls,waits};
}
const json=(x: unknown, status=200)=>new Response(JSON.stringify(x),{status});

test('mapping reuses identity, normalizes dates and writes only research fields',()=>{
  const f=mapProspect({...prospect(),contactRole:'Manager',email:'office@example.test',url:'https://example.test',notes:'Keep private',qualification:'Qualified'});
  assert.equal(f['External ID'],'local-prospects:business:Example 0|VA');
  assert.equal(f['Contact information'],'Manager\n555-0100\noffice@example.test');
  assert.equal(f['First seen'],'2026-10-13T00:00:00.000Z');
  assert.equal(f.Website,'https://example.test');
  assert.equal(f['Qualification status'],undefined);
  assert.equal(f.Activities,undefined);
  assert.equal(f.notes,undefined);
});
test('invalid records fail before listing or writing',async()=>{
  for(const invalid of [{...prospect(),_key:''},{...prospect(),firstSeenAt:'yesterday'},{...prospect(),phone:42},null]){
    let calls=0;const out=await syncProspects({items:[invalid]},{list:async()=>{calls++;return[];},upsert:async()=>{calls++;}});
    assert.equal(out.status,'failed');assert.equal(calls,0);
  }
});
test('repeat import is a no-op and changed research preserves qualification, notes and activities',async()=>{
  const api=memory();
  assert.equal((await syncProspects({items:[prospect()]},api)).confirmed,1);
  Object.assign(api.records[0].fields,{'Qualification status':'Qualified',Activities:'recActivity',Notes:'Call next Tuesday'});
  const again=await syncProspects({items:[prospect()]},api);
  assert.equal(again.unchanged,1);assert.equal(api.batches.length,1);
  const changed=await syncProspects({items:[{...prospect(),workflow:'New research',phone:undefined}]},api);
  assert.equal(changed.confirmed,1);assert.equal(api.records.length,1);
  assert.equal(api.records[0].fields['Contact information'],'');
  assert.equal(api.records[0].fields['Qualification status'],'Qualified');
  assert.equal(api.records[0].fields.Activities,'recActivity');assert.equal(api.records[0].fields.Notes,'Call next Tuesday');
});
test('empty optional fields and date formatting do not cause redundant writes',async()=>{
  const fields=mapProspect(prospect());delete fields.Website; fields['First seen']='2026-10-13T00:00:00Z';
  assert.equal((await syncProspects({items:[prospect()]},memory([{id:'rec',fields}]))).unchanged,1);
});
test('duplicate source and destination identities fail closed',async()=>{
  const api=memory();assert.equal((await syncProspects({items:[prospect(),prospect()]},api)).error,'duplicate_source_identity');
  assert.equal(api.batches.length,0);
  const f=mapProspect(prospect());const dup=memory([{id:'rec1',fields:f},{id:'rec2',fields:f}]);
  assert.equal((await syncProspects({items:[prospect()]},dup)).error,'duplicate_destination_identity');
  assert.equal(dup.batches.length,0);
});
test('batching, partial failure, and reconciliation after ambiguous commit',async()=>{
  const api=memory();const original=api.upsert;let n=0;
  api.upsert=async f=>{n++;await original(f);if(n===2)throw new SyncError('airtable_network_failure');};
  const state={items:Array.from({length:21},(_,i)=>prospect(i))};
  const first=await syncProspects(state,api);
  assert.equal(first.status,'partial');assert.equal(first.confirmed,10);assert.equal(first.uncertain,10);assert.equal(first.pending,11);
  assert.deepEqual(api.batches.map(b=>b.length),[10,10]);
  api.upsert=original;
  const recovered=await syncProspects(state,api);assert.equal(recovered.status,'success');assert.equal(recovered.unchanged,20);assert.equal(recovered.confirmed,1);assert.equal(api.records.length,21);
});
test('malformed source never silently becomes empty and empty source does not delete',async()=>{
  const api=memory([{id:'rec',fields:mapProspect(prospect())}]);
  assert.equal((await syncProspects(null,api)).error,'invalid_source_state');
  assert.equal((await syncProspects({items:[]},api)).status,'success');assert.equal(api.records.length,1);
});
test('client paginates, paces requests and encodes offsets',async()=>{
  const {client,calls,waits}=http([json({records:[],offset:'a & b'}),json({records:[]})]);
  assert.deepEqual(await client.list(),[]);assert.equal(calls.length,2);assert.match(calls[1].url,/offset=a\+%26\+b/);assert.equal(waits[1],260);
});
test('client sends native upsert with stable merge field and no lifecycle fields',async()=>{
  const fields=mapProspect(prospect());const {client,calls}=http([json({records:[{id:'rec',fields}]})]);
  await client.upsert([fields]);const body=JSON.parse(calls[0].init?.body as string);
  assert.equal(calls[0].init?.method,'PATCH');assert.deepEqual(body.performUpsert,{fieldsToMergeOn:['External ID']});
  assert.equal(body.records[0].fields['Qualification status'],undefined);
  assert.equal(calls[0].init?.redirect,'error');
});
test('transient 503 and network failure retry; errors never echo secrets',async()=>{
  const {client,calls}=http([json({error:'secret-canary'},503),new Error('secret-canary'),json({records:[]})]);
  assert.deepEqual(await client.list(),[]);assert.equal(calls.length,3);
  const bad=http([json({error:'secret-canary'},401)]);
  await assert.rejects(bad.client.list(),e=>e instanceof SyncError && e.status===401 && !e.message.includes('secret-canary'));
  assert.equal(bad.calls.length,1);
});
test('429 defers to next run without exceeding scheduled budget',async()=>{
  const {client,calls}=http([json({error:'secret-canary'},429)]);
  await assert.rejects(client.list(),/airtable_rate_limited_retry_next_run/);assert.equal(calls.length,1);
});
test('malformed page, repeated offset and ambiguous acknowledgement fail visibly',async()=>{
  await assert.rejects(http([json({})]).client.list(),/airtable_invalid_response/);
  await assert.rejects(http([json({records:[],offset:'x'}),json({records:[],offset:'x'})]).client.list(),/airtable_repeated_offset/);
  const f=mapProspect(prospect());
  await assert.rejects(http([json({records:[]})]).client.upsert([f]),/airtable_invalid_acknowledgement/);
});
test('deadline bounds retry duration',async()=>{
  let clock=0;let calls=0;
  const client=airtableClient({token:'secret',base:'appExample',table:'tblExample',budgetMs:1100,now:()=>clock,sleep:async ms=>{clock+=ms;},fetch:(async()=>{calls++;throw Error('network');}) as typeof fetch});
  await assert.rejects(client.list(),/airtable_deadline/);assert.equal(calls,1);
});
function runtime(production=true, enabled='true') {
  const reports: unknown[]=[];let reads=0;const api=memory();
  const io:Runtime={production,env:n=>n==='SIGNALDESK_ENABLED'?enabled:n==='AIRTABLE_TOKEN'?'secret-canary':n==='AIRTABLE_BASE_ID'?'appExample':'tblExample',
    read:async()=>{reads++;return{items:[prospect()]};},report:async r=>{reports.push(r);},log:()=>{},client:()=>api};
  return{io,reports,api,reads:()=>reads};
}
test('disabled and preview runners do not read source, call destination, or write status',async()=>{
  for (const r of [runtime(false),runtime(true,'false')]){
    assert.equal((await run(r.io)).status,'disabled');assert.equal(r.reads(),0);assert.equal(r.reports.length,0);assert.equal(r.api.records.length,0);
  }
});
test('runner records successful sync and sanitized source failures',async()=>{
  const r=runtime();assert.equal((await run(r.io)).confirmed,1);assert.equal(r.reports.length,1);
  r.io.read=async()=>{throw Error('secret-canary');};const result=await run(r.io);
  assert.equal(result.error,'source_or_configuration_failure');assert.ok(!JSON.stringify(r.reports).includes('secret-canary'));
});
test('missing configuration is reported before source access',async()=>{
  const r=runtime();delete r.io.client;r.io.env=n=>n==='SIGNALDESK_ENABLED'?'true':undefined;
  assert.equal((await run(r.io)).error,'invalid_airtable_configuration');assert.equal(r.reads(),0);
});
test('status persistence failure surfaces rather than pretending success',async()=>{
  const r=runtime();r.io.report=async()=>{throw Error('storage');};
  await assert.rejects(run(r.io),/sync_report_persistence_failure/);
});
