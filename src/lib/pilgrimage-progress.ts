/** A user's manual counting record, never a ruling on ritual validity. */
export type PilgrimageActivity = 'tawaf' | 'sai';
export type ProgressEvent = { activity: PilgrimageActivity; kind: 'completed' | 'uncertain' };
export type PilgrimageProgress = { version: 1; events: ProgressEvent[] };

export const PROGRESS_REFERENCE = {
  publisher: 'HadeethEnc',
  url: 'https://hadeethenc.com/en/browse/hadith/3309',
  record: 'en:3309',
  quotationSha256: '8c3f8c026f30983b342a7e41b196a0864b5983abc832ffa75afed65794838236',
  total: 7,
  context: 'The report describes the Farewell Hajj, including seven circuits of Tawaf and seven rounds of Sai. Its Hajj-specific Ihram instructions are not a standalone Umrah guide.',
} as const;

export function createProgress(): PilgrimageProgress {
  return { version: 1, events: [] };
}

export function progressSummary(state: PilgrimageProgress, activity: PilgrimageActivity) {
  const completed = state.events.filter(event => event.activity === activity && event.kind === 'completed').length;
  const uncertain = state.events.some(event => event.activity === activity && event.kind === 'uncertain');
  return {
    completed,
    remaining: PROGRESS_REFERENCE.total - completed,
    uncertain,
    // A fully recorded count does not certify completion/validity of the worship.
    countRecorded: completed === PROGRESS_REFERENCE.total && !uncertain,
  };
}

/** Record one user's explicit action. Doubt freezes increments until undone/reset. */
export function recordProgress(state: PilgrimageProgress, activity: PilgrimageActivity, kind: ProgressEvent['kind']): PilgrimageProgress {
  if (!['tawaf', 'sai'].includes(activity) || !['completed', 'uncertain'].includes(kind)) throw new Error('PROGRESS_ACTION_INVALID');
  const summary = progressSummary(state, activity);
  if (summary.uncertain) throw new Error('PROGRESS_COUNT_UNCERTAIN');
  if (summary.completed === PROGRESS_REFERENCE.total && kind === 'completed') throw new Error('PROGRESS_COUNT_FULL');
  return { version: 1, events: [...state.events, { activity, kind }] };
}

/** Undo the latest action in the selected activity without changing the other. */
export function undoProgress(state: PilgrimageProgress, activity: PilgrimageActivity): PilgrimageProgress {
  const index = state.events.findLastIndex(event => event.activity === activity);
  return { version: 1, events: state.events.filter((_, position) => position !== index) };
}

export function resetProgress(state: PilgrimageProgress, activity: PilgrimageActivity): PilgrimageProgress {
  return { version: 1, events: state.events.filter(event => event.activity !== activity) };
}

/** Local resume accepts only a bounded versioned action log, with no personal data. */
export function restoreProgress(serialized: string): PilgrimageProgress | null {
  if (serialized.length > 4096) return null;
  try {
    const data: unknown = JSON.parse(serialized);
    if (!data || typeof data !== 'object') return null;
    const record = data as Record<string, unknown>;
    if (record.version !== 1 || !Array.isArray(record.events) || record.events.length > 16) return null;
    let state = createProgress();
    for (const event of record.events) {
      if (!event || typeof event !== 'object') return null;
      state = recordProgress(state, event.activity, event.kind);
    }
    return state;
  } catch { return null; }
}
