import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';
import { readInput, upsertInput, dashboardRead, dashboardUpsert, DashboardError, type Downstream } from './dashboards.js';

export const READ_SCOPE = 'dashboard:read';
export const WRITE_SCOPE = 'dashboard:write';
export interface AuthConfig { issuer: string; audience: string }

export function readConfig(env: (name: string) => string | undefined): AuthConfig {
  const issuer = env('AUTH0_ISSUER');
  const audience = env('AUTH0_AUDIENCE');
  if (!issuer || !audience) throw new Error('missing_configuration');
  for (const value of [issuer, audience]) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      throw new Error('invalid_configuration');
    }
  }
  if (new URL(issuer).pathname !== '/' || !issuer.endsWith('/')) throw new Error('invalid_configuration');
  return { issuer, audience };
}

export function protectedMetadata(config: AuthConfig) {
  return {
    resource: config.audience,
    authorization_servers: [config.issuer],
    scopes_supported: [READ_SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'Dashboarda MCP',
  };
}

export async function validateToken(token: string, config: AuthConfig, key: JWTVerifyGetKey, requiredScope = READ_SCOPE) {
  const { payload } = await jwtVerify(token, key, {
    issuer: config.issuer, audience: config.audience,
    algorithms: ['RS256'], requiredClaims: ['exp', 'sub', 'iat'],
  });
  // Auth0 user subjects differ from M2M client subjects. This service accepts user access only.
  if (!payload.sub || payload.sub.endsWith('@clients') || payload.gty === 'client-credentials') {
    throw new Error('invalid_user_token');
  }
  if (typeof payload.scope !== 'string' || !payload.scope.split(/\s+/).includes(requiredScope)) {
    throw new Error('insufficient_scope');
  }
  return payload.scope.split(/\s+/);
}

function challenge(config: AuthConfig, status: 401 | 403, error?: string, scope = READ_SCOPE) {
  const metadataUrl = new URL('/.well-known/oauth-protected-resource', config.audience).href;
  const value = `Bearer resource_metadata="${metadataUrl}", scope="${scope}"${error ? `, error="${error}"` : ''}`;
  return Response.json({ error: error ?? 'unauthorized' }, {
    status, headers: { 'WWW-Authenticate': value, 'Cache-Control': 'no-store' },
  });
}

export function makeServer(io: Downstream, scopes: string[]) {
  const server = new McpServer({ name: 'dashboarda-mcp', version: '0.2-dashboard-tools' });
  const descriptor = {
    title: 'Check Dashboarda MCP connection',
    description: 'Verify authenticated dashboard:read access to the private Dashboarda MCP service.',
    inputSchema: z.object({}).strict(),
    outputSchema: z.object({ ok: z.literal(true), authenticated: z.literal(true) }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: { securitySchemes: [{ type: 'oauth2', scopes: [READ_SCOPE] }] },
  };
  function denied(scope: string) {
    return { isError: true, content: [{ type: 'text' as const, text: 'insufficient_scope' }], _meta: { 'mcp/www_authenticate': [`Bearer error="insufficient_scope", error_description="Required tool scope missing", scope="${scope}"`] } };
  }
  server.registerTool('dashboard_ping', descriptor, async () => {
    if (!scopes.includes(READ_SCOPE)) return denied(READ_SCOPE);
    const proof = { ok: true as const, authenticated: true as const };
    return { content: [{ type: 'text', text: JSON.stringify(proof) }], structuredContent: proof };
  });
  const descriptors = [{ ...descriptor, name: 'dashboard_ping' }];
  const resultSchema = z.object({ dashboard: z.string(), total: z.number(), runs: z.number(), updatedAt: z.string().nullable() });
  function failure(error: unknown) {
    const known = error instanceof DashboardError ? error : new DashboardError('downstream_failure', true);
    const details = { error: known.code, uncertain: known.uncertain, ...(known.status ? { downstreamStatus: known.status } : {}) };
    return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify(details) }] };
  }
  const readDescriptor = {
    title: 'Read Dashboarda state', description: 'Read a bounded view of a private task dashboard. Defaults to 20 items; maximum 50.',
    inputSchema: readInput, outputSchema: resultSchema.extend({ items: z.array(z.record(z.string(), z.unknown())) }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: { securitySchemes: [{ type: 'oauth2', scopes: [READ_SCOPE] }] },
  };
  server.registerTool('dashboard_read', readDescriptor, async (input) => {
    if (!scopes.includes(READ_SCOPE)) return denied(READ_SCOPE);
    try { const result = await dashboardRead(input, io); return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result }; }
    catch (error) { return failure(error); }
  });
  const writeDescriptor = {
    title: 'Upsert Dashboarda items', description: 'Observe 1–50 items in a private task dashboard using existing upsert behavior. Replays increment observation/run counters; do not retry uncertain writes.',
    inputSchema: upsertInput, outputSchema: resultSchema.extend({ received: z.number() }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    _meta: { securitySchemes: [{ type: 'oauth2', scopes: [WRITE_SCOPE] }] },
  };
  server.registerTool('dashboard_upsert', writeDescriptor, async (input) => {
    if (!scopes.includes(WRITE_SCOPE)) return denied(WRITE_SCOPE);
    try { const result = await dashboardUpsert(input, io); return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result }; }
    catch (error) { return failure(error); }
  });
  // SDK 1.x emits _meta but not OpenAI's top-level securitySchemes extension.
  const tools = [descriptors[0], { ...readDescriptor, name: 'dashboard_read' }, { ...writeDescriptor, name: 'dashboard_upsert' }];
  server.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: tools.map(tool => ({
    ...tool, inputSchema: z.toJSONSchema(tool.inputSchema), outputSchema: z.toJSONSchema(tool.outputSchema),
    securitySchemes: tool._meta.securitySchemes,
  })) }));
  return server;
}

