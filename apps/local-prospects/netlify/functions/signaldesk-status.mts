import { getStore, getDeployStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';
export default async (req: Request, context: Context) => {
  const pin = Netlify.env.get('DASHBOARD_READ_PIN');
  if (!pin || req.headers.get('x-dashboard-pin') !== pin) return new Response('Unauthorized', {status: 401});
  const store = context.deploy.context === 'production'
    ? getStore({name: 'signaldesk-status', consistency: 'strong'}) : getDeployStore('signaldesk-status');
  return Response.json(await store.get('latest', {type: 'json'}) ?? {status: 'never_run'}, {headers: {'Cache-Control': 'no-store'}});
};
export const config: Config = {path: '/api/signaldesk/status', method: 'GET'};
