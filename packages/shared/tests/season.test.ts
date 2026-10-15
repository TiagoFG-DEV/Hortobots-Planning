import { describe, expect, it } from 'vitest';
import { BIOGLOW_SEASON, OBR_2026_SCORING, performancePercent } from '../src/season.js';

describe('season scoring', () => {
  it('keeps the BIOGLOW mission ceiling linked to the official table maximum', () => {
    const missions = BIOGLOW_SEASON.missions.reduce((total, mission) => total + mission.maximum, 0);
    const precision = Math.max(...BIOGLOW_SEASON.precisionTokens.map(token => token.points));
    expect(missions + BIOGLOW_SEASON.equipmentInspectionPoints + precision).toBe(BIOGLOW_SEASON.maximumScore);
    expect(BIOGLOW_SEASON.maximumScore).toBe(530);
  });

  it('identifies the shared mission and preserves partial/losable metadata', () => {
    expect(BIOGLOW_SEASON.missions.find(mission => mission.id === 'M07')).toMatchObject({ shared: true, maximum: 30 });
    expect(BIOGLOW_SEASON.missions.filter(mission => mission.losable).map(mission => mission.id)).toEqual(['M04', 'M10']);
  });

  it('uses an arena-specific maximum for OBR and clamps performance percentages', () => {
    expect(OBR_2026_SCORING.maximumScore).toBeNull();
    expect(performancePercent(265, 530)).toBe(50);
    expect(performancePercent(800, 530)).toBe(100);
    expect(performancePercent(-1, 530)).toBe(0);
  });
});