export async function handleRequest(request: Request, config: AuthConfig, key?: JWTVerifyGetKey, io: Downstream = { env: () => undefined, fetch: globalThis.fetch }): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (path === '/.well-known/oauth-protected-resource' || path === '/.well-known/oauth-protected-resource/mcp') {
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    return Response.json(protectedMetadata(config), { headers: { 'Cache-Control': 'public, max-age=300' } });
  }
  if (path !== '/mcp') return new Response(null, { status: 404 });
  // Reject unexpected browser origins. Native remote MCP clients need no Origin header.
  const origin = request.headers.get('origin');
  if (origin && ![new URL(config.audience).origin, 'https://chatgpt.com'].includes(origin)) {
    return Response.json({ error: 'forbidden_origin' }, { status: 403 });
  }
  const authorization = request.headers.get('authorization');
  if (!authorization) return challenge(config, 401);
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  if (!match) return challenge(config, 401, 'invalid_token');
  let scopes: string[];
  let scope = READ_SCOPE;
  let parsedBody: unknown;
  if (request.method === 'POST') {
    try { parsedBody = await request.clone().json(); }
    catch { return Response.json({ error: 'invalid_json' }, { status: 400 }); }
    // Require one JSON-RPC request so every invocation receives its own HTTP scope challenge.
    if (Array.isArray(parsedBody)) return Response.json({ error: 'batch_not_supported' }, { status: 400 });
    // Select required scope from the actual tool invocation, before any downstream call.
    const body = parsedBody as { method?: unknown; params?: { name?: unknown } } | null;
    if (body?.method === 'tools/call' && body.params?.name === 'dashboard_upsert') scope = WRITE_SCOPE;
  }
  try {
    // No caller-selected issuer/JWKS. Cache is per request; correctness never needs a warm instance.
    const verifier = key ?? createRemoteJWKSet(new URL('.well-known/jwks.json', config.issuer), { timeoutDuration: 5000 });
    scopes = await validateToken(match[1], config, verifier, scope);
  } catch (error) {
    if (error instanceof Error && error.message === 'insufficient_scope') return challenge(config, 403, 'insufficient_scope', scope);
    if (!(error instanceof Error) || (!('code' in error) && error.message !== 'invalid_user_token') || (error instanceof Error && 'code' in error && ['ERR_JWKS_TIMEOUT', 'ERR_JOSE_GENERIC'].includes(String(error.code)))) {
      return Response.json({ error: 'authentication_service_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    return challenge(config, 401, 'invalid_token');
  }
  // A standalone GET SSE connection is unnecessary and unsuitable for a finite serverless invocation.
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  const server = makeServer(io, scopes);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    // Materialize the finite JSON response before closing request-local SDK resources.
    const body = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store');
    return new Response(body.byteLength ? body : null, { status: response.status, headers });
  } catch {
    return Response.json({ error: 'mcp_request_failed' }, { status: 500 });
  } finally {
    await server.close();
    await transport.close();
  }
}
