import { getStore, getDeployStore } from "@netlify/blobs";
import type { Context, Config } from "@netlify/functions";

function store() {
  return Netlify.context?.deploy?.context === "production"
    ? getStore("dashboard-state", { consistency: "strong" })
    : getDeployStore("dashboard-state");
}

const blank = () => ({ items: [], updatedAt: null, runs: 0, runHistory: [] });

function stable(value: any): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function itemKey(item: any): string {
  if (item?.id) return `id:${item.id}`;
  if (item?.messageId) return `message:${item.messageId}`;
  if (item?.url) return `url:${item.url}`;
  if (item?.business) return `business:${item.business}|${item.location ?? ""}`;
  if (item?.employer && item?.role) return `job:${item.employer}|${item.role}|${item.location ?? ""}`;
  if (item?.vehicle) return `vehicle:${item.vehicle}|${item.location ?? ""}|${item.price ?? ""}`;
  if (item?.from && item?.subject) return `email:${item.from}|${item.subject}|${item.received ?? ""}`;

  const copy = { ...item };
  delete copy._key;
  delete copy.firstSeenAt;
  delete copy.lastSeenAt;
  delete copy.seenCount;
  return `fallback:${stable(copy)}`;
}

export default async (req: Request, _context: Context) => {
  const s = store();

  if (req.method === "GET") {
    const pin = Netlify.env.get("DASHBOARD_READ_PIN");
    if (!pin || req.headers.get("x-dashboard-pin") !== pin) {
      return new Response("Unauthorized", { status: 401 });
    }
    return Response.json((await s.get("state", { type: "json" })) ?? blank());
  }

  if (req.method === "POST") {
    const token = Netlify.env.get("DASHBOARD_WRITE_TOKEN");
    if (!token || (req.headers.get("authorization") || "") !== `Bearer ${token}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body: any = await req.json();
    const incoming = Array.isArray(body.items) ? body.items : [];
    const current: any = (await s.get("state", { type: "json" })) ?? blank();
    const now = new Date().toISOString();
    const mode = body.mode === "replace" ? "replace" : "upsert";

    const byKey = new Map<string, any>();

    if (mode === "upsert") {
      for (const item of current.items ?? []) {
        byKey.set(item._key ?? itemKey(item), item);
      }
    }

    for (const item of incoming) {
      const key = itemKey(item);
      const previous = byKey.get(key);
      byKey.set(key, {
        ...(previous ?? {}),
        ...item,
        _key: key,
        firstSeenAt: previous?.firstSeenAt ?? now,
        lastSeenAt: now,
        seenCount: Number(previous?.seenCount ?? 0) + 1,
      });
    }

    const items = [...byKey.values()].sort((a, b) =>
      String(b.lastSeenAt ?? "").localeCompare(String(a.lastSeenAt ?? ""))
    );

    const runHistory = [
      ...(Array.isArray(current.runHistory) ? current.runHistory : []),
      {
        at: now,
        mode,
        received: incoming.length,
        total: items.length,
      },
    ].slice(-50);

    const next = {
      items,
      updatedAt: now,
      runs: Number(current.runs ?? 0) + 1,
      runHistory,
    };

    await s.setJSON("state", next);
    return Response.json(next);
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = { path: "/api/state" };
