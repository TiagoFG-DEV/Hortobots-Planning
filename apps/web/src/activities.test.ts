import { describe, expect, it } from 'vitest';
import { findActivities, type ActivityEntry } from './activities';
import { getTeamKey, withTeamTag, TEAMS } from './teams';

const items: ActivityEntry[] = [
  { kind: 'record', item: { id: '1', modality: 'FLL', title: 'Programação de trajetórias', date: '2026-10-06', tags: ['pesquisa'], summary: 'Calibração do sensor', media: [{ name: 'montagem.png' }] } },
  { kind: 'test', item: { id: '2', modality: 'FLL', team: 'UnderConstruction', title: 'Precisão', date: '2026-10-08', objective: 'Calibrar sensor' } },
  { kind: 'record', item: { id: '3', modality: 'OBR', title: 'Resgate', date: '2026-10-07', tags: ['pesquisa'] } },
  { kind: 'event', item: { id: '4', title: 'Treino geral', date: '2026-10-09', comments: 'Organizar materiais' } },
  { kind: 'record', item: { id: '5', modality: 'FLL', title: 'Montagem', date: '2026-10-08', tags: [TEAMS.under.label], createdAt: '2026-10-08T18:00:00Z' } }
];
describe('Team identity', () => {
  it('recognizes both stored names and tags without changing the FLL modality', () => {
    expect(getTeamKey({ modality: 'FLL', team: 'Under Construction' })).toBe('under');
    expect(getTeamKey(items[4]!.item)).toBe('under');
    expect(getTeamKey({ modality: 'OBR', team: 'Hortobots' })).toBe('obr');
    expect(getTeamKey({ modality: 'FLL' })).toBe('fll');
  });
  it('replaces only the team tag, preserving the other tags', () => {
    expect(withTeamTag(['pesquisa', TEAMS.fll.label, 'UnderConstruction'], 'under')).toEqual(['pesquisa', TEAMS.under.label]);
    expect(withTeamTag(withTeamTag(['treino'], 'obr'), 'obr')).toEqual(['treino', TEAMS.obr.label]);
  });
});
describe('General archive', () => {
  it('sorts by activity date, newest first, then submission time', () => {
    expect(findActivities(items, '', '', '').map(x => x.item.id)).toEqual(['4', '5', '2', '3', '1']);
    expect(items[0]!.item.id).toBe('1');
  });
  it('searches all words without accent or case sensitivity', () => {
    expect(findActivities(items, 'PROGRAMACAO calibracao', '', '').map(x => x.item.id)).toEqual(['1']);
    expect(findActivities(items, 'montagem.png', '', '').map(x => x.item.id)).toEqual(['1']);
    expect(findActivities(items, '06/10/2026', '', '').map(x => x.item.id)).toEqual(['1']);
  });
  it('combines type, team and tag filters', () => {
    expect(findActivities(items, '', 'under', 'record').map(x => x.item.id)).toEqual(['5']);
    expect(findActivities(items, 'pesquisa', 'obr', 'record').map(x => x.item.id)).toEqual(['3']);
    expect(findActivities(items, '', 'fll', '').map(x => x.item.id)).toEqual(['1']);
  });
  it('keeps unassigned events in the general agenda and handles empty results', () => {
    expect(findActivities(items, 'materiais', '', 'event').map(x => x.item.id)).toEqual(['4']);
    expect(findActivities(items, '', 'under', 'event')).toEqual([]);
    expect(findActivities([], '', '', '')).toEqual([]);
    expect(findActivities(items, 'inexistente', '', '')).toEqual([]);
  });
});
