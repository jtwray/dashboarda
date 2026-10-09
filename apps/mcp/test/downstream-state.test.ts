import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { DASHBOARDS } from '../src/dashboards.js';

// Execute the existing handlers against an isolated in-memory Blobs stub; no production calls.
for (const dashboard of DASHBOARDS) test(`${dashboard}: existing API records empty syncs without altering items`, async () => {
  const source = readFileSync(new URL(`../../${dashboard}/netlify/functions/state.mts`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022}}).outputText;
  for (const populated of [false, true]) {
    const initial = populated ? {items:[{id:'existing', _key:'id:existing', seenCount:4, firstSeenAt:'2026-10-01', lastSeenAt:'2026-10-08'}], runs:7, updatedAt:'2026-10-08', runHistory:[{at:'2026-10-08', received:1, total:1}]} : undefined;
    let persisted: any = structuredClone(initial);
    let writes = 0;
    const store = {get:async()=>structuredClone(persisted), setJSON:async (_key:string, value:unknown)=>{writes++;persisted=structuredClone(value);}};
    const module = {exports:{} as {default:(request:Request, context:object)=>Promise<Response>}};
    const require = (name:string) => {
      assert.equal(name, '@netlify/blobs');
      return {getStore:()=>store, getDeployStore:()=>store};
    };
    const netlify = {context:{deploy:{context:'production'}}, env:{get:(name:string)=>name==='DASHBOARD_WRITE_TOKEN'?'test-token':undefined}};
    new Function('require', 'module', 'exports', 'Netlify', compiled)(require, module, module.exports, netlify);
    const response = await module.exports.default(new Request('https://example.test/api/state', {method:'POST', headers:{Authorization:'Bearer test-token', 'Content-Type':'application/json'}, body:JSON.stringify({items:[]})}), {});
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result.items, initial?.items ?? []);
    assert.equal(result.runs, (initial?.runs ?? 0)+1);
    assert.notEqual(result.updatedAt, initial?.updatedAt);
    assert.ok(Number.isFinite(Date.parse(result.updatedAt)));
    assert.deepEqual(result.runHistory.slice(0,-1), initial?.runHistory ?? []);
    assert.deepEqual(result.runHistory.at(-1), {at:result.updatedAt, mode:'upsert', received:0, total:initial?.items.length ?? 0});
    assert.equal(writes, 1);
    assert.deepEqual(persisted, result);
  }
});
