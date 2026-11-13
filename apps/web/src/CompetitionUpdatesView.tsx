import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Filter,
  AlertTriangle,
  Calendar,
  BookOpen,
  AlertCircle,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  type CompetitionUpdate,
  INITIAL_OFFICIAL_UPDATES
} from './competitionData';

interface CompetitionUpdatesViewProps {
  user: any;
}

export function CompetitionUpdatesView({ user }: CompetitionUpdatesViewProps) {
  const [updates, setUpdates] = useState<CompetitionUpdate[]>(INITIAL_OFFICIAL_UPDATES);
  const [loading, setLoading] = useState(false);
  const [selectedComp, setSelectedComp] = useState<'TODAS' | 'FLL' | 'OBR'>('TODAS');
  const [selectedRegion, setSelectedRegion] = useState<'TODAS' | 'SP'>('TODAS');
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadUpdates() {
      try {
        setLoading(true);
        const res = await fetch('/api/documentos/atualizacoes');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setUpdates(data);
            return;
          }
        }
      } catch (err) {
        console.warn('Usando catálogo oficial de comunicados como contingência resiliente:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadUpdates();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = updates
    .filter((item) => {
      const matchComp = selectedComp === 'TODAS' || item.competition === selectedComp;
      const matchCritical = !filterCriticalOnly || item.is_critical;
      const matchRegion =
        selectedRegion === 'TODAS' ||
        item.region === 'SP' ||
        item.title.toLowerCase().includes('são paulo') ||
        item.title.toLowerCase().includes('sesi-sp') ||
        item.summary.toLowerCase().includes('são paulo') ||
        item.summary.toLowerCase().includes('estadual');
      return matchComp && matchCritical && matchRegion;
    })
    .sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

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
            <h1>Atualizações das Competições</h1>
          </div>
        </div>

        <div className="documents-header-actions">
          <Link to="/documentos" className="btn-documents-updates">
            <BookOpen size={16} />
            <span>Ver Documentos e Rubricas</span>
          </Link>
        </div>
      </header>

      {/* Barra de Filtros com Menu Estilizado e "Estado de São Paulo" */}
      <section className="documents-filters-bar">
        <div className="filter-group">
          <span className="filter-label"><Filter size={15} /> Competição:</span>
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
              Olimpíada Brasileira de Robótica (OBR)
            </button>
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label"><MapPin size={15} /> Região:</span>
          <div className="filter-buttons">
            <button
              type="button"
              className={`doc-filter-pill ${selectedRegion === 'TODAS' ? 'active' : ''}`}
              onClick={() => setSelectedRegion('TODAS')}
            >
              Todas as Regiões
            </button>
            <button
              type="button"
              className={`doc-filter-pill ${selectedRegion === 'SP' ? 'active highlight-sp' : ''}`}
              onClick={() => setSelectedRegion('SP')}
            >
              Estado de São Paulo
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
              Todas as Publicações
            </button>
            <button
              type="button"
              className={`doc-filter-pill ${filterCriticalOnly ? 'active' : ''}`}
              onClick={() => setFilterCriticalOnly(true)}
            >
              Avisos Importantes / Críticos
            </button>
          </div>
        </div>
      </section>

      {/* Linha do Tempo de Comunicados */}
      <main className="updates-timeline-container">
        {loading && filtered.length === 0 ? (
          <div className="documents-loading">
            <RefreshCw className="spin" size={28} />
            <p>Carregando comunicados oficiais...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="documents-empty-state">
            <AlertCircle size={36} />
            <p>Nenhuma atualização encontrada para os filtros aplicados.</p>
          </div>
        ) : (
          <div className="updates-feed">
            <span className="documents-count-label" style={{ marginBottom: '1.2rem' }}>
              Exibindo {filtered.length} atualizações em ordem cronológica anual (mais recente para mais antiga)
            </span>

            <div className="updates-timeline">
              {filtered.map((item) => (
                <article
                  key={item.id}
                  className={`update-card ${item.is_critical ? 'critical' : ''}`}
                  data-comp={item.competition.toLowerCase()}
                >
                  <div className="update-card-header">
                    <div className="update-meta-row">
                      <span className={`doc-comp-tag ${item.competition.toLowerCase()}`}>
                        {item.competition}
                      </span>
                      <span className="update-modality-tag">{item.modality}</span>
                      {item.region === 'SP' && (
                        <span className="doc-sp-tag">Estado de SP</span>
                      )}
                      {item.is_critical && (
                        <span className="update-critical-pill">
                          <AlertTriangle size={12} />
                          Importante
                        </span>
                      )}
                    </div>
                    <span className="update-time-meta">
                      <Calendar size={14} />
                      {formatDate(item.published_at)}
                    </span>
                  </div>

                  <h2 className="update-title">{item.title}</h2>
                  <p className="update-summary">{item.summary}</p>

                  <div className="update-card-footer">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-update-source"
                    >
                      <span>Consultar Fonte Oficial</span>
                      <ExternalLink size={14} />
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

