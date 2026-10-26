import type { Config } from "@netlify/functions";
import {
  configured, json, hasSession, sameOrigin, issueSession,
  sessionCookie, clearSessionCookie, verifyPassphrase,
  loginAllowed, recordFailure
} from "../../lib/auth.mts";

export default async function handler(req: Request) {
  if (!configured()) return json({ error: "Dashboard credentials are not configured." }, 503);
  if (req.method === "GET") {
    return hasSession(req) ? json({ authenticated: true }) :
      json({ authenticated: false }, 401);
  }
  if (req.method === "DELETE") {
    if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
    return json({ authenticated: false }, 200, {
      "Set-Cookie": clearSessionCookie(req)
    });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!sameOrigin(req)) return json({ error: "Invalid origin" }, 403);
  if (!(req.headers.get("content-type") ?? "").startsWith("application/json"))
    return json({ error: "JSON required" }, 415);
  try {
    if (!(await loginAllowed(req))) {
      return json({ error: "Too many attempts. Try again in 15 minutes." }, 429, {
        "Retry-After": "900"
      });
    }
    const body = await req.json();
    const passphrase = typeof body?.passphrase === "string" ? body.passphrase : "";
    if (passphrase.length > 1024 || !verifyPassphrase(passphrase)) {
      await recordFailure(req);
      return json({ error: "Incorrect passphrase." }, 401);
    }
    return json({ authenticated: true }, 200, {
      "Set-Cookie": sessionCookie(req, issueSession())
    });
  } catch {
    // If rate-limit storage is unavailable, fail closed instead of bypassing it.
    return json({ error: "Authentication temporarily unavailable." }, 503);
  }
}

export const config: Config = { path: "/api/session" };
