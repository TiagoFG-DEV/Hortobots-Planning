import { describe, expect, it } from 'vitest';
import { belongsToSesiHortobotsFll } from './teamContent.js';

describe('SESI Hortobots FLL public archive filter', () => {
  it('includes explicit and legacy SESI Hortobots FLL content', () => {
    expect(belongsToSesiHortobotsFll({ modality: 'FLL', team: 'Hortobots' })).toBe(true);
    expect(belongsToSesiHortobotsFll({ modality: 'FLL', tags: ['programacao'] })).toBe(true);
  });

  it('excludes Under Construction and OBR content', () => {
    expect(belongsToSesiHortobotsFll({ modality: 'FLL', team: 'UnderConstruction' })).toBe(false);
    expect(belongsToSesiHortobotsFll({ modality: 'FLL', tags: ['Under Construction (FLL)'] })).toBe(false);
    expect(belongsToSesiHortobotsFll({ modality: 'OBR', team: 'Hortobots' })).toBe(false);
  });
});
