# Decisions

## Accepted

- Existing dashboard HTTP APIs and Netlify Blobs remain the system of record. MCP will forward requests through a fixed five-dashboard allowlist, not reproduce persistence logic.
- Upsert is not replay-safe. Never automatically retry an ambiguous write failure: a repeated request changes observation and run counters even when item identity is unchanged.
- Stop before MCP implementation when supported secure inbound authentication requires additional infrastructure. No anonymous deployment or arbitrary static Bearer entrance is an acceptable workaround.
- Intended transport, subject to implementation validation: SDK-supported stateless Streamable HTTP with finite JSON responses. OpenAI's current quickstart uses `sessionIdGenerator: undefined` and `enableJsonResponse: true`; no process-local sessions are needed.

## Unresolved / recommended rescope

- Inbound auth: use an established MCP-compatible OAuth provider rather than a custom authorization server. Provider, account configuration, owner-only authorization, scopes, issuer/audience, and ChatGPT connection remain unresolved. Static OAuth client ID/secret settings identify an OAuth client; they are not support for arbitrary MCP API-key headers. OpenAI-managed mTLS identifies the ChatGPT client and does not replace end-user authorization.
- SDK version, Netlify handler/build settings, deployment URL, downstream URLs, and environment-variable schema remain unselected pending the gate. Do not treat the desired `https://dashboarda-mcp.netlify.app/mcp` as an existing endpoint.

## Compatibility evidence

Official documentation fetched 2026-10-04:

- [ChatGPT developer mode](https://developers.openai.com/api/docs/guides/developer-mode): SSE and streaming HTTP; OAuth, no authentication, or mixed authentication; predefined OAuth clients, CIMD, and DCR options.
- [Authentication](https://developers.openai.com/plugins/build/auth): OAuth discovery and resource metadata, resource-bound tokens, PKCE, token signature/issuer/audience/expiry/scope checks. Custom API keys and machine-to-machine OAuth grants are unsupported; established identity providers are recommended.
- [MCP quickstart](https://developers.openai.com/plugins/build/app-quickstart): stateless Streamable HTTP and JSON-response example.

These establish the authentication blocker and intended transport, not successful Netlify deployment or an actual ChatGPT connection. Implementing a provider integration requires explicit scope adjustment under the current Slice 1 stop conditions.
