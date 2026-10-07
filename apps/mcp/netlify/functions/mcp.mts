import type { Config, Context } from '@netlify/functions';
import { handleRequest, readConfig } from '../../src/app.js';

export default async (request: Request, context: Context) => {
  const started = performance.now();
  let response: Response;
  try {
    const config = readConfig(name => Netlify.env.get(name));
    response = await handleRequest(request, config);
  } catch {
    response = Response.json({ error: 'server_configuration_unavailable' }, { status: 503 });
  }
  console.info(JSON.stringify({ requestId: context.requestId, status: response.status, durationMs: Math.round(performance.now() - started) }));
  return response;
};

export const config: Config = {
  path: ['/mcp', '/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp'],
};
