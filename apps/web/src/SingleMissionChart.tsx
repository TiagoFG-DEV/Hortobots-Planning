import React, { useMemo, useState } from 'react';
import { Target, TrendingUp, Info } from 'lucide-react';

interface SingleMissionChartProps {
  missionId?: string;
  missionName?: string;
  maxScore: number;
  attempts: Array<{
    score: number;
    time?: number;
    failures?: number;
  }>;
}

export function SingleMissionChart({
  missionId,
  missionName,
  maxScore,
  attempts
}: SingleMissionChartProps) {
  const n = attempts.length;
  const targetMax = maxScore > 0 ? maxScore : 1;

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const PAD = { l: 56, r: 28, t: 32, b: 44 };
  const W = 580;
  const H = 240;
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;

  const xOf = (i: number) =>
    PAD.l + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);

  const yOf = (pct: number) =>
    PAD.t + plotH - (Math.max(0, Math.min(100, pct)) / 100) * plotH;

  const points = useMemo(() => {
    return attempts.map((a, i) => {
      const score = Math.max(0, Number(a.score) || 0);
      const pct = Math.min(100, (score / targetMax) * 100);
      return {
        index: i,
        score,
        time: a.time,
        failures: a.failures,
        pct,
        x: xOf(i),
        y: yOf(pct)
      };
    });
  }, [attempts, targetMax, plotW, plotH, n]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    return `${pathD} L${xOf(n - 1).toFixed(1)},${(PAD.t + plotH).toFixed(1)} L${xOf(0).toFixed(1)},${(PAD.t + plotH).toFixed(1)} Z`;
  }, [pathD, points, n, plotH]);

  const yTicks = [
    { label: '100%', value: 100 },
    { label: '75%', value: 75 },
    { label: '50%', value: 50 },
    { label: '25%', value: 25 },
    { label: '0%', value: 0 }
  ];

  const avgPct = points.length ? points.reduce((s, p) => s + p.pct, 0) / points.length : 0;
  const bestPct = points.length ? Math.max(...points.map(p => p.pct)) : 0;
  const bestScore = points.length ? Math.max(...points.map(p => p.score)) : 0;

  return (
    <div className="single-mission-chart-card">
      <div className="smc-header">
        <div className="smc-title-box">
          <Target size={18} className="smc-icon" />
          <div>
            <h4 className="smc-title">
              Assertividade da Missão: {missionId ? `${missionId} ${missionName ? '— ' + missionName : ''}` : 'Missão Selecionada'}
            </h4>
            <span className="smc-subtitle">
              Calculada em relação à pontuação máxima desta missão ({targetMax} pts) ao longo das tentativas
            </span>
          </div>
        </div>
      </div>

      <div className="smc-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="smc-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="smc-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
            <filter id="smc-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Grid lines */}
          {yTicks.map(t => {
            const y = yOf(t.value);
            const ptsEquiv = Math.round((t.value / 100) * targetMax);
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
                <text
                  x={W - PAD.r + 6}
                  y={y + 3.5}
                  textAnchor="start"
                  fontSize="8"
                  fill="#64748b"
                >
                  {ptsEquiv}p
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={H - PAD.b + 16}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="600"
              fill="#cbd5e1"
            >
              Tentativa {i + 1}
            </text>
          ))}

          {/* Eixos */}
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + plotH} stroke="#475569" strokeWidth="1.2" />
          <line x1={PAD.l} y1={PAD.t + plotH} x2={W - PAD.r} y2={PAD.t + plotH} stroke="#475569" strokeWidth="1.2" />

          {/* Area under curve */}
          {areaD && <path d={areaD} fill="url(#smc-gradient)" />}

          {/* Line connecting attempts */}
          {points.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#smc-glow)"
            />
          )}

          {/* Data points */}
          {points.map(p => {
            const isHovered = hoveredIdx === p.index;
            return (
              <g
                key={p.index}
                className="smc-point"
                onMouseEnter={() => setHoveredIdx(p.index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 7.5 : 5}
                  fill={p.pct >= 100 ? '#4ade80' : '#22d3ee'}
                  stroke="#0f172a"
                  strokeWidth="1.8"
                  style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                />
                <text
                  x={p.x}
                  y={Math.max(PAD.t + 10, p.y - 9)}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill="#f1f5f9"
                  stroke="#0f172a"
                  strokeWidth="2.5"
                  paintOrder="stroke fill"
                >
                  {p.pct.toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Floating Tooltip */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <g
              transform={`translate(${Math.min(
                W - 140,
                Math.max(10, points[hoveredIdx].x - 65)
              )}, ${Math.max(8, points[hoveredIdx].y - 44)})`}
            >
              <rect
                width="130"
                height="36"
                rx="6"
                fill="#0f172a"
                stroke="#22d3ee"
                strokeWidth="1.2"
                filter="url(#smc-glow)"
              />
              <text x="65" y="14" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#22d3ee">
                Tentativa {hoveredIdx + 1}
              </text>
              <text x="65" y="27" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#f1f5f9">
                {points[hoveredIdx].score} / {targetMax} pts ({points[hoveredIdx].pct.toFixed(1)}%)
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="smc-stats-bar">
        <div className="smc-stat-item">
          <span>Assertividade Média:</span>
          <strong>{avgPct.toFixed(1)}%</strong>
        </div>
        <div className="smc-stat-item">
          <span>Melhor Tentativa:</span>
          <strong style={{ color: bestPct >= 100 ? '#4ade80' : '#22d3ee' }}>
            {bestScore} pts ({bestPct.toFixed(0)}%)
          </strong>
        </div>
        <div className="smc-stat-item">
          <span>Teto da Missão:</span>
          <strong>{targetMax} pontos</strong>
        </div>
      </div>
    </div>
  );
}
