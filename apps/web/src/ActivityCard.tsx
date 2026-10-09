import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, FileText, ChartNoAxesCombined, ArrowUpRight } from 'lucide-react';
import { displayDate, getTeamKey, TEAMS } from './teams';

export type ActivityKind = 'record' | 'test' | 'event';
export interface ActivitySource {
  id: string; title: string; date: string; modality?: string; team?: string; tags?: string[];
  summary?: string; body?: string; objective?: string; comments?: string; mission?: string;
  priority?: string; status?: string; period?: string; lesson?: string; createdAt?: string;
  media?: Array<{ name?: string; originalName?: string }>;
}
export const KIND_LABELS = { record: 'Registro', test: 'Teste', event: 'Evento' };
export function ActivityCard({ item, kind, children }: { item: ActivitySource; kind: ActivityKind; children?: ReactNode }) {
  const team = kind === 'event' && !item.team && !item.modality ? 'general' : getTeamKey(item);
  const label = team === 'general' ? 'Agenda geral' : TEAMS[team].label;
  const Icon = kind === 'record' ? FileText : kind === 'test' ? ChartNoAxesCombined : CalendarDays;
  const modality = item.modality?.toLowerCase() === 'obr' ? 'obr' : 'fll';
  const url = kind === 'record' ? `/${modality}/registro/${item.id}` : `/${modality}/teste/${item.id}`;
  const description = item.summary || item.objective || item.comments;
  const heading = <><span className="activity-icon"><Icon size={22} /></span><div className="activity-heading"><span className="activity-kind">{KIND_LABELS[kind]}</span><h3>{item.title}</h3></div>{kind !== 'event' && <ArrowUpRight className="activity-open" size={18} />}</>;
  return <article className={`activity-card activity-${kind}`} data-team={team}>
    <div className="activity-meta"><span className="team-badge">{label}</span><time dateTime={item.date}>{displayDate(item.date)}</time></div>
    {kind === 'event' ? <div className="activity-main">{heading}</div> : <Link className="activity-main" to={url}>{heading}</Link>}
    {kind === 'event' && <div className="activity-event-info"><span>{item.period} · {item.lesson}</span><span className={item.priority === 'URGENTE' ? 'activity-urgent' : ''}>{item.priority}{item.priority === 'URGENTE' ? ` · ${item.status}` : ''}</span></div>}
    {description && kind !== 'event' && <p className="activity-excerpt">{description}</p>}
    {kind === 'event' && item.comments && <details className="activity-description"><summary>Detalhes do evento</summary><p>{item.comments}</p></details>}
    {children && <div className="activity-actions">{children}</div>}
  </article>;
}
