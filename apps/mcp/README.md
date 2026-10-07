# Dashboarda MCP — Slice 1A

Exactly one tool: `dashboard_ping`. It returns `{ "ok": true, "authenticated": true }` after RS256 signature, issuer, audience, expiration, user-subject, and `dashboard:read` checks. No dashboard API or Blob access occurs.

## Netlify deployment

Create a **new** independently deployed site from `jtwray/dashboarda`, using branch `feature/mcp-auth-proof` for this proof. Do not change the six existing sites. Name the new site `dashboarda-mcp`; confirm that exact hostname is available before deployment. Do not substitute another hostname without revisiting the Auth0 resource configuration.

| Setting | Value |
| --- | --- |
| Base directory | `apps/mcp` |
| Build command | `npm run build` |
| Publish directory | `apps/mcp/public` relative to repository / `public` relative to base |
| Functions directory | `apps/mcp/netlify/functions` relative to repository / `netlify/functions` relative to base |
| Node runtime | Node 22 or later |

`netlify.toml` defines base-relative settings. Netlify bundles the original `.mts` function with esbuild; `dist/mcp.mjs` is a local build check, not the publish directory.

Required Functions-scope environment variable **names**:

- `AUTH0_ISSUER`
- `AUTH0_AUDIENCE`

Use the exact owner-provided issuer with trailing slash and the existing Auth0 API Identifier as audience. No client secret, read PIN, write token, or OAuth proxy is required. Do not enable DCR or alter tenant settings.

## URLs (intended; deployment not yet performed)

- MCP: `https://dashboarda-mcp.netlify.app/mcp`
- Protected resource: `https://dashboarda-mcp.netlify.app/.well-known/oauth-protected-resource`
- Path-specific discovery alias: `https://dashboarda-mcp.netlify.app/.well-known/oauth-protected-resource/mcp`
- Auth0 OAuth metadata: `https://dev-x4geda25l7tl8ip3.us.auth0.com/.well-known/oauth-authorization-server`
- Auth0 OpenID metadata: `https://dev-x4geda25l7tl8ip3.us.auth0.com/.well-known/openid-configuration`
- Auth0 signing keys: `https://dev-x4geda25l7tl8ip3.us.auth0.com/.well-known/jwks.json`

The protected-resource `resource` is the existing site-origin API Identifier, **not** the `/mcp` endpoint path. Clients must request that exact resource in authorization and token exchange. Both metadata URLs serve the same resource document. Auth0 hosts authorization-server metadata, PKCE, registration, login, and token exchange; this app implements no authorization server.

## Validation

From repository root:

```sh
npm ci
npm run build --workspace @dashboarda/mcp
npm test --workspace @dashboarda/mcp
```

Tests create ephemeral local signing keys and invoke the same handler without a network listener. There is no production validation bypass: Netlify's entrypoint never accepts test keys from HTTP requests.

After deployment, GET protected-resource metadata and verify the exact issuer, audience/resource, and `dashboard:read`. POST `/mcp` without authentication must return 401 plus `WWW-Authenticate` pointing at the metadata URL. A malformed Bearer token must return 401 `invalid_token`. JWKS infrastructure failures fail closed with 503. A valid token lacking `dashboard:read` must return 403 `insufficient_scope`.

For MCP POSTs, send `Content-Type: application/json` and `Accept: application/json, text/event-stream`. Initialize, list tools, and call `dashboard_ping` with `{}` using a real Auth0 user access token. Every MCP request requires authentication. GET `/mcp` with valid authentication returns 405 instead of opening persistent SSE. Request-local server/transport instances return finite JSON; no sessions or persistence are created.

Then use **ChatGPT → Plugins → + → Create custom MCP server**, enter the MCP URL, choose OAuth and CIMD, and complete Auth0 login. Confirm discovery of exactly `dashboard_ping`, call it, and record the actual permission options shown. Do not claim CIMD registration, OAuth exchange, or ChatGPT compatibility from local tests. If CIMD fails, stop and capture the error; do not fall back to DCR.

## Limits

This authorizes users issued `dashboard:read` by the configured tenant; it does not add an owner allowlist or accounts. M2M subjects/grants are rejected. Auth0 tenant policy controls which users receive permissions. SDK 1.x does not emit the top-level `securitySchemes` extension itself, so the explicit tools/list handler publishes it alongside the compatibility `_meta` field. Tool execution remains SDK-managed and HTTP authorization is mandatory.

Only request ID, status, and duration are logged. Tokens, claims, request bodies, and user identities are never logged or returned.
