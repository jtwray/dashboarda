import { z } from 'zod';

export const DASHBOARDS = ['email-action', 'christian-jobs', 'local-prospects', 'job-rates', 'jeep-watch'] as const;
export const readInput = z.object({ dashboard: z.enum(DASHBOARDS), limit: z.number().int().min(1).max(50).default(20) }).strict();
export const upsertInput = z.object({ dashboard: z.enum(DASHBOARDS), items: z.array(z.record(z.string(), z.unknown())).min(1).max(50) }).strict();
export type Dashboard = typeof DASHBOARDS[number];
export const ROUTES: Record<Dashboard, { url: string; prefix: string }> = {
  'email-action': { url: 'https://dashboarda-email-action.netlify.app/api/state', prefix: 'EMAIL_ACTION' },
  'christian-jobs': { url: 'https://dashboarda-christian-jobs.netlify.app/api/state', prefix: 'CHRISTIAN_JOBS' },
  'local-prospects': { url: 'https://dashboarda-local-prospects.netlify.app/api/state', prefix: 'LOCAL_PROSPECTS' },
  'job-rates': { url: 'https://dashboarda-job-rates.netlify.app/api/state', prefix: 'JOB_RATES' },
  'jeep-watch': { url: 'https://dashboarda-jeep-watch.netlify.app/api/state', prefix: 'JEEP_WATCH' },
};
export interface Downstream { env: (name: string) => string | undefined; fetch: typeof fetch }
const stateSchema = z.object({ items: z.array(z.record(z.string(), z.unknown())), runs: z.number().int().nonnegative(), updatedAt: z.string().nullable() });
export class DashboardError extends Error {
  constructor(public code: string, public uncertain = false, public status?: number) { super(code); }
}
async function state(dashboard: Dashboard, items: Record<string, unknown>[] | undefined, io: Downstream) {
  const route = ROUTES[dashboard];
  const write = items !== undefined;
  const secret = io.env(`${route.prefix}_${write ? 'WRITE_TOKEN' : 'READ_PIN'}`);
  if (!secret) throw new DashboardError('missing_downstream_configuration');
  const signal = AbortSignal.timeout(10000);
  let response: Response;
  try {
    response = await io.fetch(route.url, {
      method: write ? 'POST' : 'GET', redirect: 'error', signal,
      headers: write ? { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' } : { 'x-dashboard-pin': secret },
      ...(write ? { body: JSON.stringify({ items }) } : {}),
    });
  } catch {
    throw new DashboardError(signal.aborted ? 'downstream_timeout' : 'downstream_network_failure', write);
  }
  // Never echo downstream bodies/errors; they may contain credentials or sensitive data.
  if (!response.ok) {
    const auth = response.status === 401 || response.status === 403;
    throw new DashboardError(auth ? 'downstream_auth_failure' : response.status >= 500 ? 'downstream_server_failure' : 'downstream_request_failure', write && !auth, response.status);
  }
  try {
    return stateSchema.parse(await response.json());
  } catch {
    throw new DashboardError(signal.aborted ? 'downstream_timeout' : 'malformed_downstream_response', write);
  }
}
export async function dashboardRead(input: z.input<typeof readInput>, io: Downstream) {
  const { dashboard, limit } = readInput.parse(input);
  const result = await state(dashboard, undefined, io);
  return { dashboard, total: result.items.length, runs: result.runs, updatedAt: result.updatedAt, items: result.items.slice(0, limit) };
}
export async function dashboardUpsert(input: z.input<typeof upsertInput>, io: Downstream) {
  const { dashboard, items } = upsertInput.parse(input);
  const result = await state(dashboard, items, io);
  return { dashboard, received: items.length, total: result.items.length, runs: result.runs, updatedAt: result.updatedAt };
}
