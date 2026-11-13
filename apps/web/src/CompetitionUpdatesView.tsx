import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, ExternalLink, Filter, AlertTriangle, Calendar, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface CompetitionUpdate {
  id: string;
  competition: 'FLL' | 'OBR';
  modality: string;
  title: string;
  summary: string;
  source_url: string;
  published_at: string;
  captured_at?: string;
  is_critical?: boolean;
}

interface CompetitionUpdatesViewProps {
  user: any;
}

export function CompetitionUpdatesView({ user }: CompetitionUpdatesViewProps) {
  const [updates, setUpdates] = useState<CompetitionUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState<'TODAS' | 'FLL' | 'OBR'>('TODAS');
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);

  useEffect(() => {
    async function loadUpdates() {
      try {
        setLoading(true);
        const res = await fetch('/api/documentos/atualizacoes');
        if (res.ok) {
          const data = await res.json();
          setUpdates(data);
        }
      } catch (err) {
        console.error('Erro ao buscar atualizacoes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUpdates();
  }, []);

  const filtered = updates.filter((item) => {
    const matchComp = selectedComp === 'TODAS' || item.competition === selectedComp;
    const matchCritical = !filterCriticalOnly || item.is_critical;
    return matchComp && matchCritical;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="documents-container page-transition">
      <header className="documents-header">
        <div className="documents-header-left">
          <Link to="/documentos" className="documents-back-link" aria-label="Voltar para a central de documentos">
            <ArrowLeft size={20} />
            <span>Documentos</span>
          </Link>
          <div className="documents-title-group">
            <span className="documents-badge">Feed Oficial em Tempo Real</span>
            <h1>Atualizacoes das Competicoes</h1>
          </div>
        </div>

        <div className="documents-header-actions">
          <Link to="/documentos" className="btn-documents-updates">
            <BookOpen size={16} />
            <span>Ver Documentos e Rubricas</span>
          </Link>
        </div>
      </header>

      {/* Barra de Filtros */}
      <section className="documents-filters-bar">
        <div className="filter-group">
          <span className="filter-label"><Filter size={15} /> Competicao:</span>
          <div className="filter-buttons">
            <button
              type="button"
              className={`doc-filter-pill ${selectedComp === 'TODAS' ? 'active' : ''}`}
              onClick={() => setSelectedComp('TODAS')}
            >
              Todas
            </button>
            <button
              type="button"
              className={`doc-filter-pill ${selectedComp === 'FLL' ? 'active' : ''}`}
              onClick={() => setSelectedComp('FLL')}
            >
              FIRST LEGO League (FLL)
            </button>
            <button
              type="button"
              className={`doc-filter-pill ${selectedComp === 'OBR' ? 'active' : ''}`}
              onClick={() => setSelectedComp('OBR')}
            >
              Olimpiada Brasileira de Robotica (OBR)
            </button>
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label"><AlertTriangle size={15} /> Destaques:</span>
          <div className="filter-buttons">
            <button
              type="button"
              className={`doc-filter-pill ${!filterCriticalOnly ? 'active' : ''}`}
              onClick={() => setFilterCriticalOnly(false)}
            >
              Todas as Publicacoes
            </button>
            <button
              type="button"
              className={`doc-filter-pill ${filterCriticalOnly ? 'active' : ''}`}
              onClick={() => setFilterCriticalOnly(true)}
            >
              Avisos Importantes / Criticos
            </button>
          </div>
        </div>
      </section>

      {/* Lista Cronologica de Atualizacoes */}
      <main className="updates-timeline-container">
        {loading ? (
          <div className="documents-loading">
            <RefreshCw className="spin" size={28} />
            <p>Carregando comunicados e avisos oficiais...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="documents-empty-state">
            <AlertCircle size={36} />
            <p>Nenhuma atualizacao encontrada para os filtros aplicados.</p>
          </div>
        ) : (
          <div className="updates-feed">
            <span className="documents-count-label">
              Exibindo {filtered.length} comunicados ordenados por data de publicacao
            </span>

            <div className="updates-timeline">
              {filtered.map((item) => (
                <article key={item.id} className={`update-card ${item.is_critical ? 'critical' : ''}`}>
                  <div className="update-card-header">
                    <div className="update-meta-row">
                      <span className={`doc-comp-tag ${item.competition.toLowerCase()}`}>
                        {item.competition}
                      </span>
                      <span className="update-modality-tag">{item.modality}</span>
                      {item.is_critical && (
                        <span className="update-critical-pill">
                          <AlertTriangle size={12} />
                          <span>Comunicado Critico</span>
                        </span>
                      )}
                    </div>
                    <time className="update-time-meta">
                      <Calendar size={14} />
                      <span>{formatDate(item.published_at)}</span>
                    </time>
                  </div>

                  <h2 className="update-title">{item.title}</h2>
                  <p className="update-summary">{item.summary}</p>

                  <div className="update-card-footer">
                    <span className="update-source-hint">Fonte Oficial da Organizacao</span>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-update-source"
                    >
                      <ExternalLink size={14} />
                      <span>Acessar Publicacao Original</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

