import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';
import { run } from '../../signaldesk/runner.ts';

export default async (_req: Request, context: Context) => {
  const outcome = await run({
    production: context.deploy.context === 'production',
    env: name => Netlify.env.get(name),
    read: () => getStore({name: 'dashboard-state', consistency: 'strong'}).get('state', {type: 'json'}),
    report: value => getStore({name: 'signaldesk-status', consistency: 'strong'}).setJSON('latest', value).then(() => undefined),
    log: value => console.log(JSON.stringify({event: 'signaldesk_sync', ...value})),
  });
  // Failure in platform invocation logs as well as sanitized persistent status.
  if (outcome.status === 'failed' || outcome.status === 'partial') throw new Error(`SignalDesk ${outcome.error}`);
  return Response.json(outcome);
};
// Daily at 13:20 UTC (9:20 EDT / 8:20 EST), production deploys only.
export const config: Config = { schedule: '20 13 * * *' };
