import { airtableClient } from './airtable.ts';
import { emptyOutcome, SyncError, syncProspects, type Destination, type Outcome } from './sync.ts';
export interface Runtime {
  production: boolean;
  env(name: string): string | undefined;
  read(): Promise<unknown>;
  report(value: Outcome & {at: string}): Promise<void>;
  log(value: Outcome & {at: string}): void;
  client?: (config: {token: string; base: string; table: string}) => Destination;
}
export async function run(io: Runtime): Promise<Outcome> {
  if (!io.production || io.env('SIGNALDESK_ENABLED') !== 'true') {
    return { ...emptyOutcome(), status: 'disabled' };
  }
  let result: Outcome;
  try {
    const token = io.env('AIRTABLE_TOKEN') ?? '';
    const base = io.env('AIRTABLE_BASE_ID') ?? '';
    const table = io.env('AIRTABLE_PROSPECTS_TABLE_ID') ?? '';
    const client = (io.client ?? airtableClient)({token, base, table});
    result = await syncProspects(await io.read(), client);
  } catch (e) {
    result = { ...emptyOutcome(), status: 'failed', error: e instanceof SyncError ? e.code : 'source_or_configuration_failure' };
  }
  const report = { ...result, at: new Date().toISOString() };
  io.log(report);
  try { await io.report(report); }
  catch { throw new SyncError('sync_report_persistence_failure'); }
  return result;
}
