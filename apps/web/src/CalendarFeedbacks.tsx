import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquareText, 
  Search, 
  ExternalLink, 
  Filter, 
  BookOpen, 
  FlaskConical, 
  CalendarDays, 
  PlusCircle, 
  Send,
  X,
  MessageCircle,
  Clock
} from 'lucide-react';
import type { AccountUser } from '@hortobots/shared/permissions';
import { api } from './client';
import { getAuthorTagBadge, FeedbackItem } from './FeedbackThread';
import { useDialog } from './App';

interface TargetGroup {
  key: string;
  kind: 'registros' | 'testes' | 'eventos';
  id: string;
  title: string;
  date: string;
  modality?: string;
  team?: string;
  feedbacks: FeedbackItem[];
}

export function CalendarFeedbacks({
  user,
  onSelectEvent
}: {
  user: AccountUser | null;
  onSelectEvent?: (eventId: string, date: string) => void;
}) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | 'registros' | 'testes' | 'eventos'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para inline feedback form
  const [activeInlineTarget, setActiveInlineTarget] = useState<string | null>(null);
  const [inlineMessage, setInlineMessage] = useState('');
  const [inlineAuthorTag, setInlineAuthorTag] = useState<'DIREÇÃO' | 'COORDENAÇÃO' | 'TÉCNICO DE EQUIPE'>('DIREÇÃO');
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api('/api/feedbacks');
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar feedbacks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Formata data brasileira
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Sem data';
    const [y, m, d] = dateStr.split('-');
    if (y && m && d) return `${d}/${m}/${y}`;
    return dateStr;
  };

  // Agrupa feedbacks por item de origem
  const groupedTargets = useMemo(() => {
    const map = new Map<string, TargetGroup>();

    feedbacks.forEach(item => {
      // Filtra por tipo se selecionado
      if (filterKind !== 'all' && item.targetKind !== filterKind) return;

      // Filtra por termo de busca se informado
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = (item.targetTitle || '').toLowerCase().includes(query);
        const matchMessage = item.message.toLowerCase().includes(query);
        const matchAuthor = (item.createdBy || '').toLowerCase().includes(query);
        const matchTag = item.authorTag.toLowerCase().includes(query);
        const matchDate = formatDate(item.targetDate).includes(query);
        if (!matchTitle && !matchMessage && !matchAuthor && !matchTag && !matchDate) {
          return;
        }
      }

      const groupKey = `${item.targetKind}:${item.targetId}`;
      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          kind: item.targetKind,
          id: item.targetId,
          title: item.targetTitle || `${item.targetKind === 'registros' ? 'Registro' : item.targetKind === 'testes' ? 'Teste' : 'Evento'} #${item.targetId}`,
          date: item.targetDate || '',
          modality: (item as any).targetModality || 'fll',
          team: (item as any).targetTeam || '',
          feedbacks: []
        });
      }

      map.get(groupKey)!.feedbacks.push(item);
    });

    // Converte para lista e ordena por data mais recente dos comentários
    return Array.from(map.values()).sort((a, b) => {
      const latestA = a.feedbacks[0]?.createdAt || '';
      const latestB = b.feedbacks[0]?.createdAt || '';
      return latestB.localeCompare(latestA);
    });
  }, [feedbacks, filterKind, searchTerm]);

  // Contadores para os filtros
  const counts = useMemo(() => {
    let reg = 0;
    let tst = 0;
    let evt = 0;
    feedbacks.forEach(f => {
      if (f.targetKind === 'registros') reg++;
      else if (f.targetKind === 'testes') tst++;
      else if (f.targetKind === 'eventos') evt++;
    });
    return { all: feedbacks.length, registros: reg, testes: tst, eventos: evt };
  }, [feedbacks]);

  // Envio de feedback inline
  const handleInlineSubmit = async (group: TargetGroup) => {
    const cleanMessage = inlineMessage.trim();
    if (!cleanMessage) return;
    setInlineSubmitting(true);
    try {
      const created = await api('/api/feedbacks', {
        method: 'POST',
        body: JSON.stringify({
          targetKind: group.kind,
          targetId: group.id,
          authorTag: inlineAuthorTag,
          message: cleanMessage
        })
      });

      setFeedbacks(prev => [
        {
          ...created,
          targetTitle: group.title,
          targetDate: group.date,
          targetModality: group.modality,
          targetTeam: group.team
        },
        ...prev
      ]);

      setInlineMessage('');
      setActiveInlineTarget(null);
      setInlineSuccess(`Feedback adicionado com sucesso a ${group.title}!`);
      setTimeout(() => setInlineSuccess(null), 4000);
    } catch (err: any) {
      showError(`Erro ao enviar feedback: ${err.message}`);
    } finally {
      setInlineSubmitting(false);
    }
  };

  const { confirm, showError } = useDialog();

  const handleDeleteFeedback = async (id: string) => {
    const ok = await confirm('Deseja excluir este comentário? Esta ação não pode ser desfeita.');
    if (!ok) return;
    try {
      await api(`/api/feedbacks/${id}`, { method: 'DELETE' });
      setFeedbacks(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      showError(`Erro ao excluir comentário: ${err.message}`);
    }
  };

  return (
    <section className="calendar-feedbacks-section" aria-labelledby="cal-feedbacks-heading">
      {/* Cabeçalho da Seção */}
      <header className="calendar-feedbacks-header">
        <div className="cal-feedbacks-title-wrap">
          <div className="cal-feedbacks-badge">
            <MessageSquareText size={20} />
            <span>ACOMPANHAMENTO DA GESTÃO</span>
          </div>
          <h2 id="cal-feedbacks-heading">Feedbacks e Devolutivas por Registro</h2>
          <p className="cal-feedbacks-subtitle">
            Orientações técnicas, feedbacks avaliativos e diretrizes da Coordenação e Direção registradas em cada atividade.
          </p>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="cal-feedbacks-controls">
          <div className="cal-feedbacks-filter-pills">
            <button
              type="button"
              className={`cal-filter-pill ${filterKind === 'all' ? 'active' : ''}`}
              onClick={() => setFilterKind('all')}
            >
              Todos ({counts.all})
            </button>
            <button
              type="button"
              className={`cal-filter-pill ${filterKind === 'registros' ? 'active' : ''}`}
              onClick={() => setFilterKind('registros')}
            >
              <BookOpen size={14} /> Registros ({counts.registros})
            </button>
            <button
              type="button"
              className={`cal-filter-pill ${filterKind === 'testes' ? 'active' : ''}`}
              onClick={() => setFilterKind('testes')}
            >
              <FlaskConical size={14} /> Testes ({counts.testes})
            </button>
            <button
              type="button"
              className={`cal-filter-pill ${filterKind === 'eventos' ? 'active' : ''}`}
              onClick={() => setFilterKind('eventos')}
            >
              <CalendarDays size={14} /> Eventos ({counts.eventos})
            </button>
          </div>

          <div className="cal-feedbacks-search-bar">
            <Search size={16} className="cal-search-icon" />
            <input
              type="search"
              className="cal-search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, autor, mensagem..."
            />
            {searchTerm && (
              <button
                type="button"
                className="cal-search-clear"
                onClick={() => setSearchTerm('')}
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {inlineSuccess && (
        <div className="cal-feedback-toast-success" role="status">
          <span>{inlineSuccess}</span>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="calendar-feedbacks-content">
        {loading ? (
          <div className="cal-feedbacks-loading">
            <div className="cal-feedbacks-skeleton-card" />
            <div className="cal-feedbacks-skeleton-card" />
          </div>
        ) : error ? (
          <div className="cal-feedbacks-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={fetchFeedbacks} className="cal-primary-btn">
              Tentar novamente
            </button>
          </div>
        ) : groupedTargets.length === 0 ? (
          <div className="cal-feedbacks-empty">
            <MessageCircle size={44} className="empty-icon" />
            <h3>Nenhum feedback encontrado</h3>
            <p>
              {searchTerm || filterKind !== 'all'
                ? 'Nenhum resultado corresponde aos filtros selecionados. Tente alterar ou limpar a busca.'
                : 'Ainda não existem feedbacks publicados no sistema. Direção e Coordenação podem registrar feedbacks diretamente nos cadernos ou eventos.'}
            </p>
          </div>
        ) : (
          <div className="cal-feedbacks-grid">
            {groupedTargets.map(group => {
              const isRegistro = group.kind === 'registros';
              const isTeste = group.kind === 'testes';
              const isEvento = group.kind === 'eventos';
              const modalityPath = (group.modality || 'fll').toLowerCase();
              const itemUrl = isRegistro
                ? `/${modalityPath}/registro/${group.id}`
                : isTeste
                ? `/${modalityPath}/teste/${group.id}`
                : `/calendario?date=${group.date}`;

              const targetLabel = isRegistro ? 'Registro' : isTeste ? 'Teste' : 'Evento';

              return (
                <article key={group.key} className="cal-feedback-group-card">
                  {/* Cabeçalho do Grupo no formato exigido: "Registro <titulo> data X:" */}
                  <div className="group-card-header">
                    <div className="group-card-title-col">
                      <div className="group-card-tags">
                        <span className={`target-kind-badge badge-${group.kind}`}>
                          {isRegistro && <BookOpen size={13} />}
                          {isTeste && <FlaskConical size={13} />}
                          {isEvento && <CalendarDays size={13} />}
                          {targetLabel.toUpperCase()}
                        </span>
                        {group.modality && (
                          <span className="target-modality-badge">{group.modality.toUpperCase()}</span>
                        )}
                        <span className="target-date-pill">
                          <Clock size={12} /> {formatDate(group.date)}
                        </span>
                      </div>

                      {/* Título Padronizado: "Registro <titulo> data X:" */}
                      <h3 className="group-card-title">
                        <span className="title-kind-prefix">{targetLabel}</span> "{group.title}" data {formatDate(group.date)}:
                      </h3>
                    </div>

                    <div className="group-card-actions">
                      {isEvento ? (
                        <button
                          type="button"
                          className="group-action-link-btn"
                          onClick={() => onSelectEvent && onSelectEvent(group.id, group.date)}
                        >
                          Ver no calendário <ExternalLink size={14} />
                        </button>
                      ) : (
                        <Link to={itemUrl} className="group-action-link-btn">
                          Acessar {targetLabel.toLowerCase()} <ExternalLink size={14} />
                        </Link>
                      )}

                      {user?.role === 'management' && (
                        <button
                          type="button"
                          className="group-add-feedback-btn"
                          onClick={() => {
                            if (activeInlineTarget === group.key) {
                              setActiveInlineTarget(null);
                            } else {
                              setActiveInlineTarget(group.key);
                              setInlineMessage('');
                            }
                          }}
                        >
                          <PlusCircle size={15} />
                          {activeInlineTarget === group.key ? 'Fechar' : 'Comentar'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Formulário Inline de Feedback (se ativado para este item) */}
                  {activeInlineTarget === group.key && user?.role === 'management' && (
                    <div className="cal-inline-feedback-form">
                      <div className="inline-form-top">
                        <span className="inline-form-heading">Novo feedback para este {targetLabel.toLowerCase()}</span>
                        <div className="feedback-select-wrapper">
                          <select
                            className="feedback-select"
                            value={inlineAuthorTag}
                            onChange={e => setInlineAuthorTag(e.target.value as any)}
                          >
                            <option value="DIREÇÃO">DIREÇÃO ESCOLAR</option>
                            <option value="COORDENAÇÃO">COORDENAÇÃO PEDAGÓGICA</option>
                            <option value="TÉCNICO DE EQUIPE">TÉCNICO DE EQUIPE</option>
                          </select>
                        </div>
                      </div>
                      <div className="inline-form-input-box">
                        <textarea
                          className="feedback-textarea"
                          rows={2}
                          maxLength={2000}
                          value={inlineMessage}
                          onChange={e => setInlineMessage(e.target.value)}
                          placeholder={`Escreva orientações para ${group.title}...`}
                        />
                      </div>
                      <div className="inline-form-actions">
                        <button
                          type="button"
                          className="cal-btn-cancel"
                          onClick={() => setActiveInlineTarget(null)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="feedback-submit-btn"
                          disabled={inlineSubmitting || !inlineMessage.trim()}
                          onClick={() => handleInlineSubmit(group)}
                        >
                          <Send size={15} />
                          {inlineSubmitting ? 'Enviando...' : 'Publicar Comentário'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lista Individual de Comentários deste Registro/Teste/Evento */}
                  <div className="group-comments-list">
                    {group.feedbacks.map(item => {
                      const badge = getAuthorTagBadge(item.authorTag);
                      return (
                        <div key={item.id} className="group-comment-bubble">
                          <div className="comment-bubble-meta">
                            <div className="comment-author-info">
                              <span className={`author-badge ${badge.className}`}>
                                {badge.icon}
                                {badge.label}
                              </span>
                              {item.createdBy && (
                                <span className="comment-user">@{item.createdBy}</span>
                              )}
                            </div>
                            <div className="comment-bubble-meta-right">
                              <time dateTime={item.createdAt} className="comment-time">
                                {new Intl.DateTimeFormat('pt-BR', {
                                  dateStyle: 'short',
                                  timeStyle: 'short'
                                }).format(new Date(item.createdAt))}
                              </time>
                              {user?.role === 'management' && (
                                <button
                                  type="button"
                                  className="feedback-disguised-delete"
                                  title="Excluir comentário"
                                  aria-label="Excluir comentário"
                                  onClick={() => handleDeleteFeedback(item.id)}
                                >
                                  X
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="comment-bubble-text">
                            <p>{item.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
