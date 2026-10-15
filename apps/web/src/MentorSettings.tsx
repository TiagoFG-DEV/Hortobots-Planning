import { useEffect, useState } from 'react';
import { Mail, Save } from 'lucide-react';
import { api } from './client';

export function MentorSettings() {
  const [form, setForm] = useState({ managementEmail: '', coordinationEmail: '', technicalEmail: '' });
  const [status, setStatus] = useState('Carregando...');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api('/api/configuracoes/notificacoes').then(value => { setForm(value); setStatus(''); }).catch(error => setStatus(error.message));
  }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setStatus('');
    try { setForm(await api('/api/configuracoes/notificacoes', { method: 'PUT', body: JSON.stringify(form) })); setStatus('Destinatários salvos.'); }
    catch (error) { setStatus((error as Error).message); }
    finally { setSaving(false); }
  };
  return <main className="content mentor-settings page-transition">
    <header><Mail size={38} /><div><span className="kicker">CONFIGURAÇÃO EXCLUSIVA DO MENTOR</span><h1>Alertas de eventos importantes</h1><p>Os três destinatários recebem um e-mail responsivo com acesso direto ao evento.</p></div></header>
    <form className="paper" onSubmit={save}>
      <label>E-mail da Gestão<input type="email" required value={form.managementEmail} onChange={event => setForm({ ...form, managementEmail: event.target.value })} /></label>
      <label>E-mail da Coordenação<input type="email" required value={form.coordinationEmail} onChange={event => setForm({ ...form, coordinationEmail: event.target.value })} /></label>
      <label>E-mail do Técnico do time<input type="email" required value={form.technicalEmail} onChange={event => setForm({ ...form, technicalEmail: event.target.value })} /></label>
      <p>O envio usa a API gratuita do Gmail. As credenciais OAuth ficam somente no servidor e nunca são expostas ao navegador.</p>
      <button className="button" disabled={saving}><Save size={18} /> {saving ? 'SALVANDO...' : 'SALVAR DESTINATÁRIOS'}</button>
      {status && <span role="status" className="settings-status">{status}</span>}
    </form>
  </main>;
}
