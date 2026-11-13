import React, { useState, useEffect } from 'react';
import { FileText, ArrowLeft, RefreshCw, Download, ExternalLink, Filter, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompetitionDoc {
  id: string;
  competition: 'FLL' | 'OBR';
  modality: string;
  season_year: string;
  doc_type: 'rubrica' | 'regras' | 'complementar';
  title: string;
  description: string;
  url_oficial: string;
  file_path?: string;
  is_current: boolean;
  is_fallback: boolean;
  updated_at?: string;
}

interface CompetitionDocumentsViewProps {
  user: any;
}

export function CompetitionDocumentsView({ user }: CompetitionDocumentsViewProps) {
  const [documents, setDocuments] = useState<CompetitionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState<'TODAS' | 'FLL' | 'OBR'>('TODAS');
  const [selectedType, setSelectedType] = useState<'todos' | 'rubrica' | 'regras' | 'complementar'>('todos');
  const [selectedDoc, setSelectedDoc] = useState<CompetitionDoc | null>(null);

  useEffect(() => {
    async function loadDocs() {
      try {
        setLoading(true);
        const res = await fetch('/api/documentos');
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
          if (data.length > 0 && !selectedDoc) {
            setSelectedDoc(data[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar documentos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchComp = selectedComp === 'TODAS' || doc.competition === selectedComp;
    const matchType = selectedType === 'todos' || doc.doc_type === selectedType;
    return matchComp && matchType;
  });

  return (
    <div className="documents-container page-transition">
      <header className="documents-header">
        <div className="documents-header-left">
          <Link to="/" className="documents-back-link" aria-label="Voltar para a pagina inicial">
            <ArrowLeft size={20} />
            <span>Inicio</span>
          </Link>
          <div className="documents-title-group">
            <span className="documents-badge">Central Oficial de Temporadas</span>
            <h1>Documentos de Competicao</h1>
          </div>
        </div>

        <div className="documents-header-actions">
          <Link to="/documentos/atualizacoes" className="btn-documents-updates">
            <RefreshCw size={16} />
            <span>Feed de Atualizacoes</span>
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
              Rubricas de Avaliacao
            </button>
            <button
              type="button"
              className={`doc-filter-pill ${selectedType === 'regras' ? 'active' : ''}`}
              onClick={() => setSelectedType('regras')}
            >
              Regras e Instrucoes
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
      </section>

      {/* Conteudo Principal: Grade de Documentos + Painel de Detalhes / Visualizador */}
      <main className="documents-layout">
        {loading ? (
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
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-doc-action"
                            title="Abrir URL oficial em nova aba"
                          >
                            <ExternalLink size={15} />
                            <span>Abrir</span>
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Painel Lateral de Pre-visualizacao / Acoes do Documento Selecionado */}
            {selectedDoc && (
              <aside className="documents-preview-column">
                <div className="preview-card-sticky">
                  <div className="preview-header">
                    <span className="preview-label">Visualizacao e Acesso</span>
                    <h2>{selectedDoc.title}</h2>
                    <p className="preview-desc">{selectedDoc.description}</p>
                  </div>

                  <div className="preview-meta-grid">
                    <div>
                      <strong>Competicao:</strong>
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
                      target="_blank"
                      rel="noopener noreferrer"
                      className="preview-btn-primary"
                    >
                      <Download size={18} />
                      <span>Baixar Documento Oficial (PDF)</span>
                    </a>
                    <a
                      href={selectedDoc.url_oficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="preview-btn-secondary"
                    >
                      <ExternalLink size={16} />
                      <span>Ver no Navegador</span>
                    </a>
                  </div>

                  <div className="preview-frame-container">
                    <iframe
                      src={`${selectedDoc.url_oficial}#toolbar=0`}
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
    </div>
  );
}
