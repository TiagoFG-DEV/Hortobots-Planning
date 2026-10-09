export type TeamKey = 'fll' | 'under' | 'obr';
export const TEAMS: Record<TeamKey, { label: string; short: string; storedName: string }> = {
  fll: { label: 'SESI Hortobots (FLL)', short: 'SESI Hortobots', storedName: 'Hortobots' },
  under: { label: 'Under Construction (FLL)', short: 'Under Construction', storedName: 'UnderConstruction' },
  obr: { label: 'Hortobots (OBR)', short: 'Hortobots', storedName: 'Hortobots' }
};
export const normalizeText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const compact = (value: string) => normalizeText(value).replace(/[^a-z0-9]/g, '');
export function getTeamKey(item: { modality?: string; team?: string; tags?: string[] }): TeamKey {
  if (item.modality?.toUpperCase() === 'OBR') return 'obr';
  return [item.team || '', ...(item.tags || [])].some(value => compact(value).includes('underconstruction')) ? 'under' : 'fll';
}
export function isTeamTag(tag: string) {
  return Object.values(TEAMS).some(team => compact(team.label) === compact(tag)) || ['underconstruction', 'sesihortobots', 'teamunderconstruction', 'teamfll', 'teamobr'].includes(compact(tag));
}
export const withTeamTag = (tags: string[], team: TeamKey) => [...tags.filter(tag => !isTeamTag(tag)), TEAMS[team].label];
export const displayDate = (date: string) => /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10).split('-').reverse().join('/') : 'Data não informada';
