import React, { useMemo, useState } from 'react';
import {
  BIOGLOW_SEASON,
  calculateMissionAssertiveness,
  getSeasonMission,
  calculatePrecisionPoints,
  type AttemptMission
} from '@hortobots/shared';
import { Target, Layers, Info, Calculator, Disc } from 'lucide-react';

export const ATTEMPT_COLORS = [
  '#22d3ee', // Cyan / Azul claro
  '#a78bfa', // Purple / Roxo
  '#fbbf24', // Amber / Amarelo
  '#34d399', // Emerald / Verde
  '#f43f5e', // Rose / Vermelho
  '#38bdf8', // Sky / Azul céu
  '#fb923c', // Orange / Laranja
  '#e879f9', // Fuchsia / Rosa
  '#a3e635', // Lime / Verde limão
  '#818cf8', // Indigo / Anil
  '#2dd4bf', // Teal / Turquesa
  '#f472b6', // Pink / Rosa choque
  '#facc15', // Yellow / Dourado
  '#60a5fa', // Blue / Azul royal
  '#4ade80'  // Light Green / Verde claro
];

export type ChartAttempt = {
  time: number;
  score: number;
  failures: number;
  observed?: number;
  inspectionBonus?: boolean;
  precisionTokensRemaining?: number;
  missions?: AttemptMission[];
};

interface MissionAssertivenessChartProps {
  attempts: ChartAttempt[];
  modality?: string;
  title?: string;
  forceAllMissions?: boolean;
  attemptLabelPrefix?: string;
}

