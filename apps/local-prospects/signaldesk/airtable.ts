import { SyncError, type AirtableRecord, type Destination, type Fields } from './sync.ts';
interface Options {
  token: string; base: string; table: string;
  fetch?: typeof fetch; sleep?: (ms: number) => Promise<void>; now?: () => number;
  budgetMs?: number;
}
export function airtableClient(options: Options): Destination {
  if (!options.token || !/^app[a-zA-Z0-9]+$/.test(options.base) || !/^tbl[a-zA-Z0-9]+$/.test(options.table)) {
    throw new SyncError('invalid_airtable_configuration');
  }
  const send = options.fetch ?? fetch;
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const now = options.now ?? Date.now;
  const deadline = now() + (options.budgetMs ?? 18000);
  const endpoint = `https://api.airtable.com/v0/${options.base}/${options.table}`;
  let nextAt = now();
  async function request(query: string, body?: unknown): Promise<Record<string, unknown>> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const delay = Math.max(0, nextAt - now());
      if (now() + delay + 1000 >= deadline) throw new SyncError('airtable_deadline');
      await sleep(delay);
      let r: Response;
      let data: unknown;
      try {
        r = await send(endpoint + query, {
          method: body ? 'PATCH' : 'GET', redirect: 'error',
          headers: { Authorization: `Bearer ${options.token}`, 'Content-Type': 'application/json' },
          ...(body ? {body: JSON.stringify(body)} : {}),
          signal: AbortSignal.timeout(Math.min(5000, Math.max(1, deadline - now()))),
        });
        // Serialize all calls at <=4/sec, including pagination and retries.
        nextAt = now() + 260;
      } catch {
        nextAt = now() + 500 * (2 ** attempt);
        if (attempt === 2) throw new SyncError('airtable_network_failure');
        continue;
      }
      if (r.ok) {
        try { data = await r.json(); }
        catch { throw new SyncError('airtable_invalid_response'); }
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new SyncError('airtable_invalid_response');
        return data as Record<string, unknown>;
      }
      // Do not read or echo error bodies: they can contain data and credentials.
      if (r.status === 429) {
        // Airtable requires a 30-second cooldown; this exceeds scheduled budget.
        throw new SyncError('airtable_rate_limited_retry_next_run', 429);
      }
      if (r.status >= 500 && attempt < 2) { nextAt = now() + 500 * (2 ** attempt); continue; }
      throw new SyncError('airtable_http_failure', r.status);
    }
    throw new SyncError('airtable_retry_exhausted');
  }
  return {
    async list() {
      const all: AirtableRecord[] = [];
      let offset: string | undefined;
      const offsets = new Set<string>();
      do {
        const q = new URLSearchParams({pageSize: '100'});
        if (offset) q.set('offset', offset);
        const page = await request(`?${q}`);
        if (!Array.isArray(page.records)) throw new SyncError('airtable_invalid_response');
        for (const r of page.records) {
          if (!r || typeof r.id !== 'string' || !r.fields || typeof r.fields !== 'object') throw new SyncError('airtable_invalid_response');
          all.push(r);
        }
        if (page.offset !== undefined && typeof page.offset !== 'string') throw new SyncError('airtable_invalid_response');
        offset = page.offset as string | undefined;
        if (offset && offsets.has(offset)) throw new SyncError('airtable_repeated_offset');
        if (offset) offsets.add(offset);
      } while (offset);
      return all;
    },
    async upsert(fields: Fields[]) {
      if (fields.length < 1 || fields.length > 10) throw new SyncError('invalid_batch_size');
      const result = await request('', {
        performUpsert: { fieldsToMergeOn: ['External ID'] },
        records: fields.map(fields => ({ fields })),
      });
      if (!Array.isArray(result.records) || result.records.length !== fields.length) throw new SyncError('airtable_invalid_acknowledgement');
      const returned = new Set(result.records.map(r => r?.fields?.['External ID']));
      if (fields.some(f => !returned.has(f['External ID']))) throw new SyncError('airtable_invalid_acknowledgement');
    },
  };
}
