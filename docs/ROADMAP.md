# Roadmap

1. **Slice 1A — complete.** Owner proved the production ChatGPT Auth0 OAuth/CIMD connection and authenticated `dashboard_ping`.
2. **Slice 1B — current.** Keep ping; add only fixed-route `dashboard_read` and `dashboard_upsert` for five task dashboards, preserving their APIs and persistence. Local implementation is tested; operator deployment and live acceptance remain pending. Exit: three tools in ChatGPT, real Email Action read, read-only write rejection, app-specific write authorization, controlled upsert/read-back/browser confirmation, and observed repeated-upsert semantics.
3. **Slice 2 — after Slice 1B acceptance.** Prove one existing Email Monitor scheduled ChatGPT task can write unattended. Interactive success does not establish this.
4. **Slice 3 — after Slice 2.** Connect remaining four scheduled tasks through the proven path.
5. **Slice 4 — later.** Mobile/UI and operator polish.

Do not begin Slice 2 or introduce new persistence, extra tools, home-board support, or scheduled-task integration in Slice 1B.
