import { useState, useEffect, useCallback } from 'react';
import { API } from './client';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Database,
  Download,
  Trash2,
  Key,
  Mail,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Save,
  RefreshCw,
  ChevronLeft,
  FileText,
  Plus,
  ExternalLink
} from 'lucide-react';
import { useDialog } from './App';

let inMemoryAdminToken: string | null = null;

function getAdminToken() {
  return inMemoryAdminToken || sessionStorage.getItem('hortobots-admin-token') || sessionStorage.getItem('hortobots-token') || '';
}

function setAdminToken(token: string) {
  inMemoryAdminToken = token;
  try {
    sessionStorage.setItem('hortobots-admin-token', token);
  } catch { /* ignore */ }
}

function clearAdminToken() {
  inMemoryAdminToken = null;
  try {
    sessionStorage.removeItem('hortobots-admin-token');
  } catch { /* ignore */ }
}

async function adminFetch(path: string, init: RequestInit = {}) {
  const token = getAdminToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(init.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Erro ${res.status}`);
  return data;
}

// ─── Tela de Login Admin ──────────────────────────────────────────────────────
function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const json = await data.json();
      if (!data.ok) throw new Error(json?.error?.message || 'Acesso negado.');
      setAdminToken(json.token);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrap page-transition">
      <div className="admin-login-card">
        <button
          type="button"
          className="admin-login-back-btn"
          onClick={() => navigate('/')}
          title="Voltar ao início do site"
        >
          <ChevronLeft size={16} /> Voltar ao Início
        </button>
        <div className="admin-login-icon" aria-hidden="true">
          <Shield size={36} />
        </div>
        <span className="paper-label">ACESSO RESTRITO</span>
        <h1>Painel Administrativo</h1>
        <p className="admin-login-desc">
          Área exclusiva para manutenção e configuração do sistema.
          A autenticação é exigida novamente a cada recarregamento da página.
        </p>
        <form onSubmit={submit} className="admin-login-form">
          <label>
            Senha Administrativa
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Digite a senha administrativa"
              autoComplete="current-password"
              required
              disabled={loading}
              autoFocus
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="admin-primary-btn" disabled={loading || !password}>
            {loading ? 'Verificando...' : 'ACESSAR PAINEL'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Painel Principal ─────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();

  const { showError, confirm } = useDialog();

  // DB Status
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState('');

  // Notification settings
  const [emails, setEmails] = useState({ managementEmail: '', coordinationEmail: '', technicalEmail: '' });
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [emailsSaving, setEmailsSaving] = useState(false);
  const [emailsMsg, setEmailsMsg] = useState('');

  // Password change
  const [pwdForm, setPwdForm] = useState({ username: 'gestao', newPassword: '', confirmPassword: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [profiles, setProfiles] = useState<Array<{username: string; role: string}>>([]);

  // Document Management (Marco 8)
  const [adminDocs, setAdminDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsMsg, setDocsMsg] = useState('');
  const [docForm, setDocForm] = useState({
    id: '',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: '',
    description: '',
    url_oficial: ''
  });

  // Admin password change
  const [adminPwdForm, setAdminPwdForm] = useState({ newPassword: '', confirmPassword: '' });
  const [adminPwdMsg, setAdminPwdMsg] = useState('');
  const [adminPwdSaving, setAdminPwdSaving] = useState(false);

  // Backup/Clear
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearMsg, setClearMsg] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);

  const loadDbStatus = useCallback(async () => {
    setDbLoading(true);
    setDbError('');
    try {
      const data = await adminFetch('/api/admin/db-status');
      setDbStatus(data);
    } catch (err: any) {
      setDbError(err.message);
    } finally {
      setDbLoading(false);
    }
  }, []);

  const loadEmails = useCallback(async () => {
    setEmailsLoading(true);
    try {
      const data = await adminFetch('/api/configuracoes/notificacoes');
      setEmails(data);
    } catch { /* Mentor pode não ter configurado ainda */ }
    finally { setEmailsLoading(false); }
  }, []);

  const loadProfiles = useCallback(async () => {
    try {
      const data = await adminFetch('/api/admin/profiles');
      setProfiles(data);
    } catch { /* silencioso */ }
  }, []);

  const loadAdminDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await fetch('/api/documentos');
      if (res.ok) {
        const data = await res.json();
        setAdminDocs(data);
      }
    } catch (err: any) {
      setDocsMsg('Erro ao carregar lista de documentos.');
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDbStatus();
    loadEmails();
    loadProfiles();
    loadAdminDocs();
  }, [loadDbStatus, loadEmails, loadProfiles, loadAdminDocs]);

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocsMsg('');
    try {
      const docId = docForm.id || `${docForm.competition.toLowerCase()}-${docForm.modality.toLowerCase()}-${Date.now().toString(36)}`;
      await adminFetch('/api/documentos', {
        method: 'POST',
        body: JSON.stringify({ ...docForm, id: docId })
      });
      setDocsMsg('Documento salvo com sucesso no banco de dados!');
      setDocForm({
        id: '',
        competition: 'FLL',
        modality: 'Challenge',
        season_year: '2026/2027',
        doc_type: 'rubrica',
        title: '',
        description: '',
        url_oficial: ''
      });
      loadAdminDocs();
    } catch (err: any) {
      setDocsMsg(err.message || 'Falha ao salvar documento.');
    }
  };

  const handleDocDelete = async (id: string, title: string) => {
    const ok = await confirm(`Tem certeza que deseja excluir o documento "${title}"?`);
    if (!ok) return;

    try {
      await adminFetch(`/api/documentos/${id}`, { method: 'DELETE' });
      setDocsMsg('Documento excluido com sucesso.');
      loadAdminDocs();
    } catch (err: any) {
      setDocsMsg(err.message || 'Erro ao excluir documento.');
    }
  };

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailsSaving(true);
    setEmailsMsg('');
    try {
      const data = await adminFetch('/api/configuracoes/notificacoes', {
        method: 'PUT',
        body: JSON.stringify(emails)
      });
      setEmails(data);
      setEmailsMsg('Destinatários salvos com sucesso no banco de dados.');
    } catch (err: any) {
      setEmailsMsg(err.message || 'Erro ao salvar destinatários.');
    } finally {
      setEmailsSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg('As senhas nao coincidem.');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdMsg('A senha precisa ter ao menos 6 caracteres.');
      return;
    }
    setPwdSaving(true);
    setPwdMsg('');
    try {
      const data = await adminFetch('/api/admin/change-password', {
        method: 'PUT',
        body: JSON.stringify({ username: pwdForm.username, newPassword: pwdForm.newPassword })
      });
      setPwdMsg(data.message || 'Senha alterada com sucesso.');
      setPwdForm(f => ({ ...f, newPassword: '', confirmPassword: '' }));
    } catch (err: any) {
      setPwdMsg(err.message);
    } finally {
      setPwdSaving(false);
    }
  };

  const handleAdminPasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPwdForm.newPassword !== adminPwdForm.confirmPassword) {
      setAdminPwdMsg('As senhas nao coincidem.');
      return;
    }
    if (adminPwdForm.newPassword.length < 8) {
      setAdminPwdMsg('A senha administrativa precisa ter ao menos 8 caracteres.');
      return;
    }
    setAdminPwdSaving(true);
    setAdminPwdMsg('');
    try {
      const data = await adminFetch('/api/admin/change-admin-password', {
        method: 'PUT',
        body: JSON.stringify({ newPassword: adminPwdForm.newPassword })
      });
      setAdminPwdMsg(data.message || 'Senha administrativa alterada. Faca login novamente.');
      clearAdminToken();
      setTimeout(() => onLogout(), 2000);
    } catch (err: any) {
      setAdminPwdMsg(err.message);
    } finally {
      setAdminPwdSaving(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/admin/backup', {
        headers: { authorization: `Bearer ${getAdminToken()}` }
      });
      if (!res.ok) throw new Error('Erro ao gerar backup.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `hortobots-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showError(err.message || 'Falha ao gerar backup.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleClearDb = async () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    setClearLoading(true);
    setClearMsg('');
    try {
      const data = await adminFetch('/api/admin/db-clear', { method: 'DELETE' });
      setClearMsg(data.message || 'Banco esvaziado.');
      setClearConfirm(false);
      await loadDbStatus();
    } catch (err: any) {
      setClearMsg(err.message);
    } finally {
      setClearLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } catch { /* silencioso */ }
    clearAdminToken();
    onLogout();
  };

  return (
    <main className="admin-panel page-transition">
      <header className="admin-panel-header">
        <button className="back-home-button" onClick={() => navigate('/')} title="Voltar ao inicio">
          <ChevronLeft size={18} /> Voltar
        </button>
        <div className="admin-panel-title">
          <Shield size={28} aria-hidden="true" />
          <div>
            <span className="paper-label">SISTEMA</span>
            <h1>Painel Administrativo</h1>
          </div>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout} title="Encerrar sessao administrativa">
          <LogOut size={18} /> Sair
        </button>
      </header>

      <div className="admin-panel-grid">

        {/* ── Status do Banco ── */}
        <section className="admin-card" aria-labelledby="admin-db-status-title">
          <header className="admin-card-header">
            <Database size={22} aria-hidden="true" />
            <div>
              <h2 id="admin-db-status-title">Status do Banco de Dados</h2>
              <p>Visao geral do armazenamento atual</p>
            </div>
            <button className="admin-icon-btn" onClick={loadDbStatus} disabled={dbLoading} title="Atualizar status" aria-label="Atualizar status">
              <RefreshCw size={16} className={dbLoading ? 'admin-spin' : ''} />
            </button>
          </header>
          {dbError && <p className="admin-error" role="alert">{dbError}</p>}
          {dbStatus && (
            <div className="admin-db-grid">
              <div className="admin-db-stat">
                <span className="admin-db-num">{dbStatus.counts?.eventos ?? '—'}</span>
                <span>Eventos</span>
              </div>
              <div className="admin-db-stat">
                <span className="admin-db-num">{dbStatus.counts?.registros ?? '—'}</span>
                <span>Registros</span>
              </div>
              <div className="admin-db-stat">
                <span className="admin-db-num">{dbStatus.counts?.testes ?? '—'}</span>
                <span>Testes</span>
              </div>
              <div className="admin-db-stat admin-db-total">
                <span className="admin-db-num">{dbStatus.counts?.total ?? '—'}</span>
                <span>Total de itens</span>
              </div>
              <div className="admin-db-stat admin-db-storage">
                <span className="admin-db-num">{dbStatus.storageMb ?? '0'} MB</span>
                <span>Armazenamento usado</span>
              </div>
              <div className="admin-db-stat">
                <span className="admin-db-badge">{dbStatus.storage === 'supabase' ? 'Supabase Nuvem' : 'Local'}</span>
                <span>Modo ativo</span>
              </div>
            </div>
          )}

          {dbStatus?.redundancy && (
            <div className="admin-redundancy-section">
              <h3 className="admin-redundancy-title">Redundancia e Contingencia de Bancos</h3>
              <div className="admin-redundancy-grid">
                <div className={`admin-instance-card ${dbStatus.redundancy.primary?.connected ? 'online' : 'offline'}`}>
                  <div className="instance-header">
                    <strong>{dbStatus.redundancy.primary?.name}</strong>
                    <span className="instance-role-badge primary">Principal</span>
                  </div>
                  <p className="instance-url">{dbStatus.redundancy.primary?.url}</p>
                  <div className="instance-status-row">
                    <span className={`status-dot ${dbStatus.redundancy.primary?.connected ? 'online' : 'offline'}`} />
                    <span>{dbStatus.redundancy.primary?.connected ? `Conectado (${dbStatus.redundancy.primary.latencyMs}ms)` : 'Desconectado'}</span>
                  </div>
                </div>

                <div className={`admin-instance-card ${dbStatus.redundancy.backup?.connected ? 'online' : 'offline'}`}>
                  <div className="instance-header">
                    <strong>{dbStatus.redundancy.backup?.name}</strong>
                    <span className="instance-role-badge backup">Backup</span>
                  </div>
                  <p className="instance-url">{dbStatus.redundancy.backup?.url}</p>
                  <div className="instance-status-row">
                    <span className={`status-dot ${dbStatus.redundancy.backup?.connected ? 'online' : 'offline'}`} />
                    <span>{dbStatus.redundancy.backup?.connected ? `Conectado (${dbStatus.redundancy.backup.latencyMs}ms)` : 'Standby / Nao respondendo'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {dbLoading && !dbStatus && <p className="admin-loading" role="status">Carregando status...</p>}
        </section>

        {/* ── Backup e Limpeza ── */}
        <section className="admin-card admin-card-danger-zone" aria-labelledby="admin-backup-title">
          <header className="admin-card-header">
            <Download size={22} aria-hidden="true" />
            <div>
              <h2 id="admin-backup-title">Backup e Limpeza</h2>
              <p>Acoes sensiveis sobre os dados</p>
            </div>
          </header>
          <div className="admin-actions-row">
            <button
              className="admin-action-btn admin-action-backup"
              onClick={handleBackup}
              disabled={backupLoading}
              aria-label="Baixar backup dos dados como .zip"
            >
              <Download size={18} />
              {backupLoading ? 'Gerando...' : 'Baixar Backup (.zip)'}
            </button>
          </div>
          <div className="admin-danger-zone">
            <div className="admin-danger-warning">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>A acao abaixo e irreversivel. Todos os registros, testes, eventos e feedbacks serao excluidos permanentemente.</span>
            </div>
            {clearMsg && (
              <p className={clearMsg.toLowerCase().includes('erro') ? 'admin-error' : 'admin-success'} role="status">
                {clearMsg}
              </p>
            )}
            {!clearConfirm ? (
              <button className="admin-action-btn admin-action-clear" onClick={handleClearDb} disabled={clearLoading}>
                <Trash2 size={18} /> Esvaziar Banco de Dados
              </button>
            ) : (
              <div className="admin-confirm-row">
                <p className="admin-confirm-text">Tem certeza? Esta acao NAO pode ser desfeita.</p>
                <div className="admin-confirm-btns">
                  <button className="admin-action-btn admin-action-clear" onClick={handleClearDb} disabled={clearLoading}>
                    {clearLoading ? 'Excluindo...' : 'Confirmar Exclusao'}
                  </button>
                  <button className="admin-action-btn admin-action-cancel" onClick={() => setClearConfirm(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Destinatarios de E-mail ── */}
        <section className="admin-card" aria-labelledby="admin-email-title">
          <header className="admin-card-header">
            <Mail size={22} aria-hidden="true" />
            <div>
              <h2 id="admin-email-title">Destinatarios de E-mail</h2>
              <p>Enderecos que recebem avisos de eventos</p>
            </div>
          </header>
          {emailsLoading ? (
            <p className="admin-loading" role="status">Carregando...</p>
          ) : (
            <form onSubmit={handleEmailSave} className="admin-form">
              <label>
                E-mail da Gestao
                <input type="email" required value={emails.managementEmail} onChange={e => setEmails({ ...emails, managementEmail: e.target.value })} placeholder="gestao@escola.edu.br" />
              </label>
              <label>
                E-mail da Coordenacao
                <input type="email" required value={emails.coordinationEmail} onChange={e => setEmails({ ...emails, coordinationEmail: e.target.value })} placeholder="coordenacao@escola.edu.br" />
              </label>
              <label>
                E-mail do Tecnico de Equipe
                <input type="email" required value={emails.technicalEmail} onChange={e => setEmails({ ...emails, technicalEmail: e.target.value })} placeholder="tecnico@escola.edu.br" />
              </label>
              <p className="admin-form-hint">O envio usa a API do Gmail (ate 500 por dia). Configure as credenciais OAuth no .env do servidor.</p>
              <button className="admin-save-btn" disabled={emailsSaving} type="submit">
                <Save size={17} /> {emailsSaving ? 'Salvando...' : 'Salvar Destinatarios'}
              </button>
              {emailsMsg && (
                <p className={emailsMsg.includes('sucesso') ? 'admin-success' : 'admin-info'} role="status">
                  {emailsMsg}
                </p>
              )}
            </form>
          )}
        </section>

        {/* ── Alterar Senha de Perfil ── */}
        <section className="admin-card" aria-labelledby="admin-pwd-title">
          <header className="admin-card-header">
            <Key size={22} aria-hidden="true" />
            <div>
              <h2 id="admin-pwd-title">Alterar Senha de Perfil</h2>
              <p>Manutencao de senhas dos perfis do sistema</p>
            </div>
          </header>
          <form onSubmit={handlePasswordSave} className="admin-form">
            <label>
              Perfil
              <select value={pwdForm.username} onChange={e => setPwdForm(f => ({ ...f, username: e.target.value }))}>
                {profiles.map(p => (
                  <option key={p.username} value={p.username}>
                    {p.username} ({p.role})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nova Senha
              <input
                type="password"
                value={pwdForm.newPassword}
                onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Minimo 6 caracteres"
                minLength={6}
                required
              />
            </label>
            <label>
              Confirmar Nova Senha
              <input
                type="password"
                value={pwdForm.confirmPassword}
                onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repita a nova senha"
                required
              />
            </label>
            {pwdMsg && (
              <p className={pwdMsg.toLowerCase().includes('sucesso') || pwdMsg.toLowerCase().includes('alterada') ? 'admin-success' : 'admin-error'} role="status">
                {pwdMsg.toLowerCase().includes('sucesso') || pwdMsg.toLowerCase().includes('alterada')
                  ? <><CheckCircle2 size={14} /> {pwdMsg}</>
                  : pwdMsg}
              </p>
            )}
            <button className="admin-save-btn" disabled={pwdSaving} type="submit">
              <Key size={17} /> {pwdSaving ? 'Salvando...' : 'Alterar Senha do Perfil'}
            </button>
          </form>
        </section>

        {/* ── Alterar Senha Administrativa ── */}
        <section className="admin-card admin-card-accent" aria-labelledby="admin-admin-pwd-title">
          <header className="admin-card-header">
            <Shield size={22} aria-hidden="true" />
            <div>
              <h2 id="admin-admin-pwd-title">Senha Administrativa</h2>
              <p>Alterar a senha de acesso a este painel</p>
            </div>
          </header>
          <form onSubmit={handleAdminPasswordSave} className="admin-form">
            <label>
              Nova Senha Administrativa
              <input
                type="password"
                value={adminPwdForm.newPassword}
                onChange={e => setAdminPwdForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Minimo 8 caracteres"
                minLength={8}
                required
              />
            </label>
            <label>
              Confirmar Nova Senha
              <input
                type="password"
                value={adminPwdForm.confirmPassword}
                onChange={e => setAdminPwdForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repita a nova senha"
                required
              />
            </label>
            {adminPwdMsg && (
              <p className={adminPwdMsg.toLowerCase().includes('alterada') ? 'admin-success' : 'admin-error'} role="status">
                {adminPwdMsg}
              </p>
            )}
            <button className="admin-save-btn" disabled={adminPwdSaving} type="submit">
              <Shield size={17} /> {adminPwdSaving ? 'Salvando...' : 'Alterar Senha Administrativa'}
            </button>
          </form>
        </section>

        {/* Gerenciamento de Documentos de Competicao (Marco 8) */}
        <section className="admin-card" aria-labelledby="admin-docs-title">
          <header className="admin-card-header">
            <FileText size={22} aria-hidden="true" />
            <div>
              <h2 id="admin-docs-title">Central de Documentos de Competicao</h2>
              <p>Cadastrar, atualizar e gerenciar documentos oficiais de FLL e OBR</p>
            </div>
            <button className="admin-icon-btn" onClick={loadAdminDocs} disabled={docsLoading} title="Recarregar documentos" aria-label="Recarregar documentos">
              <RefreshCw size={16} className={docsLoading ? 'admin-spin' : ''} />
            </button>
          </header>

          {docsMsg && (
            <p className={docsMsg.includes('sucesso') ? 'admin-success' : 'admin-error'} role="status">
              {docsMsg}
            </p>
          )}

          <form className="admin-form" onSubmit={handleDocSubmit} style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#86efac', margin: '0.5rem 0' }}>Cadastrar Novo Documento Oficial</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <label className="admin-label">
                <span>Competicao:</span>
                <select
                  className="admin-input"
                  value={docForm.competition}
                  onChange={(e) => setDocForm({ ...docForm, competition: e.target.value })}
                >
                  <option value="FLL">FLL (FIRST LEGO League)</option>
                  <option value="OBR">OBR (Olimpiada Brasileira de Robotica)</option>
                </select>
              </label>

              <label className="admin-label">
                <span>Modalidade:</span>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Ex: Challenge, Resgate, Artistica"
                  value={docForm.modality}
                  onChange={(e) => setDocForm({ ...docForm, modality: e.target.value })}
                  required
                />
              </label>

              <label className="admin-label">
                <span>Temporada / Ano:</span>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Ex: 2026/2027 ou 2026"
                  value={docForm.season_year}
                  onChange={(e) => setDocForm({ ...docForm, season_year: e.target.value })}
                  required
                />
              </label>

              <label className="admin-label">
                <span>Tipo Documental:</span>
                <select
                  className="admin-input"
                  value={docForm.doc_type}
                  onChange={(e) => setDocForm({ ...docForm, doc_type: e.target.value })}
                >
                  <option value="rubrica">Rubrica de Avaliacao</option>
                  <option value="regras">Regras e Instrucoes</option>
                  <option value="complementar">Manual / Complementar</option>
                </select>
              </label>
            </div>

            <label className="admin-label">
              <span>Titulo do Documento:</span>
              <input
                type="text"
                className="admin-input"
                placeholder="Ex: FLL Challenge BIOGLOW - Rubricas Oficiais"
                value={docForm.title}
                onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                required
              />
            </label>

            <label className="admin-label">
              <span>Descricao Resumida:</span>
              <input
                type="text"
                className="admin-input"
                placeholder="Ex: Rubricas completas de avaliacao oficial para juizes e equipes"
                value={docForm.description}
                onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
              />
            </label>

            <label className="admin-label">
              <span>URL Oficial de Origem (PDF):</span>
              <input
                type="url"
                className="admin-input"
                placeholder="https://exemplo.com/manual.pdf"
                value={docForm.url_oficial}
                onChange={(e) => setDocForm({ ...docForm, url_oficial: e.target.value })}
                required
              />
            </label>

            <button className="admin-save-btn" type="submit">
              <Plus size={17} /> Salvar Documento
            </button>
          </form>

          {/* Tabela de Documentos Cadastrados */}
          <div className="admin-docs-table-wrapper">
            <h3 style={{ fontSize: '0.95rem', color: '#94a3b8', marginBottom: '0.8rem' }}>
              Documentos Cadastrados ({adminDocs.length})
            </h3>
            <div className="admin-docs-table">
              {adminDocs.map((doc) => (
                <div key={doc.id} className="admin-doc-row">
                  <div className="admin-doc-info">
                    <strong>{doc.title}</strong>
                    <span>{doc.competition} • {doc.modality} • {doc.season_year} • {doc.doc_type.toUpperCase()}</span>
                  </div>
                  <div className="admin-doc-actions">
                    <a href={doc.url_oficial} target="_blank" rel="noopener noreferrer" className="admin-btn-view" title="Abrir link oficial">
                      <ExternalLink size={15} />
                    </a>
                    <button
                      type="button"
                      className="admin-btn-delete"
                      onClick={() => handleDocDelete(doc.id, doc.title)}
                      title="Excluir documento"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

// ─── Componente Raiz com autenticação admin por sessão ────────────────────────
export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    let isMentor = false;
    try {
      const storedUser = JSON.parse(sessionStorage.getItem('hortobots-user') || '{}');
      if (storedUser?.role === 'mentor') isMentor = true;
    } catch { /* ignore */ }

    // Se o usuário já está autenticado como Mentor ou possui token de sessão/admin, libera o painel imediatamente
    setAuthenticated(Boolean(token) || isMentor);
  }, []);

  const handleLoginSuccess = () => setAuthenticated(true);
  const handleLogout = () => {
    clearAdminToken();
    setAuthenticated(false);
  };

  if (authenticated === null) return null;
  if (!authenticated) return <AdminLogin onSuccess={handleLoginSuccess} />;
  return <AdminDashboard onLogout={handleLogout} />;
}
