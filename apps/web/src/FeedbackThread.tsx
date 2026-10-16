import { useEffect, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import type { AccountUser } from '@hortobots/shared/permissions';
import { api } from './client';

type Feedback = {
  id: string;
  authorTag: 'DIREÇÃO' | 'COORDENAÇÃO' | 'TÉCNICO DE EQUIPE';
  message: string;
  createdAt: string;
};

export function FeedbackThread({ targetKind, targetId, user }: {
  targetKind: 'registros' | 'testes' | 'eventos';
  targetId: string;
  user: AccountUser | null;
}) {
  const [items, setItems] = useState<Feedback[]>([]);
  const [authorTag, setAuthorTag] = useState<Feedback['authorTag']>('DIREÇÃO');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    api(`/api/feedbacks?targetKind=${targetKind}&targetId=${targetId}`)
      .then(value => { if (active) setItems(Array.isArray(value) ? value : []); })
      .catch(error => { if (active) setStatus(error.message); });
    return () => { active = false; };
  }, [targetKind, targetId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    setSending(true); setStatus('');
    try {
      const created = await api('/api/feedbacks', {
        method: 'POST',
        body: JSON.stringify({ targetKind, targetId, authorTag, message })
      });
      setItems(previous => [...previous, created]);
      setMessage('');
      setStatus('Feedback publicado.');
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  return <section className="feedback-thread" aria-labelledby={`feedback-${targetKind}-${targetId}`}>
    <header><MessageSquare size={22} /><div><span className="kicker">ACOMPANHAMENTO</span><h2 id={`feedback-${targetKind}-${targetId}`}>Feedbacks da Gestão</h2></div></header>
    <div className="feedback-list">
      {items.length ? items.map(item => <article key={item.id} className="feedback-comment">
        <div><strong>{item.authorTag}</strong><time dateTime={item.createdAt}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.createdAt))}</time></div>
        <p>{item.message}</p>
      </article>) : <p className="feedback-empty">Ainda não há feedbacks neste item.</p>}
    </div>
    {user?.role === 'management' && <form onSubmit={submit} className="feedback-form">
      <label>Enviar como
        <select value={authorTag} onChange={event => setAuthorTag(event.target.value as Feedback['authorTag'])}>
          <option>DIREÇÃO</option><option>COORDENAÇÃO</option><option>TÉCNICO DE EQUIPE</option>
        </select>
      </label>
      <label>Mensagem
        <textarea rows={3} maxLength={2000} value={message} onChange={event => setMessage(event.target.value)} placeholder="Registre uma orientação, pergunta ou devolutiva..." />
      </label>
      <button className="button" disabled={sending || !message.trim()}><Send size={17} /> {sending ? 'ENVIANDO...' : 'PUBLICAR FEEDBACK'}</button>
    </form>}
    {status && <p className="feedback-status" role="status">{status}</p>}
  </section>;
}
