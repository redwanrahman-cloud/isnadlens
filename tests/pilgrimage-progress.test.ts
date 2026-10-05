import { describe, expect, it } from 'vitest';
import { createProgress, progressSummary, recordProgress, undoProgress, resetProgress, restoreProgress } from '../src/lib/pilgrimage-progress';

describe('manual pilgrimage progress', () => {
  it('answers the two-completed example with five remaining', () => {
    const first = recordProgress(createProgress(), 'tawaf', 'completed');
    const second = recordProgress(first, 'tawaf', 'completed');
    expect(progressSummary(second, 'tawaf')).toEqual({ completed: 2, remaining: 5, uncertain: false, countRecorded: false });
    expect(first.events).toHaveLength(1);
  });
  it('keeps Tawaf and Sai separate when correcting an accidental tap', () => {
    let state = recordProgress(createProgress(), 'tawaf', 'completed');
    state = recordProgress(state, 'sai', 'completed');
    state = recordProgress(state, 'tawaf', 'completed');
    state = undoProgress(state, 'tawaf');
    expect(progressSummary(state, 'tawaf').completed).toBe(1);
    expect(progressSummary(state, 'sai').completed).toBe(1);
  });
  it('caps both counts at seven without claiming ritual validity', () => {
    for (const activity of ['tawaf', 'sai'] as const) {
      let state = createProgress();
      for (let index = 0; index < 7; index++) state = recordProgress(state, activity, 'completed');
      expect(progressSummary(state, activity)).toEqual({ completed: 7, remaining: 0, uncertain: false, countRecorded: true });
      expect(() => recordProgress(state, activity, 'completed')).toThrow('COUNT_FULL');
    }
  });
  it('does not invent a religious ruling for a doubtful count', () => {
    let state = recordProgress(createProgress(), 'tawaf', 'completed');
    state = recordProgress(state, 'tawaf', 'uncertain');
    expect(progressSummary(state, 'tawaf').uncertain).toBe(true);
    expect(() => recordProgress(state, 'tawaf', 'completed')).toThrow('COUNT_UNCERTAIN');
    expect(progressSummary(undoProgress(state, 'tawaf'), 'tawaf').completed).toBe(1);
  });
  it('resumes a valid record and rejects corrupted, overcounted or future-version saves', () => {
    const state = recordProgress(createProgress(), 'sai', 'completed');
    expect(restoreProgress(JSON.stringify(state))).toEqual(state);
    for (const value of ['{', JSON.stringify({ version: 2, events: [] }), JSON.stringify({ version: 1, events: [{ activity: 'hajj', kind: 'completed' }] }), JSON.stringify({ version: 1, events: Array(8).fill({ activity: 'sai', kind: 'completed' }) })]) expect(restoreProgress(value)).toBeNull();
  });
  it('rejects an increment after recorded doubt during resume', () => {
    expect(restoreProgress(JSON.stringify({ version: 1, events: [{ activity: 'tawaf', kind: 'uncertain' }, { activity: 'tawaf', kind: 'completed' }] }))).toBeNull();
  });
  it('resets one activity and makes empty undo harmless', () => {
    let state = recordProgress(createProgress(), 'tawaf', 'completed');
    state = recordProgress(state, 'sai', 'completed');
    state = resetProgress(state, 'tawaf');
    expect(undoProgress(state, 'tawaf')).toEqual(state);
    expect(progressSummary(state, 'sai').completed).toBe(1);
  });
});
