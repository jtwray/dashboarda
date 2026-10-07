import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import { DASHBOARDS, ROUTES, type Downstream } from '../src/dashboards.js';
import { handleRequest, readConfig, protectedMetadata } from '../src/app.js';

const config = { issuer: 'https://dev-x4geda25l7tl8ip3.us.auth0.com/', audience: 'https://dashboarda-mcp.netlify.app' };
const { privateKey, publicKey } = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);
const key = createLocalJWKSet({ keys: [{ ...jwk, kid: 'test', alg: 'RS256' }] });
async function token(overrides: Record<string, unknown> = {}) {
  return new SignJWT({ iss: config.issuer, aud: config.audience, sub: 'auth0|local-test', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+60, scope: 'dashboard:read', ...overrides })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' }).sign(privateKey);
}
async function call(auth?: string, method = 'tools/list', params: object = {}, id = 1, io?: Downstream) {
  const headers: Record<string,string> = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-11-25' };
  if (auth) headers.Authorization = `Bearer ${auth}`;
  return handleRequest(new Request(`${config.audience}/mcp`, { method: 'POST', headers, body: JSON.stringify({ jsonrpc:'2.0',id,method,params }) }), config, key, io);
}

test('configuration is server-selected, HTTPS, and preserves exact issuer', () => {
  assert.deepEqual(readConfig(name => ({ AUTH0_ISSUER:config.issuer, AUTH0_AUDIENCE:config.audience })[name as 'AUTH0_ISSUER']), config);
  assert.throws(() => readConfig(() => undefined));
  assert.throws(() => readConfig(name => name === 'AUTH0_ISSUER' ? 'http://bad/' : config.audience));
  assert.throws(() => readConfig(name => name === 'AUTH0_ISSUER' ? config.issuer.slice(0,-1) : config.audience));
});
test('public protected-resource metadata advertises exact resource and Auth0 issuer', async () => {
  for (const path of ['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp']) {
    const r = await handleRequest(new Request(config.audience+path), config, key);
    assert.equal(r.status,200); assert.deepEqual(await r.json(),protectedMetadata(config));
  }
});
test('unauthenticated discovery is rejected with resource metadata and scope challenge', async () => {
  const r=await call(); assert.equal(r.status,401);
  assert.match(r.headers.get('www-authenticate')!,/resource_metadata="https:\/\/dashboarda-mcp.netlify.app\/\.well-known\/oauth-protected-resource"/);
  assert.match(r.headers.get('www-authenticate')!,/scope="dashboard:read"/);
});
for (const [name, claims] of Object.entries({
  'wrong issuer': {iss:'https://other.example/'}, 'wrong audience': {aud:'https://other.example'},
  expired: {exp:1}, 'missing expiry': {exp:undefined}, 'future not-before': {nbf:Math.floor(Date.now()/1000)+3600},
  'machine subject': {sub:'client@clients'}, 'machine grant': {gty:'client-credentials'},
})) test(`${name} is rejected`, async () => { assert.equal((await call(await token(claims))).status,401); });
test('invalid signature is rejected', async () => {
  const other=await generateKeyPair('RS256');
  const invalid=await new SignJWT({}).setProtectedHeader({alg:'RS256',kid:'test'}).sign(other.privateKey);
  assert.equal((await call(invalid)).status,401);
});
test('arbitrary API key / invalid JWT is rejected without leaking it', async () => {
  const r=await call('super-secret-invalid-token'); assert.equal(r.status,401);
  assert.equal(await r.text(),'{"error":"invalid_token"}');
});
test('missing or substring scope is rejected with insufficient_scope', async () => {
  for(const scope of [undefined,'dashboard:write','dashboard:read-extra']) {
    const r=await call(await token({scope})); assert.equal(r.status,403);
    assert.match(r.headers.get('www-authenticate')!,/error="insufficient_scope"/);
  }
});
test('authenticated initialization is finite and has no session', async () => {
  const r=await call(await token(),'initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}});
  assert.equal(r.status,200); assert.equal(r.headers.get('mcp-session-id'),null);
  assert.equal((await r.json()).result.serverInfo.name,'dashboarda-mcp');
});
test('exactly three tools discovered, with correct annotations and OAuth metadata', async () => {
  const r=await call(await token()); assert.equal(r.status,200);
  const {result}=await r.json(); assert.deepEqual(result.tools.map((t: {name:string})=>t.name),['dashboard_ping','dashboard_read','dashboard_upsert']);
  assert.deepEqual(result.tools[0].annotations,{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false});
  assert.deepEqual(result.tools[0].securitySchemes,[{type:'oauth2',scopes:['dashboard:read']}]);
  assert.deepEqual(result.tools[0]._meta.securitySchemes,[{type:'oauth2',scopes:['dashboard:read']}]);
});
test('ping returns only harmless proof data', async () => {
  const r=await call(await token(),'tools/call',{name:'dashboard_ping',arguments:{}});
  assert.equal(r.status,200);
  const body=await r.json(); assert.deepEqual(body.result.structuredContent,{ok:true,authenticated:true});
  assert.deepEqual(JSON.parse(body.result.content[0].text),{ok:true,authenticated:true});
});
test('invalid tool arguments and unknown tool do not succeed', async () => {
  for(const params of [{name:'dashboard_ping',arguments:{token:'do-not-accept'}},{name:'not_a_tool',arguments:{}}]) {
    const r=await call(await token(),'tools/call',params); const body=await r.json();
    assert.ok(body.error || body.result?.isError);
  }
});
test('GET does not open a persistent SSE connection and hostile origins fail', async () => {
  const auth=await token();
  assert.equal((await handleRequest(new Request(config.audience+'/mcp',{headers:{Authorization:`Bearer ${auth}`}}),config,key)).status,405);
  assert.equal((await handleRequest(new Request(config.audience+'/mcp',{headers:{Origin:'https://evil.example'}}),config,key)).status,403);
});

test('JWKS infrastructure failure fails closed with 503 and no private error text', async () => {
  const r = await handleRequest(new Request(config.audience+'/mcp', {method:'POST', body:'{}', headers:{Authorization:`Bearer ${await token()}`}}),config,async () => {throw new Error('private-network-detail');});
  assert.equal(r.status,503); assert.equal(await r.text(),'{"error":"authentication_service_unavailable"}');
});

const sample = {items:Array.from({length:70},(_,i)=>({id:String(i),seenCount:2,lastSeenAt:'2026-10-07'})),runs:3,updatedAt:'2026-10-07',runHistory:Array(100).fill({received:1})};
function downstream(handler?: typeof fetch) {
  const requests: {url:string; init:RequestInit}[] = [];
  const io: Downstream = { env: name => name.endsWith('READ_PIN') ? 'secret-pin' : 'secret-write', fetch: async (url,init) => {
    requests.push({url:String(url),init:init!});
    return handler ? handler(url,init) : Response.json(sample);
  }};
  return {io,requests};
}
async function tool(name:string,args:object,scope='dashboard:read',io=downstream().io) {
  const r=await call(await token({scope}),'tools/call',{name,arguments:args},1,io);
  return {r,body:await r.json()};
}
test('read defaults to 20, caps at 50, omits history and routes all five credentials', async () => {
  for(const dashboard of DASHBOARDS) {
    const {io,requests}=downstream();
    const {body}=await tool('dashboard_read',{dashboard},'dashboard:read',io);
    assert.equal(body.result.structuredContent.items.length,20);
    assert.equal(body.result.structuredContent.total,70);
    assert.equal(body.result.structuredContent.runHistory,undefined);
    assert.equal(requests[0].url,ROUTES[dashboard].url);
    assert.deepEqual(requests[0].init.headers,{'x-dashboard-pin':'secret-pin'});
    assert.equal(requests[0].init.redirect,'error');
  }
  assert.equal((await tool('dashboard_read',{dashboard:'email-action',limit:50})).body.result.structuredContent.items.length,50);
});
test('upsert requires write scope; read requires read scope; denied calls never forward', async () => {
  const {io,requests}=downstream();
  for(const [name,scope,args] of [['dashboard_upsert','dashboard:read',{dashboard:'email-action',items:[{id:'x'}]}],['dashboard_read','dashboard:write',{dashboard:'email-action'}]] as const) {
    const {r}=await tool(name,args,scope,io); assert.equal(r.status,403);
    assert.match(r.headers.get('www-authenticate')!,new RegExp(name==='dashboard_upsert'?'dashboard:write':'dashboard:read'));
  }
  assert.equal(requests.length,0);
});
test('write-only token can upsert; POST uses server credential, no replace, compact receipt', async () => {
  for(const dashboard of DASHBOARDS) {
    const {io,requests}=downstream();const {body}=await tool('dashboard_upsert',{dashboard,items:[{id:'x'}]},'dashboard:write',io);
    assert.deepEqual(body.result.structuredContent,{dashboard,received:1,total:70,runs:3,updatedAt:'2026-10-07'});
    assert.equal(requests[0].url,ROUTES[dashboard].url);assert.equal(requests[0].init.method,'POST');
    assert.deepEqual(requests[0].init.headers,{Authorization:'Bearer secret-write','Content-Type':'application/json'});
    assert.deepEqual(JSON.parse(requests[0].init.body as string),{items:[{id:'x'}]});
    assert.ok(!JSON.stringify(body).includes('secret-'));
  }
});
test('invalid dashboard, limits, items, replace, URL and credentials cannot reach downstream', async () => {
  const {io,requests}=downstream();
  const invalid = [
    ['dashboard_read',{dashboard:'home-board'}],['dashboard_read',{dashboard:'https://evil.example'}],
    ['dashboard_read',{dashboard:'email-action',limit:51}],['dashboard_read',{dashboard:'email-action',limit:0}],
    ['dashboard_read',{dashboard:'email-action',limit:2.5}],['dashboard_read',{dashboard:'email-action',url:'https://evil.example'}],
    ['dashboard_upsert',{dashboard:'unknown',items:[{}]}],['dashboard_upsert',{dashboard:'email-action',items:[]}],
    ['dashboard_upsert',{dashboard:'email-action',items:Array(51).fill({})}],['dashboard_upsert',{dashboard:'email-action',items:[null]}],
    ['dashboard_upsert',{dashboard:'email-action',items:[[]]}],['dashboard_upsert',{dashboard:'email-action',items:['x']}],
    ['dashboard_upsert',{dashboard:'email-action',items:[{}],mode:'replace'}],['dashboard_upsert',{dashboard:'email-action',items:[{}],token:'override'}],
  ] as const;
  for(const [name,args] of invalid) {
    const {body}=await tool(name,args,'dashboard:read dashboard:write',io);assert.ok(body.error || body.result?.isError);
  }
  assert.equal(requests.length,0);
});
test('missing configuration never forwards', async () => {
  const {io,requests}=downstream();io.env=()=>undefined;
  const {body}=await tool('dashboard_read',{dashboard:'email-action'},'dashboard:read',io);
  assert.match(body.result.content[0].text,/missing_downstream_configuration/);assert.equal(requests.length,0);
});
for(const status of [401,403,422,500]) test(`downstream ${status} is honestly surfaced without body leakage`, async () => {
  for(const write of [false,true]) {
    const {io,requests}=downstream(async()=>new Response('secret-write secret-pin private downstream detail',{status}));
    const {body}=await tool(write?'dashboard_upsert':'dashboard_read',{dashboard:'email-action',...(write?{items:[{id:'x'}]}:{})},'dashboard:read dashboard:write',io);
    const details=JSON.parse(body.result.content[0].text);assert.equal(body.result.isError,true);assert.equal(details.downstreamStatus,status);
    assert.equal(details.uncertain,write && status!==401 && status!==403);assert.equal(requests.length,1);
    assert.ok(!JSON.stringify(body).includes('secret-'));
  }
});
for(const failure of ['network','malformed','invalid-state']) test(`${failure}: writes uncertain, no retry; reads fail honestly`, async () => {
  for(const write of [false,true]) {
    const {io,requests}=downstream(async()=>{if(failure==='network') throw new Error('secret-write');return new Response(failure==='malformed'?'bad-json':'{}');});
    const {body}=await tool(write?'dashboard_upsert':'dashboard_read',{dashboard:'email-action',...(write?{items:[{id:'x'}]}:{})},'dashboard:read dashboard:write',io);
    const details=JSON.parse(body.result.content[0].text);assert.equal(body.result.isError,true);assert.equal(details.uncertain,write);
    assert.equal(requests.length,1);assert.ok(!JSON.stringify(body).includes('secret-write'));
  }
});
test('write descriptor explicitly disclaims replay idempotence', async()=>{
  const {result}=await (await call(await token())).json();
  const w=result.tools.find((t:{name:string})=>t.name==='dashboard_upsert');
  assert.deepEqual(w.annotations,{readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:false});
  assert.deepEqual(w.securitySchemes,[{type:'oauth2',scopes:['dashboard:write']}]);
});
test('timeouts fail honestly, never retry, and mark write outcome uncertain', async (t) => {
  t.mock.method(AbortSignal, 'timeout', () => AbortSignal.abort());
  for (const write of [false, true]) {
    const {io, requests} = downstream(async (_url, init) => {
      (init!.signal as AbortSignal).throwIfAborted();
      throw new Error('unreachable');
    });
    const {body} = await tool(write ? 'dashboard_upsert' : 'dashboard_read', {dashboard:'email-action', ...(write ? {items:[{id:'x'}]} : {})}, 'dashboard:read dashboard:write', io);
    assert.deepEqual(JSON.parse(body.result.content[0].text), {error:'downstream_timeout', uncertain:write});
    assert.equal(requests.length, 1);
  }
});
test('batch input cannot bypass scope checks or forward a write', async () => {
  const {io, requests} = downstream();
  const response = await handleRequest(new Request(config.audience+'/mcp', {
    method:'POST', headers:{Authorization:`Bearer ${await token()}`, 'Content-Type':'application/json', Accept:'application/json, text/event-stream'},
    body:JSON.stringify([{jsonrpc:'2.0', id:1, method:'tools/call', params:{name:'dashboard_upsert', arguments:{dashboard:'email-action', items:[{id:'x'}]}}}]),
  }), config, key, io);
  assert.equal(response.status, 400);
  assert.equal(requests.length, 0);
});
