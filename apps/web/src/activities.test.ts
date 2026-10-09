import { describe, expect, it } from 'vitest';
import { findActivities, type ActivityEntry } from './activities';
import { getTeamKey, notebookRoute, teamFromRoute, withTeamTag, TEAMS, type TeamKey } from './teams';

const items: ActivityEntry[] = [
  { kind: 'record', item: { id: '1', modality: 'FLL', title: 'Programação de trajetórias', date: '2026-10-06', tags: ['pesquisa'], summary: 'Calibração do sensor', media: [{ name: 'montagem.png' }] } },
  { kind: 'test', item: { id: '2', modality: 'FLL', team: 'UnderConstruction', title: 'Precisão', date: '2026-10-08', objective: 'Calibrar sensor' } },
  { kind: 'record', item: { id: '3', modality: 'OBR', title: 'Resgate', date: '2026-10-07', tags: ['pesquisa'] } },
  { kind: 'event', item: { id: '4', title: 'Treino geral', date: '2026-10-09', comments: 'Organizar materiais' } },
  { kind: 'record', item: { id: '5', modality: 'FLL', title: 'Montagem', date: '2026-10-08', tags: [TEAMS.under.label], createdAt: '2026-10-08T18:00:00Z' } }
];
describe('Team identity', () => {
  it('maps the three independent notebook routes to the correct competition', () => {
    const routes = [
      ['fll', 'fll', 'FLL'],
      ['underconstruction', 'under', 'FLL'],
      ['obr', 'obr', 'OBR']
    ] as const;
    for (const [route, key, modality] of routes) {
      expect(teamFromRoute(route)).toBe(key);
      expect(TEAMS[key].route).toBe(route);
      expect(TEAMS[key].modality).toBe(modality);
    }
  });

  it('recognizes both stored names and tags without changing the FLL modality', () => {
    expect(getTeamKey({ modality: 'FLL', team: 'Under Construction' })).toBe('under');
    expect(getTeamKey(items[4]!.item)).toBe('under');
    expect(getTeamKey({ modality: 'OBR', team: 'Hortobots' })).toBe('obr');
    expect(getTeamKey({ modality: 'FLL' })).toBe('fll');
  });
  it('replaces only the team tag, preserving the other tags', () => {
    expect(getTeamKey({ modality: 'FLL', tags: ['visita-underconstruction'] })).toBe('fll');
    expect(withTeamTag(['pesquisa', TEAMS.fll.label, 'UnderConstruction'], 'under')).toEqual(['pesquisa', TEAMS.under.label]);
    expect(withTeamTag(withTeamTag(['treino'], 'obr'), 'obr')).toEqual(['treino', TEAMS.obr.label]);
  });

  it('resolves legacy Under Construction records and tests to their own notebook', () => {
    for (const tag of ['UnderConstruction', 'Under Construction (FLL)', 'teamunderconstruction']) {
      expect(notebookRoute({ modality: 'FLL', tags: ['treino', tag] })).toBe('underconstruction');
    }
    for (const team of ['UnderConstruction', 'Under Construction']) {
      expect(notebookRoute({ modality: 'FLL', team })).toBe('underconstruction');
    }
    expect(notebookRoute({ modality: 'FLL', tags: ['treino'] })).toBe('fll');
    expect(notebookRoute({ modality: 'FLL', team: 'Hortobots' })).toBe('fll');
    expect(notebookRoute({ modality: 'obr', team: 'Hortobots' })).toBe('obr');
  });

  it('keeps OBR modality authoritative even if an old record has a conflicting team tag', () => {
    const item = { modality: 'OBR', tags: [TEAMS.under.label] };
    expect(getTeamKey(item)).toBe('obr');
    expect(notebookRoute(item)).toBe('obr');
  });

  it('builds stable creation payload identities for each notebook without changing user tags', () => {
    const originalTags = ['treino', 'sensor'];
    for (const key of ['fll', 'under', 'obr'] as const) {
      const record = { modality: TEAMS[key].modality, tags: withTeamTag(originalTags, key) };
      const test = { modality: TEAMS[key].modality, team: TEAMS[key].storedName };
      expect(getTeamKey(record)).toBe(key);
      expect(getTeamKey(test)).toBe(key);
      expect(notebookRoute(record)).toBe(TEAMS[key].route);
      expect(notebookRoute(test)).toBe(TEAMS[key].route);
      expect(withTeamTag(record.tags, key)).toEqual(record.tags);
    }
    expect(originalTags).toEqual(['treino', 'sensor']);
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
  it('partitions mixed fixtures into three disjoint notebooks and routes every item back to its notebook', () => {
    const expected: Record<TeamKey, string[]> = { fll: ['1'], under: ['5', '2'], obr: ['3'] };
    const listedIds: string[] = [];
    for (const key of ['fll', 'under', 'obr'] as const) {
      const filtered = findActivities(items, '', key, '');
      expect(filtered.map(entry => entry.item.id)).toEqual(expected[key]);
      for (const { item } of filtered) {
        expect(notebookRoute(item)).toBe(TEAMS[key].route);
        listedIds.push(item.id);
      }
    }
    expect(new Set(listedIds).size).toBe(listedIds.length);
    expect(listedIds.sort()).toEqual(items.filter(entry => entry.kind !== 'event').map(entry => entry.item.id).sort());
  });
  it('keeps unassigned events in the general agenda and handles empty results', () => {
    expect(findActivities(items, 'materiais', '', 'event').map(x => x.item.id)).toEqual(['4']);
    expect(findActivities(items, '', 'under', 'event')).toEqual([]);
    expect(findActivities([], '', '', '')).toEqual([]);
    expect(findActivities(items, 'inexistente', '', '')).toEqual([]);
  });
});
