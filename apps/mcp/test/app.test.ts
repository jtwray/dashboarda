import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import { handleRequest, readConfig, protectedMetadata } from '../src/app.js';

const config = { issuer: 'https://dev-x4geda25l7tl8ip3.us.auth0.com/', audience: 'https://dashboarda-mcp.netlify.app' };
const { privateKey, publicKey } = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);
const key = createLocalJWKSet({ keys: [{ ...jwk, kid: 'test', alg: 'RS256' }] });
async function token(overrides: Record<string, unknown> = {}) {
  return new SignJWT({ iss: config.issuer, aud: config.audience, sub: 'auth0|local-test', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+60, scope: 'dashboard:read', ...overrides })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' }).sign(privateKey);
}
async function call(auth?: string, method = 'tools/list', params: object = {}, id = 1) {
  const headers: Record<string,string> = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-11-25' };
  if (auth) headers.Authorization = `Bearer ${auth}`;
  return handleRequest(new Request(`${config.audience}/mcp`, { method: 'POST', headers, body: JSON.stringify({ jsonrpc:'2.0',id,method,params }) }), config, key);
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
test('exactly one tool discovered, with correct annotations and OAuth metadata', async () => {
  const r=await call(await token()); assert.equal(r.status,200);
  const {result}=await r.json(); assert.deepEqual(result.tools.map((t: {name:string})=>t.name),['dashboard_ping']);
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
  for(const params of [{name:'dashboard_ping',arguments:{token:'do-not-accept'}},{name:'dashboard_upsert',arguments:{}}]) {
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
  const r = await handleRequest(new Request(config.audience+'/mcp', {method:'POST', headers:{Authorization:`Bearer ${await token()}`}}),config,async () => {throw new Error('private-network-detail');});
  assert.equal(r.status,503); assert.equal(await r.text(),'{"error":"authentication_service_unavailable"}');
});
