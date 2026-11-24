import React, { useState } from 'react';
import {
  BIOGLOW_SEASON,
  BIOGLOW_SCORING_RULES,
  calculatePrecisionPoints,
  type AttemptMission
} from '@hortobots/shared';
import { Check, ChevronDown, ChevronUp, Award, Disc, RotateCcw } from 'lucide-react';

interface RoundScoreSheetProps {
  roundIndex: number;
  color: string;
  missions: AttemptMission[];
  inspectionBonus?: boolean;
  precisionTokensRemaining?: number;
  onUpdateMission: (missionId: string, score: number, answers?: Record<string, any>) => void;
  onUpdateRoundExtra: (field: 'inspectionBonus' | 'precisionTokensRemaining', value: any) => void;
  onResetRound?: () => void;
}

export function RoundScoreSheet({
  roundIndex,
  color,
  missions,
  inspectionBonus = false,
  precisionTokensRemaining = 6,
  onUpdateMission,
  onUpdateRoundExtra,
  onResetRound
}: RoundScoreSheetProps) {
  const [expandedMissions, setExpandedMissions] = useState<Record<string, boolean>>({});

  const toggleMission = (mId: string) => {
    setExpandedMissions(prev => ({ ...prev, [mId]: !prev[mId] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    BIOGLOW_SEASON.missions.forEach(m => { all[m.id] = true; });
    setExpandedMissions(all);
  };

  const collapseAll = () => {
    setExpandedMissions({});
  };

  const missionMap = new Map(missions.map(m => [m.missionId.toUpperCase(), m]));

  const missionsScore = missions.reduce((sum, m) => sum + (Number(m.score) || 0), 0);
  const precisionPoints = calculatePrecisionPoints(precisionTokensRemaining);
  const inspectionPoints = inspectionBonus ? BIOGLOW_SEASON.equipmentInspectionPoints : 0;
  const roundTotalScore = missionsScore + precisionPoints + inspectionPoints;

  return (
    <div className="round-scoresheet-container">
      {/* Resumo do cabeçalho do Round */}
      <div className="round-scoresheet-header">
        <div className="rsh-title">
          <span className="rsh-tag" style={{ backgroundColor: color }}>
            Round {roundIndex + 1}
          </span>
          <span className="rsh-score">
            Total Oficial: <strong>{roundTotalScore}</strong> / {BIOGLOW_SEASON.maximumScore} pts
          </span>
        </div>
        <div className="rsh-actions">
          <button type="button" className="rsh-btn-sm" onClick={expandAll} title="Expandir todas as missões">
            Expandir Todas
          </button>
          <button type="button" className="rsh-btn-sm" onClick={collapseAll} title="Recolher todas as missões">
            Recolher
          </button>
          {onResetRound && (
            <button type="button" className="rsh-btn-sm danger" onClick={onResetRound} title="Zerar todas as pontuações deste Round">
              <RotateCcw size={12} /> Zerar Round
            </button>
          )}
        </div>
      </div>

      {/* Discos de Precisão e Inspeção */}
      <div className="round-bonus-panel">
        {/* Inspeção de Equipamento */}
        <div className={`round-bonus-item ${inspectionBonus ? 'active' : ''}`}>
          <div className="round-bonus-label">
            <Award size={18} className="bonus-icon" />
            <div>
              <strong>Bônus de Inspeção de Equipamento (+20 pts)</strong>
              <small>Todo o equipamento coube dentro da área de inspeção menor</small>
            </div>
          </div>
          <label className="round-toggle-switch">
            <input
              type="checkbox"
              checked={inspectionBonus}
              onChange={e => onUpdateRoundExtra('inspectionBonus', e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Discos de Precisão Restantes */}
        <div className="round-bonus-item precision-item">
          <div className="round-bonus-label">
            <Disc size={18} className="bonus-icon" />
            <div>
              <strong>Discos de Precisão Restantes (0 a 6)</strong>
              <small>
                {precisionTokensRemaining} discos restantes = <strong>+{precisionPoints} pts</strong>
              </small>
            </div>
          </div>
          <div className="precision-token-buttons">
            {[6, 5, 4, 3, 2, 1, 0].map(val => (
              <button
                key={val}
                type="button"
                className={`precision-btn ${precisionTokensRemaining === val ? 'selected' : ''}`}
                onClick={() => onUpdateRoundExtra('precisionTokensRemaining', val)}
                title={`${val} discos = ${calculatePrecisionPoints(val)} pontos`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista das 15 Missões Oficiais com Scoring Rules */}
      <div className="round-missions-list">
        {BIOGLOW_SEASON.missions.map(sm => {
          const rule = BIOGLOW_SCORING_RULES[sm.id];
          const mData = missionMap.get(sm.id) || {
            missionId: sm.id,
            name: sm.name,
            score: 0,
            maxScore: sm.maximum,
            answers: {}
          };
          const answers = mData.answers || {};
          const currentScore = Number(mData.score) || 0;
          const isDone = currentScore > 0;
          const isMax = currentScore >= sm.maximum;
          const isExpanded = expandedMissions[sm.id] ?? false;

          const handleFieldChange = (fieldId: string, val: any) => {
            const newAnswers = { ...answers, [fieldId]: val };
            let newScore = 0;
            if (rule) {
              newScore = rule.calculate(newAnswers);
            } else {
              newScore = Math.max(0, Math.min(sm.maximum, Number(val) || 0));
            }
            onUpdateMission(sm.id, newScore, newAnswers);
          };

          const handleDirectScore = (score: number) => {
            const clamped = Math.max(0, Math.min(sm.maximum, score));
            onUpdateMission(sm.id, clamped, { ...answers, directScore: clamped });
          };

          return (
            <div
              key={sm.id}
              className={`round-mission-card ${isMax ? 'completed-max' : isDone ? 'completed-partial' : ''}`}
            >
              <div className="round-mission-summary-bar" onClick={() => toggleMission(sm.id)}>
                <div className="rm-left">
                  <span className="rm-id-badge">{sm.id}</span>
                  <div className="rm-title-group">
                    <span className="rm-name">{sm.name}</span>
                    <span className="rm-rule-hint">{sm.scoring.join(' • ')}</span>
                  </div>
                </div>

                <div className="rm-right" onClick={e => e.stopPropagation()}>
                  <div className="rm-score-display">
                    <strong className={isMax ? 'score-max' : isDone ? 'score-mid' : 'score-zero'}>
                      {currentScore}
                    </strong>
                    <span className="rm-score-divider">/</span>
                    <span className="rm-max">{sm.maximum}p</span>
                  </div>

                  <div className="rm-quick-preset">
                    <button
                      type="button"
                      className="btn-score-preset zero"
                      onClick={() => handleDirectScore(0)}
                      title="Zerar missão"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      className={`btn-score-preset max ${isMax ? 'active' : ''}`}
                      onClick={() => handleDirectScore(sm.maximum)}
                      title={`Completar no valor máximo (${sm.maximum} pts)`}
                    >
                      Máx
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn-toggle-expand"
                    onClick={() => toggleMission(sm.id)}
                    aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir regras'}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Corpo da Missão: Campos interativos conforme regras */}
              {isExpanded && rule && (
                <div className="round-mission-body">
                  <div className="rm-rule-desc">
                    <span>{rule.description}</span>
                  </div>

                  <div className="rm-fields-grid">
                    {rule.fields.map(f => {
                      if (f.type === 'boolean') {
                        const checked = Boolean(answers[f.id]);
                        return (
                          <label key={f.id} className="rm-checkbox-label">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => handleFieldChange(f.id, e.target.checked)}
                            />
                            <span className="rm-checkbox-box">
                              {checked && <Check size={14} />}
                            </span>
                            <span className="rm-checkbox-text">{f.label}</span>
                          </label>
                        );
                      }

                      if (f.type === 'number') {
                        const count = Number(answers[f.id]) || 0;
                        const maxVal = f.max ?? 4;
                        const minVal = f.min ?? 0;
                        return (
                          <div key={f.id} className="rm-number-field">
                            <label className="rm-field-label">{f.label}</label>
                            <div className="rm-counter-control">
                              <button
                                type="button"
                                className="btn-counter"
                                onClick={() => handleFieldChange(f.id, Math.max(minVal, count - 1))}
                                disabled={count <= minVal}
                              >
                                -
                              </button>
                              <span className="counter-val">{count}</span>
                              <button
                                type="button"
                                className="btn-counter"
                                onClick={() => handleFieldChange(f.id, Math.min(maxVal, count + 1))}
                                disabled={count >= maxVal}
                              >
                                +
                              </button>
                              <span className="counter-total-pts">
                                = {count * (f.pointsPerUnit || 1)} pts
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (f.type === 'select' && f.options && f.options.length > 0) {
                        const defaultOpt = f.options[0];
                        const val = answers[f.id] ?? (defaultOpt ? defaultOpt.value : 0);
                        return (
                          <div key={f.id} className="rm-select-field">
                            <label className="rm-field-label">{f.label}</label>
                            <select
                              value={val}
                              onChange={e => handleFieldChange(f.id, +e.target.value)}
                              className="rm-select-input"
                            >
                              {f.options.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
