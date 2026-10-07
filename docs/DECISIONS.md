# Decisions

## Accepted

- Split Slice 1 into Auth0/CIMD ping proof (1A) and conditional dashboard tools (1B). Preserve owner configuration: CIMD enabled, DCR disabled. No custom authorization server or anonymous MCP access.
- SDK: maintained `@modelcontextprotocol/sdk` 1.32.1; Zod 4; `jose` 6.2.12. Use SDK WebStandardStreamableHTTPServerTransport with no session IDs and finite JSON. Create/close server and transport per request. GET MCP streaming is unsupported and returns 405 after authentication.
- Auth0 verifies user login and issues tokens; server verifies RS256 signature from issuer-derived JWKS, exact issuer (including trailing slash), configured audience, required expiration/subject/issued-at, optional not-before, and exact `dashboard:read` scope. Reject M2M subjects/grants. Tenant policy controls permission issuance.
- OAuth resource equals the existing Auth0 API Identifier (site origin). `/mcp` is its endpoint path. Do not change the audience to include `/mcp` or alter the tenant as an implicit workaround. Public root and path-specific resource metadata plus `WWW-Authenticate` identify Auth0 and read scope.
- Only `AUTH0_ISSUER` and `AUTH0_AUDIENCE` configure this proof. Never accept authentication configuration or credentials in tool inputs. JWKS infrastructure failures fail closed; sensitive error text and tokens are suppressed.
- Explicit tools/list metadata includes top-level OAuth `securitySchemes` and `_meta` compatibility field because SDK 1.x emits only the latter by default. The SDK handles tool invocation and input/output validation.
- Existing dashboard HTTP APIs and Netlify Blobs remain authoritative and untouched. Later upserts must not retry ambiguous writes: repeated observations change counters.

## Verified compatibility evidence

Official documentation inspected 2026-10-07 UTC:

- [OpenAI authentication](https://developers.openai.com/plugins/build/auth): protected-resource discovery, challenges, CIMD `none` / `private_key_jwt`, PKCE, resource-bound token enforcement, tool OAuth metadata.
- [MCP authorization](https://modelcontextprotocol.io/specification/latest/basic/authorization): public protected-resource metadata, canonical resource identifiers (including origin-only), 401/403 challenges, issuer/audience validation.
- [Auth0 MCP support](https://auth0.com/blog/auth0-auth-for-mcp-servers-generally-available/): CIMD and resource indicators.
- [Netlify MCP deployment](https://www.netlify.com/knowledge-base/how-to-build-and-deploy-an-mcp-server-on-netlify/): Web-standard transport in stateless Netlify functions; avoid standalone GET SSE.

Corrected tenant public discovery advertises CIMD, PKCE S256, and supported token endpoint methods. This does not prove actual client registration, token resource mapping, or ChatGPT connection.

## Unresolved

- Deployed Netlify behavior and exact site availability; actual ChatGPT OAuth/CIMD registration/token exchange; future unattended tool approval permissions. Resolve through deployed evidence, not inference. Do not begin future slices.
