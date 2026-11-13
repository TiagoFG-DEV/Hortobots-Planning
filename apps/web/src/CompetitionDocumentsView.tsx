import React, { useState, useEffect } from 'react';
import {
  FileText,
  ArrowLeft,
  RefreshCw,
  Download,
  ExternalLink,
  Filter,
  BookOpen,
  AlertCircle,
  Maximize2,
  Minimize2,
  MapPin,
  Sparkles,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  type CompetitionDoc,
  INITIAL_OFFICIAL_DOCUMENTS
} from './competitionData';

interface CompetitionDocumentsViewProps {
  user: any;
}

export function CompetitionDocumentsView({ user }: CompetitionDocumentsViewProps) {
  const [documents, setDocuments] = useState<CompetitionDoc[]>(INITIAL_OFFICIAL_DOCUMENTS);
  const [loading, setLoading] = useState(false);
  const [selectedComp, setSelectedComp] = useState<'TODAS' | 'FLL' | 'OBR'>('TODAS');
  const [selectedType, setSelectedType] = useState<'todos' | 'rubrica' | 'regras' | 'complementar'>('todos');
  const [selectedRegion, setSelectedRegion] = useState<'TODAS' | 'SP'>('TODAS');
  const [selectedDoc, setSelectedDoc] = useState<CompetitionDoc | null>(INITIAL_OFFICIAL_DOCUMENTS[0] || null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDocs() {
      try {
        setLoading(true);
        const res = await fetch('/api/documentos');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setDocuments(data);
            if (!selectedDoc) {
              setSelectedDoc(data[0]);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Usando catálogo nativo oficial de documentos como fonte confiável:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadDocs();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchComp = selectedComp === 'TODAS' || doc.competition === selectedComp;
    const matchType = selectedType === 'todos' || doc.doc_type === selectedType;
    const matchRegion =
      selectedRegion === 'TODAS' ||
      doc.region === 'SP' ||
      doc.title.toLowerCase().includes('são paulo') ||
      doc.title.toLowerCase().includes('sesi-sp') ||
      doc.description.toLowerCase().includes('são paulo') ||
      doc.description.toLowerCase().includes('estadual');
    return matchComp && matchType && matchRegion;
  });

  return (
    <div className="documents-container page-transition">
      <header className="documents-header">
        <div className="documents-header-left">
          <Link to="/" className="documents-back-link" aria-label="Voltar para a página inicial">
            <ArrowLeft size={20} />
            <span>Início</span>
          </Link>
          <div className="documents-title-group">
            <span className="documents-badge">Central Oficial de Temporadas</span>
            <h1>Documentos de Competição</h1>
          </div>
        </div>

        <div className="documents-header-actions">
          <Link to="/documentos/atualizacoes" className="btn-documents-updates">
            <RefreshCw size={16} />
            <span>Feed de Atualizações</span>
          </Link>
        </div>
      </header>

      {/* Barra de Filtros com Estilo Consolidado */}
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
          <span className="filter-label"><BookOpen size={15} /> Categoria:</span>
          <div className="filter-buttons">
            <button
              type="button"
              className={`doc-filter-pill ${selectedType === 'todos' ? 'active' : ''}`}
              onClick={() => setSelectedType('todos')}
            >
              Todos os Tipos
            </button>
            <button
              type="button"
              className={`doc-filter-pill ${selectedType === 'rubrica' ? 'active' : ''}`}
              onClick={() => setSelectedType('rubrica')}
            >
              Rubricas de Avaliação
            </button>
            <button
              type="button"
              className={`doc-filter-pill ${selectedType === 'regras' ? 'active' : ''}`}
              onClick={() => setSelectedType('regras')}
            >
              Regras e Instruções
            </button>
            <button
              type="button"
              className={`doc-filter-pill ${selectedType === 'complementar' ? 'active' : ''}`}
              onClick={() => setSelectedType('complementar')}
            >
              Manuais e Guias
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
              Geral / Nacional
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
      </section>

      {/* Conteúdo Principal: Grade de Documentos + Painel de Detalhes / Visualizador */}
      <main className="documents-layout">
        {loading && filteredDocs.length === 0 ? (
          <div className="documents-loading">
            <RefreshCw className="spin" size={28} />
            <p>Sincronizando acervo oficial de documentos...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="documents-empty-state">
            <AlertCircle size={36} />
            <p>Nenhum documento encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="documents-grid-container">
            <div className="documents-list-column">
              <span className="documents-count-label">
                Exibindo {filteredDocs.length} documentos oficiais
              </span>
              <div className="documents-cards-grid">
                {filteredDocs.map((doc) => {
                  const isSelected = selectedDoc?.id === doc.id;
                  return (
                    <article
                      key={doc.id}
                      className={`doc-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className="doc-card-top">
                        <span className={`doc-comp-tag ${doc.competition.toLowerCase()}`}>
                          {doc.competition}
                        </span>
                        <span className="doc-season-tag">{doc.season_year}</span>
                        {doc.region === 'SP' && (
                          <span className="doc-sp-tag">Estado de SP</span>
                        )}
                        {doc.is_fallback && (
                          <span className="doc-fallback-tag">Ano Anterior</span>
                        )}
                        <span className="doc-type-badge">{doc.doc_type.toUpperCase()}</span>
                      </div>

                      <h3 className="doc-card-title">{doc.title}</h3>
                      <p className="doc-card-description">{doc.description}</p>

                      <div className="doc-card-footer">
                        <span className="doc-modality-meta">Modalidade: {doc.modality}</span>
                        <div className="doc-card-actions" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={doc.url_oficial}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-doc-action"
                            title="Baixar ou abrir URL oficial"
                          >
                            <Download size={15} />
                            <span>Baixar</span>
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Painel Lateral de Pré-visualização / Ações do Documento Selecionado */}
            {selectedDoc && (
              <aside className="documents-preview-column">
                <div className="preview-card-sticky">
                  <div className="preview-header">
                    <span className="preview-label">Visualização e Acesso</span>
                    <h2>{selectedDoc.title}</h2>
                    <p className="preview-desc">{selectedDoc.description}</p>
                  </div>

                  <div className="preview-meta-grid">
                    <div>
                      <strong>Competição:</strong>
                      <span>{selectedDoc.competition}</span>
                    </div>
                    <div>
                      <strong>Modalidade:</strong>
                      <span>{selectedDoc.modality}</span>
                    </div>
                    <div>
                      <strong>Temporada:</strong>
                      <span>{selectedDoc.season_year}</span>
                    </div>
                    <div>
                      <strong>Tipo:</strong>
                      <span>{selectedDoc.doc_type.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="preview-action-buttons">
                    <a
                      href={selectedDoc.url_oficial}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="preview-btn-primary"
                    >
                      <Download size={18} />
                      <span>Baixar Folha de Avaliação (PDF)</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsFullScreen(true)}
                      className="preview-btn-fullscreen"
                      title="Visualizar documento em tela inteira"
                    >
                      <Maximize2 size={16} />
                      <span>Tela Inteira</span>
                    </button>
                    <a
                      href={selectedDoc.url_oficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="preview-btn-secondary"
                    >
                      <ExternalLink size={16} />
                      <span>Aba Externa</span>
                    </a>
                  </div>

                  <div className="preview-frame-container">
                    <iframe
                      src={`${selectedDoc.url_oficial}#toolbar=1&navpanes=0`}
                      title={selectedDoc.title}
                      className="preview-iframe"
                    />
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </main>

      {/* Modal de Visualização em Tela Inteira */}
      {isFullScreen && selectedDoc && (
        <div className="doc-fullscreen-overlay" role="dialog" aria-modal="true">
          <div className="doc-fullscreen-bar">
            <div className="doc-fullscreen-info">
              <span className="doc-fullscreen-badge">{selectedDoc.competition} • {selectedDoc.modality}</span>
              <h2>{selectedDoc.title}</h2>
            </div>
            <div className="doc-fullscreen-actions">
              <a
                href={selectedDoc.url_oficial}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="btn-fullscreen-download"
              >
                <Download size={18} />
                <span>Baixar PDF</span>
              </a>
              <button
                type="button"
                className="btn-fullscreen-close"
                onClick={() => setIsFullScreen(false)}
                aria-label="Fechar tela inteira"
              >
                <Minimize2 size={20} />
                <span>Sair da Tela Inteira</span>
              </button>
            </div>
          </div>
          <iframe
            src={`${selectedDoc.url_oficial}#toolbar=1`}
            title={selectedDoc.title}
            className="doc-fullscreen-iframe"
          />
        </div>
      )}
    </div>
  );
}
