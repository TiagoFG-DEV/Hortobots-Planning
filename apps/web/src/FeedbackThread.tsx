import { useEffect, useState } from 'react';
import { MessageSquare, Send, ShieldCheck, UserCheck, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { AccountUser } from '@hortobots/shared/permissions';
import { api } from './client';

export type FeedbackItem = {
  id: string;
  targetKind: 'registros' | 'testes' | 'eventos';
  targetId: string;
  authorTag: 'DIREÇÃO' | 'COORDENAÇÃO' | 'TÉCNICO DE EQUIPE';
  message: string;
  createdBy?: string;
  createdAt: string;
  targetTitle?: string;
  targetDate?: string;
};

export function getAuthorTagBadge(tag: string) {
  if (tag === 'DIREÇÃO') {
    return {
      className: 'author-tag-direction',
      icon: <Award size={14} className="tag-icon" />,
      label: 'DIREÇÃO'
    };
  }
  if (tag === 'COORDENAÇÃO') {
    return {
      className: 'author-tag-coordination',
      icon: <ShieldCheck size={14} className="tag-icon" />,
      label: 'COORDENAÇÃO'
    };
  }
  return {
    className: 'author-tag-technical',
    icon: <UserCheck size={14} className="tag-icon" />,
    label: 'TÉCNICO DE EQUIPE'
  };
}

export function FeedbackThread({
  targetKind,
  targetId,
  user,
  onFeedbackAdded
}: {
  targetKind: 'registros' | 'testes' | 'eventos';
  targetId: string;
  user: AccountUser | null;
  onFeedbackAdded?: () => void;
}) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [authorTag, setAuthorTag] = useState<FeedbackItem['authorTag']>('DIREÇÃO');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api(`/api/feedbacks?targetKind=${targetKind}&targetId=${targetId}`)
      .then(value => {
        if (active) setItems(Array.isArray(value) ? value : []);
      })
      .catch(error => {
        if (active) setStatus({ type: 'error', text: error.message });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [targetKind, targetId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) return;
    setSending(true);
    setStatus(null);
    try {
      const created = await api('/api/feedbacks', {
        method: 'POST',
        body: JSON.stringify({ targetKind, targetId, authorTag, message: cleanMessage })
      });
      setItems(previous => [...previous, created]);
      setMessage('');
      setStatus({ type: 'success', text: 'Feedback publicado com sucesso no banco de dados!' });
      if (onFeedbackAdded) onFeedbackAdded();
      setTimeout(() => setStatus(null), 4000);
    } catch (error) {
      setStatus({ type: 'error', text: (error as Error).message });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (feedbackId: string) => {
    if (!window.confirm('Deseja excluir este comentário?')) return;
    try {
      await api(`/api/feedbacks/${feedbackId}`, { method: 'DELETE' });
      setItems(previous => previous.filter(f => f.id !== feedbackId));
      if (onFeedbackAdded) onFeedbackAdded();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir feedback.');
    }
  };

  return (
    <section className="feedback-thread" aria-labelledby={`feedback-${targetKind}-${targetId}`}>
      <header className="feedback-header">
        <div className="feedback-header-left">
          <div className="feedback-header-icon-box">
            <MessageSquare size={22} />
          </div>
          <div>
            <span className="feedback-kicker">ACOMPANHAMENTO DIRETIVO & TÉCNICO</span>
            <h2 id={`feedback-${targetKind}-${targetId}`}>Feedbacks da Gestão</h2>
          </div>
        </div>
        <span className="feedback-counter-pill">
          {items.length} {items.length === 1 ? 'comentário' : 'comentários'}
        </span>
      </header>

      {/* Lista de Feedbacks Individuais */}
      <div className="feedback-list">
        {loading ? (
          <div className="feedback-loading">
            <div className="feedback-skeleton-line" />
            <div className="feedback-skeleton-line short" />
          </div>
        ) : items.length > 0 ? (
          items.map(item => {
            const badge = getAuthorTagBadge(item.authorTag);
            return (
              <article key={item.id} className="feedback-comment">
                <div className="feedback-comment-meta">
                  <div className="feedback-comment-author">
                    <span className={`author-badge ${badge.className}`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                    {item.createdBy && (
                      <span className="feedback-username">@{item.createdBy}</span>
                    )}
                  </div>
                  <div className="feedback-comment-meta-right">
                    <time dateTime={item.createdAt}>
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
                        onClick={() => handleDelete(item.id)}
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>
                <div className="feedback-comment-body">
                  <p>{item.message}</p>
                </div>
              </article>
            );
          })
        ) : (
          <div className="feedback-empty">
            <MessageSquare size={32} className="feedback-empty-icon" />
            <p>Ainda não há feedbacks registrados para este item.</p>
            {user?.role === 'management' && (
              <small>Utilize o formulário abaixo para registrar uma orientação ou devolutiva da gestão.</small>
            )}
          </div>
        )}
      </div>

      {/* Formulário de Envio (Gestão) */}
      {user?.role === 'management' && (
        <form onSubmit={submit} className="feedback-form">
          <div className="feedback-form-title-row">
            <h4>Adicionar Novo Feedback ou Orientação</h4>
          </div>
          <div className="feedback-form-controls">
            <div className="feedback-field-group">
              <label htmlFor={`feedback-author-${targetId}`}>Publicar como</label>
              <div className="feedback-select-wrapper">
                <select
                  id={`feedback-author-${targetId}`}
                  className="feedback-select"
                  value={authorTag}
                  onChange={event => setAuthorTag(event.target.value as FeedbackItem['authorTag'])}
                >
                  <option value="DIREÇÃO">DIREÇÃO ESCOLAR</option>
                  <option value="COORDENAÇÃO">COORDENAÇÃO PEDAGÓGICA</option>
                  <option value="TÉCNICO DE EQUIPE">TÉCNICO DE EQUIPE</option>
                </select>
              </div>
            </div>

            <div className="feedback-field-group field-full">
              <div className="feedback-textarea-header">
                <label htmlFor={`feedback-message-${targetId}`}>Mensagem da devolutiva</label>
                <span className="feedback-char-count">{message.length}/2000</span>
              </div>
              <textarea
                id={`feedback-message-${targetId}`}
                className="feedback-textarea"
                rows={3}
                maxLength={2000}
                value={message}
                onChange={event => setMessage(event.target.value)}
                placeholder="Escreva orientações técnicas, avaliações, questionamentos ou devolutivas pedagógicas..."
              />
            </div>
          </div>

          <div className="feedback-form-footer">
            <button
              type="submit"
              className="feedback-submit-btn"
              disabled={sending || !message.trim()}
            >
              <Send size={16} />
              {sending ? 'Publicando...' : 'Publicar Feedback'}
            </button>
          </div>
        </form>
      )}

      {/* Mensagens de feedback de ação */}
      {status && (
        <div
          className={`feedback-status-banner ${status.type}`}
          role="status"
        >
          {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{status.text}</span>
        </div>
      )}
    </section>
  );
}
