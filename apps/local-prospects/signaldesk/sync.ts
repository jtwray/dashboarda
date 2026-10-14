export type Fields = Record<string, string>;
export interface AirtableRecord { id: string; fields: Fields }
export interface Destination {
  list(): Promise<AirtableRecord[]>;
  upsert(fields: Fields[]): Promise<void>;
}
export class SyncError extends Error {
  code: string;
  status?: number;
  constructor(code: string, status?: number) { super(code); this.code = code; this.status = status; }
}
const optional = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new SyncError('invalid_source_field');
  return value;
};
const date = (value: unknown): string => {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new SyncError('invalid_source_timestamp');
  }
  return new Date(value).toISOString();
};
export function mapProspect(item: unknown): Fields {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new SyncError('invalid_source_item');
  const p = item as Record<string, unknown>;
  if (typeof p._key !== 'string' || !p._key.trim() || typeof p.business !== 'string' || !p.business.trim()) {
    throw new SyncError('missing_source_identity');
  }
  return {
    'External ID': `local-prospects:${p._key}`,
    'Business name': p.business,
    'Website': optional(p.url),
    'Location': optional(p.location),
    'Industry/workflow': optional(p.workflow),
    'Automation opportunity': optional(p.hypothesis),
    'Contact information': [optional(p.contactRole), optional(p.phone), optional(p.email)].filter(Boolean).join('\n'),
    'First seen': date(p.firstSeenAt),
    'Last seen': date(p.lastSeenAt),
  };
}
export interface Outcome {
  status: 'success' | 'partial' | 'failed' | 'disabled';
  source: number; unchanged: number; confirmed: number; uncertain: number; pending: number;
  error?: string;
}
export const emptyOutcome = (): Outcome => ({ status: 'success', source: 0, unchanged: 0, confirmed: 0, uncertain: 0, pending: 0 });
export async function syncProspects(state: unknown, api: Destination): Promise<Outcome> {
  const out = emptyOutcome();
  try {
    if (!state || typeof state !== 'object' || !Array.isArray((state as {items?: unknown}).items)) {
      throw new SyncError('invalid_source_state');
    }
    const items = (state as {items: unknown[]}).items;
    out.source = items.length;
    // Validate the complete snapshot before any external write.
    const mapped = items.map(mapProspect);
    const ids = new Set<string>();
    for (const f of mapped) {
      if (ids.has(f['External ID'])) throw new SyncError('duplicate_source_identity');
      ids.add(f['External ID']);
    }
    if (!mapped.length) return out;
    const existing = new Map<string, Fields>();
    for (const record of await api.list()) {
      const id = record.fields['External ID'];
      if (!id) continue; // Unmanaged Airtable rows are never touched.
      if (existing.has(id)) throw new SyncError('duplicate_destination_identity');
      existing.set(id, record.fields);
    }
    const changes = mapped.filter(f => {
      const old = existing.get(f['External ID']);
      const same = old && Object.entries(f).every(([k, v]) => {
        // Airtable omits empty fields and may normalize datetime formatting.
        const previous = old[k] ?? '';
        return k.endsWith(' seen') ? Date.parse(previous) === Date.parse(v) : previous === v;
      });
      if (same) out.unchanged++;
      return !same;
    });
    out.pending = changes.length;
    for (let i = 0; i < changes.length; i += 10) {
      const batch = changes.slice(i, i + 10);
      try { await api.upsert(batch); }
      catch (e) {
        // A timeout / malformed acknowledgement can follow a committed write.
        // Conservatively count every unacknowledged batch: earlier retries may have committed.
        out.uncertain = batch.length;
        throw e;
      }
      out.confirmed += batch.length;
      out.pending -= batch.length;
    }
  } catch (e) {
    out.status = out.confirmed ? 'partial' : 'failed';
    out.error = e instanceof SyncError ? e.code : 'unexpected_sync_failure';
  }
  return out;
}
