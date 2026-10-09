import type { ActivityKind, ActivitySource } from './ActivityCard';
import { TEAMS, displayDate, getTeamKey, normalizeText, type TeamKey } from './teams';

export type ActivityEntry = { kind: ActivityKind; item: ActivitySource };
export function findActivities(items: ActivityEntry[], query: string, teamFilter: TeamKey | '', kindFilter: ActivityKind | '') {
  const words = normalizeText(query).trim().split(/\s+/).filter(Boolean);
  return items.filter(({ kind, item }) => {
    const generalEvent = kind === 'event' && !item.team && !item.modality;
    if (kindFilter && kind !== kindFilter) return false;
    if (teamFilter && (generalEvent || getTeamKey(item) !== teamFilter)) return false;
    const text = normalizeText([
      item.title, item.date, displayDate(item.date), item.summary, item.body, item.objective, item.comments, item.mission,
      item.priority, item.status, item.period, item.lesson,
      ...(item.tags || []), ...(item.media || []).map(media => media.name || media.originalName),
      generalEvent ? 'Agenda geral' : TEAMS[getTeamKey(item)].label
    ].filter(Boolean).join(' '));
    return words.every(word => text.includes(word));
  }).sort((a, b) => String(b.item.date).localeCompare(String(a.item.date)) || String(b.item.createdAt || '').localeCompare(String(a.item.createdAt || '')) || a.item.id.localeCompare(b.item.id));
}
