# Roadmap

1. **Slice 1A — authenticated connection proof (current).** Auth0 OAuth with CIMD, DCR disabled, stateless Netlify MCP, and exactly one harmless `dashboard_ping` requiring `dashboard:read`. Exit: real ChatGPT OAuth/CIMD connection and authenticated ping, continued rejection of unauthorized access, and observation of actual plugin permission controls. Implementation and local tests complete; deployment and actual ChatGPT connection remain unverified.
2. **Slice 1B — conditional on Slice 1A completion.** Add only `dashboard_read` and `dashboard_upsert`, with fixed routing to the five task dashboards. Preserve their HTTP APIs and Blobs persistence. Exit: secure connection in the intended ChatGPT environment, discovery of the intended tools, Email Action read/write/read-back and browser confirmation, and observed repeated-upsert semantics. Inspector-only success is insufficient.
3. **Slice 2 — conditional on Slice 1B completion.** Prove that one existing Email Monitor scheduled ChatGPT task can perform an authenticated MCP write unattended and persist results. Interactive success does not establish this.
4. **Slice 3 — conditional on Slice 2 completion.** Connect the remaining four scheduled dashboard tasks through the proven MCP path.
5. **Slice 4 — conditional later work.** Mobile/UI and operator-facing polish.

Immediate action: deploy the isolated MCP app after resolving repository-push and deployment access, then test the real ChatGPT OAuth/CIMD connection. Do not build a custom authorization server, enable DCR, publish an anonymous endpoint, or scaffold later slices to bypass this gate.
