# Roadmap

1. **Slice 1 — MCP v0.1 (current, blocked at authentication gate).** Add an independently deployed Netlify app exposing only `dashboard_read` and `dashboard_upsert`, with fixed routing to the five task dashboards. Preserve their HTTP APIs and Blobs persistence. Exit: secure connection in the intended ChatGPT environment, discovery of exactly two tools, Email Action read/write/read-back and browser confirmation, and observed repeated-upsert semantics. Inspector-only success is insufficient.
2. **Slice 2 — conditional on Slice 1 completion.** Prove that one existing Email Monitor scheduled ChatGPT task can perform an authenticated MCP write unattended and persist results. Interactive success does not establish this.
3. **Slice 3 — conditional on Slice 2 completion.** Connect the remaining four scheduled dashboard tasks through the proven MCP path.
4. **Slice 4 — conditional later work.** Mobile/UI and operator-facing polish.

Immediate prerequisite: explicitly rescope Slice 1 to include configuration of an established MCP-compatible OAuth provider and resource-server verification, or identify an existing suitable provider. Do not build a custom authorization server, publish an anonymous endpoint, or scaffold later slices to bypass this gate.
