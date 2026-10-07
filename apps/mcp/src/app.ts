import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';

export const READ_SCOPE = 'dashboard:read';
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

export async function validateToken(token: string, config: AuthConfig, key: JWTVerifyGetKey) {
  const { payload } = await jwtVerify(token, key, {
    issuer: config.issuer, audience: config.audience,
    algorithms: ['RS256'], requiredClaims: ['exp', 'sub', 'iat'],
  });
  // Auth0 user subjects differ from M2M client subjects. This service accepts user access only.
  if (!payload.sub || payload.sub.endsWith('@clients') || payload.gty === 'client-credentials') {
    throw new Error('invalid_user_token');
  }
  if (typeof payload.scope !== 'string' || !payload.scope.split(/\s+/).includes(READ_SCOPE)) {
    throw new Error('insufficient_scope');
  }
}

function challenge(config: AuthConfig, status: 401 | 403, error?: string) {
  const metadataUrl = new URL('/.well-known/oauth-protected-resource', config.audience).href;
  const value = `Bearer resource_metadata="${metadataUrl}", scope="${READ_SCOPE}"${error ? `, error="${error}"` : ''}`;
  return Response.json({ error: error ?? 'unauthorized' }, {
    status, headers: { 'WWW-Authenticate': value, 'Cache-Control': 'no-store' },
  });
}

export function makeServer() {
  const server = new McpServer({ name: 'dashboarda-mcp', version: '0.1-auth-proof' });
  const descriptor = {
    title: 'Check Dashboarda MCP connection',
    description: 'Verify authenticated dashboard:read access to the private Dashboarda MCP service.',
    inputSchema: z.object({}).strict(),
    outputSchema: z.object({ ok: z.literal(true), authenticated: z.literal(true) }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: { securitySchemes: [{ type: 'oauth2', scopes: [READ_SCOPE] }] },
  };
  server.registerTool('dashboard_ping', descriptor, async () => {
    const proof = { ok: true as const, authenticated: true as const };
    return { content: [{ type: 'text', text: JSON.stringify(proof) }], structuredContent: proof };
  });
  // SDK 1.x preserves _meta but does not emit OpenAI's top-level securitySchemes extension.
  server.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [{
    ...descriptor, name: 'dashboard_ping',
    inputSchema: z.toJSONSchema(descriptor.inputSchema),
    outputSchema: z.toJSONSchema(descriptor.outputSchema),
    securitySchemes: descriptor._meta.securitySchemes,
  }] }));
  return server;
}

export async function handleRequest(request: Request, config: AuthConfig, key?: JWTVerifyGetKey): Promise<Response> {
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
  try {
    // No caller-selected issuer/JWKS. Cache is per request; correctness never needs a warm instance.
    const verifier = key ?? createRemoteJWKSet(new URL('.well-known/jwks.json', config.issuer), { timeoutDuration: 5000 });
    await validateToken(match[1], config, verifier);
  } catch (error) {
    if (error instanceof Error && error.message === 'insufficient_scope') return challenge(config, 403, 'insufficient_scope');
    if (!(error instanceof Error) || (!('code' in error) && error.message !== 'invalid_user_token') || (error instanceof Error && 'code' in error && ['ERR_JWKS_TIMEOUT', 'ERR_JOSE_GENERIC'].includes(String(error.code)))) {
      return Response.json({ error: 'authentication_service_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    return challenge(config, 401, 'invalid_token');
  }
  // A standalone GET SSE connection is unnecessary and unsuitable for a finite serverless invocation.
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  const server = makeServer();
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
