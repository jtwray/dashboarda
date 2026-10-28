import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getStore, getDeployStore } from "@netlify/blobs";

const COOKIE = "jobdesk_session";
const WINDOW_MS = 15 * 60 * 1000;
const SESSION_MS = 12 * 60 * 60 * 1000;
const MAX_FAILURES = 5;
const noCache = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" };

export function env(name: string): string {
  return (globalThis as any).Netlify?.env?.get(name) ?? process.env[name] ?? "";
}

export function configured(): boolean {
  return env("JOB_DASHBOARD_PASSPHRASE").length >= 16 &&
    env("JOB_DASHBOARD_SESSION_SECRET").length >= 32;
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...noCache, ...extra } });
}

function sign(payload: string) {
  return createHmac("sha256", env("JOB_DASHBOARD_SESSION_SECRET"))
    .update(payload).digest("base64url");
}

export function issueSession() {
  const payload = Buffer.from(JSON.stringify({
    version: 1, expires: Date.now() + SESSION_MS
  })).toString("base64url");
  return payload + "." + sign(payload);
}

export function hasSession(req: Request): boolean {
  if (!configured()) return false;
  const raw = req.headers.get("cookie") ?? "";
  const token = raw.split(";").map(s => s.trim())
    .find(s => s.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2 || parts[0].length > 512 || parts[1].length > 256) return false;
  try {
    const provided = Buffer.from(parts[1], "base64url");
    const expected = Buffer.from(sign(parts[0]), "base64url");
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return false;
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return data.version === 1 && Number.isFinite(data.expires) &&
      data.expires > Date.now() && data.expires <= Date.now() + SESSION_MS;
  } catch { return false; }
}

export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(req.url).origin; }
  catch { return false; }
}

export function sessionCookie(req: Request, token: string) {
  const hostname = new URL(req.url).hostname;
  const secure = hostname !== "localhost" && hostname !== "127.0.0.1";
  return COOKIE + "=" + token + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=" +
    (SESSION_MS / 1000) + (secure ? "; Secure" : "");
}

export function clearSessionCookie(req: Request) {
  const hostname = new URL(req.url).hostname;
  const secure = hostname !== "localhost" && hostname !== "127.0.0.1";
  return COOKIE + "=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" +
    (secure ? "; Secure" : "");
}

export function verifyPassphrase(candidate: string) {
  if (!configured()) return false;
  const expected = createHash("sha256").update(env("JOB_DASHBOARD_PASSPHRASE")).digest();
  const actual = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(actual, expected);
}

function attemptStore() {
  // Deploy previews may not mutate production rate-limit counters.
  const production = (globalThis as any).Netlify?.context?.deploy?.context === "production";
  return production ? getStore("job-search-auth-attempts", { consistency: "strong" })
    : getDeployStore("job-search-auth-attempts");
}

function attemptKey(ip: string) {
  // Netlify's trusted request context is preferred over client-supplied headers.
  const stableIp = ip || "unknown";
  return createHmac("sha256", env("JOB_DASHBOARD_SESSION_SECRET"))
    .update(stableIp).digest("hex");
}

type Attempts = { count: number; windowStart: number };
export async function loginAllowed(ip: string): Promise<boolean> {
  const record = await attemptStore().get(attemptKey(ip), { type: "json" }) as Attempts | null;
  if (!record || Date.now() - record.windowStart >= WINDOW_MS) return true;
  return record.count < MAX_FAILURES;
}

export async function recordFailure(ip: string) {
  const store = attemptStore(), key = attemptKey(ip);
  const previous = await store.get(key, { type: "json" }) as Attempts | null;
  const now = Date.now();
  const recent = previous && now - previous.windowStart < WINDOW_MS;
  await store.setJSON(key, {
    count: recent ? previous.count + 1 : 1,
    windowStart: recent ? previous.windowStart : now
  });
}

export function unauthorized() {
  return json({ error: "Unlock required" }, 401);
}