export function MissionAssertivenessChart({
  attempts,
  modality = 'FLL',
  title = 'Assertividade por Missão (M01 a M15)',
  forceAllMissions = false,
  attemptLabelPrefix = 'Tentativa'
}: MissionAssertivenessChartProps) {
  const [activeAttemptIndex, setActiveAttemptIndex] = useState<number | 'avg' | null>(null);
  const [showAllMissions, setShowAllMissions] = useState(forceAllMissions);
  const [showAverageCurve, setShowAverageCurve] = useState(true);
  const [showAveragesTable, setShowAveragesTable] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    attemptIndex: number | 'avg';
    missionId: string;
    missionName: string;
    score: number;
    maxScore: number;
    percent: number;
    x: number;
    y: number;
  } | null>(null);

  // 1. Identifica todas as missões testadas nas tentativas válidas
  const distinctTestedIds = useMemo(() => {
    const set = new Set<string>();
    attempts.forEach(att => {
      (att.missions || []).forEach(m => {
        if (m.missionId) set.add(m.missionId.toUpperCase());
      });
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [attempts]);

  // Se o usuário alternar para ver todas as missões ou se nenhuma missão foi gravada ainda
  const allSeasonMissionIds = useMemo(
    () => BIOGLOW_SEASON.missions.map(m => m.id),
    []
  );

  const activeMissionIds = useMemo(() => {
    if (forceAllMissions) {
      return allSeasonMissionIds;
    }
    if (showAllMissions || distinctTestedIds.length === 0) {
      return distinctTestedIds.length > 0 && !showAllMissions
        ? distinctTestedIds
        : allSeasonMissionIds;
    }
    return distinctTestedIds;
  }, [forceAllMissions, showAllMissions, distinctTestedIds, allSeasonMissionIds]);

  // Se nenhuma tentativa possuir missões definidas
  const hasAnyMissionsRecorded = distinctTestedIds.length > 0 || forceAllMissions;

  // 2. Dimensões do Gráfico SVG
  const PAD = { l: 56, r: 28, t: 32, b: 48 };
  const W = 580;
  const H = 250;
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;

  const count = activeMissionIds.length;
  const xOf = (index: number) =>
    PAD.l + (count > 1 ? (index / (count - 1)) * plotW : plotW / 2);

  const yOf = (pct: number) =>
    PAD.t + plotH - (Math.max(0, Math.min(100, pct)) / 100) * plotH;

  // Ticks do eixo Y representando assertividade de 0% a 100%
  const yTicks = [
    { label: '100%', value: 100 },
    { label: '75%', value: 75 },
    { label: '50%', value: 50 },
    { label: '25%', value: 25 },
    { label: '0%', value: 0 }
  ];

  // 3. Monta as séries de pontos e linhas para cada tentativa
  const series = useMemo(() => {
    return attempts.map((att, attIdx) => {
      const color = ATTEMPT_COLORS[attIdx % ATTEMPT_COLORS.length];
      const attMissions = att.missions || [];
      const missionMap = new Map(
        attMissions.map(m => [m.missionId.toUpperCase(), m])
      );

      const points: Array<{
        missionIndex: number;
        missionId: string;
        missionName: string;
        score: number;
        maxScore: number;
        percent: number;
        x: number;
        y: number;
      }> = [];

      activeMissionIds.forEach((mId, mIdx) => {
        const found = missionMap.get(mId.toUpperCase());
        const seasonM = getSeasonMission(mId);
        const max = found?.maxScore || seasonM?.maximum || 1;
        const score = found ? Number(found.score) || 0 : 0;
        const pct = calculateMissionAssertiveness(score, max);

        // Se for forçado todas as missões (Round Teste) ou se encontrou a missão gravada
        if (forceAllMissions || found) {
          points.push({
            missionIndex: mIdx,
            missionId: mId,
            missionName: found?.name || seasonM?.name || mId,
            score,
            maxScore: max,
            percent: pct,
            x: xOf(mIdx),
            y: yOf(pct)
          });
        }
      });

      // Linha conectando os pontos da tentativa
      const pathD = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(' ');

      // Média de assertividade desta tentativa
      const avgAssertiveness =
        points.length > 0
          ? points.reduce((sum, p) => sum + p.percent, 0) / points.length
          : 0;

      return {
        attIdx,
        color,
        points,
        pathD,
        totalScore: att.score,
        avgAssertiveness,
        missionsTestedCount: points.length
      };
    });
  }, [attempts, activeMissionIds, plotW, plotH, forceAllMissions]);

  // 4. Média de cada missão individual em relação às tentativas
  const missionAverages = useMemo(() => {
    return activeMissionIds.map((mId, mIdx) => {
      const seasonM = getSeasonMission(mId);
      const max = seasonM?.maximum || 1;
      let totalPts = 0;
      let countTested = 0;

      attempts.forEach(att => {
        const found = (att.missions || []).find(m => m.missionId.toUpperCase() === mId.toUpperCase());
        if (found) {
          totalPts += Number(found.score) || 0;
          countTested++;
        } else if (forceAllMissions) {
          countTested++;
        }
      });

      const avgScore = countTested > 0 ? totalPts / countTested : 0;
      const avgPct = calculateMissionAssertiveness(avgScore, max);

      return {
        missionIndex: mIdx,
        missionId: mId,
        missionName: seasonM?.name || mId,
        avgScore,
        maxScore: max,
        avgPct,
        countTested,
        x: xOf(mIdx),
        y: yOf(avgPct)
      };
    });
  }, [activeMissionIds, attempts, forceAllMissions, plotW, plotH]);

  // Linha da Média Global das Missões
  const averageCurvePath = useMemo(() => {
    if (missionAverages.length === 0) return '';
    return missionAverages
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
  }, [missionAverages]);

  // Estatística dos Discos de Precisão em relação às tentativas
  const precisionAverages = useMemo(() => {
    const hasAnyPrecision = attempts.some(a => a.precisionTokensRemaining !== undefined);
    if (!hasAnyPrecision && !forceAllMissions) return null;

    const tokenCounts = attempts.map(a => a.precisionTokensRemaining ?? 6);
    const avgRemaining = tokenCounts.length ? tokenCounts.reduce((s, v) => s + v, 0) / tokenCounts.length : 6;
    const pointsList = tokenCounts.map(t => calculatePrecisionPoints(t));
    const avgPoints = pointsList.length ? pointsList.reduce((s, v) => s + v, 0) / pointsList.length : 50;
    const maxPrecision = 50;
    const avgPct = calculateMissionAssertiveness(avgPoints, maxPrecision);

    return {
      avgRemaining,
      avgPoints,
      maxPrecision,
      avgPct,
      totalAttempts: attempts.length
    };
  }, [attempts, forceAllMissions]);

  // Estatísticas globais
  const stats = useMemo(() => {
    const allPoints = series.flatMap(s => s.points);
    if (allPoints.length === 0) return null;

    const avgAssertiveness =
      allPoints.reduce((sum, p) => sum + p.percent, 0) / allPoints.length;

    // Assertividade média por missão
    const missionStats = activeMissionIds.map(mId => {
      const pts = allPoints.filter(p => p.missionId === mId);
      const avg =
        pts.length > 0
          ? pts.reduce((sum, p) => sum + p.percent, 0) / pts.length
          : 0;
      const best = pts.length > 0 ? Math.max(...pts.map(p => p.percent)) : 0;
      return { mId, avg, best, count: pts.length };
    });

    const missionsWithData = missionStats.filter(m => m.count > 0);
    const bestMission = missionsWithData.length
      ? [...missionsWithData].sort((a, b) => b.avg - a.avg)[0]
      : null;
    const lowestMission = missionsWithData.length
      ? [...missionsWithData].sort((a, b) => a.avg - b.avg)[0]
      : null;

    return {
      avgAssertiveness,
      bestMission,
      lowestMission,
      totalAttempts: attempts.length
    };
  }, [series, activeMissionIds, attempts.length]);

  return (
    <div className="mac-container" aria-label="Gráfico de Assertividade por Missão">
      <div className="mac-header">
        <div className="mac-title-group">
          <Target size={18} className="mac-icon" />
          <div>
            <h4 className="mac-title">{title}</h4>
            <span className="mac-subtitle">
              Linhas com cores diferentes mostrando a assertividade (0% a 100%) em cada missão
            </span>
          </div>
        </div>

        <div className="mac-header-controls">
          <button
            type="button"
            className={`mac-filter-toggle ${showAverageCurve ? 'active' : ''}`}
            onClick={() => setShowAverageCurve(v => !v)}
            title="Exibir ou ocultar curva destacada com a MÉDIA geral de cada missão"
          >
            <Calculator size={13} />
            {showAverageCurve ? 'Ocultar Média' : 'Ver Linha de Média'}
          </button>

          <button
            type="button"
            className={`mac-filter-toggle ${showAveragesTable ? 'active' : ''}`}
            onClick={() => setShowAveragesTable(v => !v)}
            title="Alternar tabela com as médias detalhadas de cada missão individual e discos"
          >
            <Layers size={13} />
            {showAveragesTable ? 'Ocultar Tabela' : 'Tabela de Médias'}
          </button>

          {!forceAllMissions && distinctTestedIds.length > 0 && (
            <button
              type="button"
              className="mac-filter-toggle"
              onClick={() => setShowAllMissions(v => !v)}
              title="Alternar entre ver somente missões testadas ou todas as missões da mesa"
            >
              {showAllMissions ? 'Apenas Testadas' : 'Ver Todas (M01–M15)'}
            </button>
          )}
        </div>
      </div>

      {!hasAnyMissionsRecorded ? (
        <div className="mac-empty-notice">
          <Info size={16} />
          <p>
            Nenhuma missão foi registrada ainda para este teste.
          </p>
        </div>
      ) : (
        <>
          {/* ── Gráfico SVG ── */}
          <div className="mac-chart-wrap">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="mac-svg"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="mac-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.7" />
                </filter>
                <filter id="mac-avg-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#fbbf24" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Grade de fundo horizontal e labels do eixo Y */}
              {yTicks.map(t => {
                const y = yOf(t.value);
                return (
                  <g key={t.value}>
                    <line
                      x1={PAD.l}
                      y1={y}
                      x2={W - PAD.r}
                      y2={y}
                      stroke={t.value === 0 ? '#475569' : '#334155'}
                      strokeWidth={t.value === 0 ? 1.2 : 0.75}
                      strokeDasharray={t.value === 0 ? undefined : '4 3'}
                    />
                    <text
                      x={PAD.l - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9.5"
                      fontWeight="700"
                      fill={t.value === 100 ? '#4ade80' : t.value === 50 ? '#fbbf24' : '#94a3b8'}
                    >
                      {t.label}
                    </text>
                  </g>
                );
              })}

              {/* Eixos principais */}
              <line
                x1={PAD.l}
                y1={PAD.t}
                x2={PAD.l}
                y2={PAD.t + plotH}
                stroke="#475569"
                strokeWidth="1.2"
              />
              <line
                x1={PAD.l}
                y1={PAD.t + plotH}
                x2={W - PAD.r}
                y2={PAD.t + plotH}
                stroke="#475569"
                strokeWidth="1.2"
              />

              {/* Labels das missões no eixo X */}
              {activeMissionIds.map((mId, i) => {
                const x = xOf(i);
                const seasonM = getSeasonMission(mId);
                const isTested = distinctTestedIds.includes(mId) || forceAllMissions;
                return (
                  <g key={mId}>
                    <line
                      x1={x}
                      y1={PAD.t + plotH}
                      x2={x}
                      y2={PAD.t + plotH + 4}
                      stroke="#475569"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={H - PAD.b + 14}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight={isTested ? '800' : '500'}
                      fill={isTested ? '#f1f5f9' : '#64748b'}
                    >
                      {mId}
                    </text>
                    <text
                      x={x}
                      y={H - PAD.b + 25}
                      textAnchor="middle"
                      fontSize="7.5"
                      fill="#64748b"
                    >
                      {seasonM ? `${seasonM.maximum}p` : ''}
                    </text>
                  </g>
                );
              })}

              {/* ── Curvas Sobrepostas de Cada Tentativa / Round ── */}
              {series.map(s => {
                if (s.points.length === 0) return null;
                const isSelected = activeAttemptIndex === s.attIdx;
                const isDimmed = activeAttemptIndex !== null && !isSelected;

                return (
                  <g
                    key={`line-${s.attIdx}`}
                    style={{
                      transition: 'opacity 0.2s',
                      opacity: isDimmed ? 0.15 : 1
                    }}
                  >
                    {/* Linha da tentativa */}
                    {s.points.length > 1 && (
                      <path
                        d={s.pathD}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={isSelected ? 3.5 : 2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#mac-glow)"
                      />
                    )}

                    {/* Marcadores em cada missão da tentativa */}
                    {s.points.map(p => {
                      const isHovered =
                        hoveredPoint?.attemptIndex === s.attIdx &&
                        hoveredPoint?.missionId === p.missionId;

                      return (
                        <g
                          key={`${s.attIdx}-${p.missionId}`}
                          className="mac-point-group"
                          onMouseEnter={() =>
                            setHoveredPoint({
                              attemptIndex: s.attIdx,
                              missionId: p.missionId,
                              missionName: p.missionName,
                              score: p.score,
                              maxScore: p.maxScore,
                              percent: p.percent,
                              x: p.x,
                              y: p.y
                            })
                          }
                          onMouseLeave={() => setHoveredPoint(null)}
                          onClick={() =>
                            setActiveAttemptIndex(prev =>
                              prev === s.attIdx ? null : s.attIdx
                            )
                          }
                        >
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 8 : isSelected ? 6 : 4.5}
                            fill={s.color}
                            stroke="#0f172a"
                            strokeWidth={isHovered ? 2 : 1.5}
                            style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                          />

                          {(isSelected || isHovered) && (
                            <text
                              x={p.x}
                              y={Math.max(PAD.t + 10, p.y - 8)}
                              textAnchor="middle"
                              fontSize="8"
                              fontWeight="700"
                              fill={s.color}
                              stroke="#0f172a"
                              strokeWidth="2.5"
                              paintOrder="stroke fill"
                            >
                              {p.percent.toFixed(0)}%
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* ── LINHA DE MÉDIA GERAL DAS MISSÕES (Amarelo Ouro Tracejado) ── */}
              {showAverageCurve && missionAverages.length > 0 && (() => {
                const isSelected = activeAttemptIndex === 'avg';
                const isDimmed = activeAttemptIndex !== null && !isSelected;

                return (
                  <g
                    key="average-curve"
                    style={{
                      transition: 'opacity 0.2s',
                      opacity: isDimmed ? 0.2 : 1
                    }}
                  >
                    {missionAverages.length > 1 && (
                      <path
                        d={averageCurvePath}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={isSelected ? 4 : 2.8}
                        strokeDasharray={isSelected ? undefined : '5 4'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#mac-avg-glow)"
                      />
                    )}

                    {missionAverages.map(p => {
                      const isHovered =
                        hoveredPoint?.attemptIndex === 'avg' &&
                        hoveredPoint?.missionId === p.missionId;

                      return (
                        <g
                          key={`avg-${p.missionId}`}
                          className="mac-point-group"
                          onMouseEnter={() =>
                            setHoveredPoint({
                              attemptIndex: 'avg',
                              missionId: p.missionId,
                              missionName: p.missionName,
                              score: Number(p.avgScore.toFixed(1)),
                              maxScore: p.maxScore,
                              percent: Number(p.avgPct.toFixed(1)),
                              x: p.x,
                              y: p.y
                            })
                          }
                          onMouseLeave={() => setHoveredPoint(null)}
                          onClick={() =>
                            setActiveAttemptIndex(prev => (prev === 'avg' ? null : 'avg'))
                          }
                        >
                          <polygon
                            points={`${p.x},${p.y - (isHovered ? 7 : 5)} ${p.x + (isHovered ? 6 : 4.5)},${p.y + (isHovered ? 4 : 3)} ${p.x - (isHovered ? 6 : 4.5)},${p.y + (isHovered ? 4 : 3)}`}
                            fill="#fbbf24"
                            stroke="#0f172a"
                            strokeWidth={isHovered ? 2 : 1.2}
                            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                          />

                          {(isSelected || isHovered) && (
                            <text
                              x={p.x}
                              y={Math.max(PAD.t + 10, p.y - 10)}
                              textAnchor="middle"
                              fontSize="8"
                              fontWeight="800"
                              fill="#fbbf24"
                              stroke="#0f172a"
                              strokeWidth="2.5"
                              paintOrder="stroke fill"
                            >
                              M: {p.avgPct.toFixed(0)}%
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })()}

              {/* Tooltip flutuante no SVG */}
              {hoveredPoint && (
                <g
                  transform={`translate(${Math.min(
                    W - 140,
                    Math.max(10, hoveredPoint.x - 65)
                  )}, ${Math.max(8, hoveredPoint.y - 44)})`}
                  className="mac-svg-tooltip"
                >
                  <rect
                    width="130"
                    height="36"
                    rx="6"
                    fill="#0f172a"
                    stroke={
                      hoveredPoint.attemptIndex === 'avg'
                        ? '#fbbf24'
                        : ATTEMPT_COLORS[hoveredPoint.attemptIndex % ATTEMPT_COLORS.length]
                    }
                    strokeWidth="1.2"
                    filter="url(#mac-glow)"
                  />
                  <text
                    x="65"
                    y="14"
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="800"
                    fill={
                      hoveredPoint.attemptIndex === 'avg'
                        ? '#fbbf24'
                        : ATTEMPT_COLORS[hoveredPoint.attemptIndex % ATTEMPT_COLORS.length]
                    }
                  >
                    {hoveredPoint.attemptIndex === 'avg'
                      ? `Média Global • ${hoveredPoint.missionId}`
                      : `${attemptLabelPrefix} ${Number(hoveredPoint.attemptIndex) + 1} • ${hoveredPoint.missionId}`}
                  </text>
                  <text
                    x="65"
                    y="27"
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="600"
                    fill="#f1f5f9"
                  >
                    {hoveredPoint.score} / {hoveredPoint.maxScore} pts ({hoveredPoint.percent.toFixed(1)}%)
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* ── Legenda de Tentativas com Destaque Interativo + Botão de Média ── */}
          <div className="mac-legend">
            <span className="mac-legend-hint">{attemptLabelPrefix}s:</span>
            {series.map(s => {
              const isSelected = activeAttemptIndex === s.attIdx;
              return (
                <button
                  type="button"
                  key={s.attIdx}
                  className={`mac-legend-item ${isSelected ? 'active' : ''}`}
                  onClick={() =>
                    setActiveAttemptIndex(prev =>
                      prev === s.attIdx ? null : s.attIdx
                    )
                  }
                  title={`Clique para isolar o ${attemptLabelPrefix} ${s.attIdx + 1} no gráfico`}
                >
                  <span
                    className="mac-legend-dot"
                    style={{ backgroundColor: s.color }}
                  />
                  <strong>{attemptLabelPrefix === 'Round Teste' ? `R${s.attIdx + 1}` : `T${s.attIdx + 1}`}</strong>
                  <small>
                    {s.missionsTestedCount > 0
                      ? `${s.avgAssertiveness.toFixed(0)}%`
                      : 's/ dados'}
                  </small>
                </button>
              );
            })}

            {/* Item interativo da Média na legenda */}
            {showAverageCurve && (
              <button
                type="button"
                className={`mac-legend-item avg-legend-item ${activeAttemptIndex === 'avg' ? 'active' : ''}`}
                onClick={() => setActiveAttemptIndex(prev => (prev === 'avg' ? null : 'avg'))}
                title="Isolar a curva de Média de Cada Missão"
              >
                <span className="mac-legend-dot" style={{ backgroundColor: '#fbbf24' }} />
                <strong>Média</strong>
                <small>por missão</small>
              </button>
            )}

            {activeAttemptIndex !== null && (
              <button
                type="button"
                className="mac-legend-reset"
                onClick={() => setActiveAttemptIndex(null)}
              >
                Ver todos sobrepostos
              </button>
            )}
          </div>

          {/* ── TABELA EXPANSÍVEL DE MÉDIA POR MISSÃO INDIVIDUAL (Incluindo Discos de Precisão) ── */}
          {showAveragesTable && (
            <div className="mac-averages-table-wrap">
              <div className="mac-table-title-row">
                <span className="mac-table-title">Média de Assertividade por Missão (Todas as Tentativas)</span>
                {precisionAverages && (
                  <span className="mac-table-precision-badge">
                    <Disc size={13} /> Discos: {precisionAverages.avgRemaining.toFixed(1)} rest. ({precisionAverages.avgPoints.toFixed(1)} / 50 pts · {precisionAverages.avgPct.toFixed(0)}%)
                  </span>
                )}
              </div>
              <div className="mac-table-grid">
                {missionAverages.map(m => (
                  <div key={m.missionId} className="mac-table-cell">
                    <div className="cell-top">
                      <span className="cell-id">{m.missionId}</span>
                      <span className="cell-max">{m.maxScore}p</span>
                    </div>
                    <div className="cell-score">
                      <strong>{m.avgScore.toFixed(1)}</strong>
                      <span className="cell-pct" style={{ color: m.avgPct >= 100 ? '#4ade80' : m.avgPct >= 50 ? '#38bdf8' : m.avgPct > 0 ? '#fbbf24' : '#94a3b8' }}>
                        {m.avgPct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="cell-bar-bg">
                      <div className="cell-bar-fill" style={{ width: `${Math.min(100, Math.max(2, m.avgPct))}%`, backgroundColor: m.avgPct >= 100 ? '#4ade80' : m.avgPct >= 50 ? '#38bdf8' : m.avgPct > 0 ? '#fbbf24' : '#64748b' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Cards de Estatísticas e Métricas da Mesa ── */}
          {stats && (
            <div className="mac-stats-row">
              <div className="mac-stat-card">
                <span className="mac-stat-label">Assertividade Média</span>
                <span className="mac-stat-val">
                  {stats.avgAssertiveness.toFixed(1)}%
                </span>
                <span className="mac-stat-desc">média entre as 15 missões</span>
              </div>

              {stats.bestMission && (
                <div className="mac-stat-card best">
                  <span className="mac-stat-label">Melhor Missão</span>
                  <span className="mac-stat-val green">
                    {stats.bestMission.mId} ({stats.bestMission.avg.toFixed(0)}%)
                  </span>
                  <span className="mac-stat-desc">
                    pico: {stats.bestMission.best.toFixed(0)}%
                  </span>
                </div>
              )}

              {stats.lowestMission && (
                <div className="mac-stat-card focus">
                  <span className="mac-stat-label">Oportunidade de Treino</span>
                  <span className="mac-stat-val amber">
                    {stats.lowestMission.mId} ({stats.lowestMission.avg.toFixed(0)}%)
                  </span>
                  <span className="mac-stat-desc">menor índice registrado</span>
                </div>
              )}

              {precisionAverages && (
                <div className="mac-stat-card">
                  <span className="mac-stat-label">Média Discos Precisão</span>
                  <span className="mac-stat-val" style={{ color: '#38bdf8' }}>
                    {precisionAverages.avgPoints.toFixed(1)}p ({precisionAverages.avgPct.toFixed(0)}%)
                  </span>
                  <span className="mac-stat-desc">
                    {precisionAverages.avgRemaining.toFixed(1)} de 6 discos restantes
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
