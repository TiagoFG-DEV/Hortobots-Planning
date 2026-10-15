import { BIOGLOW_SEASON, OBR_2026_SCORING, performancePercent } from '@hortobots/shared';
import { ExternalLink, Target } from 'lucide-react';

type Attempt = { score: number; time: number; failures: number };

export function PerformancePanel({ attempts, modality, maximum }: { attempts: Attempt[]; modality: string; maximum?: number }) {
  const configuredMaximum = maximum || (modality === 'FLL' ? BIOGLOW_SEASON.maximumScore : 0);
  const best = attempts.length ? Math.max(...attempts.map(item => Number(item.score) || 0)) : 0;
  const average = attempts.length ? attempts.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / attempts.length : 0;
  const bestPercent = performancePercent(best, configuredMaximum);
  const averagePercent = performancePercent(average, configuredMaximum);
  const source = modality === 'FLL' ? BIOGLOW_SEASON.officialRulebookUrl : OBR_2026_SCORING.officialRulesUrl;
  return <section className="performance-panel" aria-label="Aproveitamento da temporada">
    <header><Target size={22} /><div><span className="kicker">APROVEITAMENTO</span><h3>{modality === 'FLL' ? `${BIOGLOW_SEASON.name} ${BIOGLOW_SEASON.cycle}` : `${OBR_2026_SCORING.name} ${OBR_2026_SCORING.cycle}`}</h3></div></header>
    {configuredMaximum > 0 ? <>
      <div className="performance-numbers"><strong>{bestPercent.toFixed(1)}%</strong><span>melhor resultado: {best} de {configuredMaximum} pontos</span></div>
      <div className="performance-track"><i style={{ width: `${bestPercent}%` }} /></div>
      <div className="performance-meta"><span>Média: {average.toFixed(1)} pts ({averagePercent.toFixed(1)}%)</span><span>Potencial restante: {Math.max(0, configuredMaximum - best).toFixed(0)} pts</span></div>
    </> : <p className="performance-variable">Na OBR, a pontuação máxima depende da arena. Informe a referência da rodada para calcular o aproveitamento.</p>}
    <a href={source} target="_blank" rel="noreferrer">Consultar regra oficial <ExternalLink size={14} /></a>
    {modality === 'FLL' && <a href={BIOGLOW_SEASON.officialUpdatesUrl} target="_blank" rel="noreferrer">Atualizações oficiais da temporada <ExternalLink size={14} /></a>}
    {modality === 'FLL' && <details className="season-score-details">
      <summary>Ver pontuação completa da mesa</summary>
      <div className="season-score-summary"><span>Inspeção: {BIOGLOW_SEASON.equipmentInspectionPoints} pts</span><span>Discos de precisão: até 50 pts</span><strong>Total: {BIOGLOW_SEASON.maximumScore} pts</strong></div>
      <div className="season-mission-list">{BIOGLOW_SEASON.missions.map(mission => <article key={mission.id}>
        <div><strong>{mission.id}</strong><span>{mission.name}</span><b>{mission.minimum === mission.maximum ? mission.maximum : `${mission.minimum}–${mission.maximum}`} pts</b></div>
        <p>{mission.scoring.join(' • ')}</p>
        <small>{mission.shared ? 'MISSÃO COMPARTILHADA' : ''}{mission.shared && mission.losable ? ' • ' : ''}{mission.losable ? 'PONTOS PERDÍVEIS CONFORME A CONDIÇÃO' : ''}</small>
      </article>)}</div>
      <p className="precision-scale">Discos restantes: {BIOGLOW_SEASON.precisionTokens.slice(1).map(item => `${item.remaining} = ${item.points}`).join(' • ')} pontos.</p>
    </details>}
  </section>;
}
