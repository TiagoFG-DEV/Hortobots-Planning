import { useCallback, useContext, useEffect, useMemo, useRef, useState, createContext } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  Edit3,
  FileText,
  Home as HomeIcon,
  Image as ImageIcon,
  List,
  LogOut,
  Menu,
  Plus,
  Search,
  Trash2,
  Video,
  X
} from 'lucide-react';
import logo from './assets/generated/Logo.webp';
import fll from './assets/generated/fll_team_logo.webp';
import obr from './assets/generated/obr_team_logo.webp';
import fllBook from './assets/generated/fll_book.webp';
import obrBook from './assets/generated/obr_book.webp';
import novo from './assets/generated/novo_registro_button.webp';
import salvos from './assets/generated/registros_salvos_button.webp';
import testsButton from './assets/originals/simulacoes_e_testes_button.png';
import mascote from './assets/generated/mascote.webp';
import fundo1280 from './assets/generated/fundo-1280.webp';
import fundo1920 from './assets/generated/fundo-1920.webp';
import { CalendarView } from './CalendarView';
import { useOverlayAccessibility } from './useOverlayAccessibility';

const API = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

const MISSIONS = [
  'M01 Drone Survey',
  'M02 Exploding Seeds',
  'M03 Flip the Rock',
  'M04 Lucky Leaves',
  'M05 Reaching Roots',
  'M06 Leafcutter Frenzy',
  'M07 Humongous Fungus',
  'M08 Tangled',
  'M09 Research Platform',
  'M10 Fragile Microhabitats',
  'M11 Window to the Past',
  'M12 Forest Elder',
  'M13 Keystone Species',
  'M14 Seeds of Renewal',
  'M15 Biocentric Architecture'
];

type User = { username: string; role: 'management' | 'mentor' | 'obr' | 'fll' };
type Attempt = { time: number; score: number; failures: number; observed: number };

const auth = () => sessionStorage.getItem('hortobots-token') || '';

const api = async (path: string, init: RequestInit = {}) => {
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${auth()}`,
      ...init.headers
    }
  });
  const b = await r.json();
  if (!r.ok) throw Error(b.error?.message || 'Falha na requisição');
  return b;
};

export function AutoArea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const resize = () => {
      element.style.height = '0';
      element.style.height = `${element.scrollHeight + element.offsetHeight - element.clientHeight}px`;
    };
    resize();
    // Reflow text after rotation, zoom or a narrower form column.
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (width !== element.clientWidth) {
        width = element.clientWidth;
        resize();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [p.value]);
  return <textarea {...p} ref={ref} />;
}

// ── Shared Dialog Context ─────────────────────────────────────────────────────
// Provides styled confirm modals and error toasts across the app,
// replacing all browser-native window.confirm() and alert() calls.
type DialogCtx = {
  confirm: (message: string) => Promise<boolean>;
  showError: (message: string) => void;
};
const DialogContext = createContext<DialogCtx>({
  confirm: () => Promise.resolve(false),
  showError: () => {}
});
export const useDialog = () => useContext(DialogContext);

function ConfirmModal({
  message,
  onConfirm,
  onCancel
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="hb-dialog-overlay" onClick={onCancel}>
      <div className="hb-dialog-card" onClick={e => e.stopPropagation()}>
        <div className="hb-dialog-icon" aria-hidden="true">
          <Trash2 size={28} />
        </div>
        <h2 className="hb-dialog-title">Confirmar Ação</h2>
        <p className="hb-dialog-message">{message}</p>
        <div className="hb-dialog-actions">
          <button className="hb-dialog-btn cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="hb-dialog-btn confirm" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="hb-toast error" role="alert">
      <X size={16} onClick={onClose} style={{ cursor: 'pointer', flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}

function DialogProvider({ children }: { children: React.ReactNode }) {
  type ConfirmState = { message: string; resolve: (v: boolean) => void } | null;
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ message, resolve });
    });
  }, []);

  const showError = useCallback((message: string) => {
    setErrorMsg(message);
  }, []);

  const handleConfirm = () => {
    confirmState?.resolve(true);
    setConfirmState(null);
  };

  const handleCancel = () => {
    confirmState?.resolve(false);
    setConfirmState(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, showError }}>
      {children}
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      {errorMsg && (
        <ErrorToast message={errorMsg} onClose={() => setErrorMsg('')} />
      )}
    </DialogContext.Provider>
  );
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [v, setV] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const profiles = [
    { id: 'gestao', label: 'Acesso Gestão', detail: 'Gestão e Aprovações' },
    { id: 'mentor', label: 'Acesso Mentor', detail: 'Eventos e Mentoria' },
    { id: 'obr', label: 'Acesso Aluno OBR', detail: 'Registros e testes · OBR' },
    { id: 'fll', label: 'Acesso Aluno FLL', detail: 'Registros e testes · FLL' }
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.username) {
      setError('Escolha um perfil de acesso.');
      return;
    }
    try {
      const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(v) });
      sessionStorage.setItem('hortobots-token', r.token);
      sessionStorage.setItem('hortobots-user', JSON.stringify(r.user));
      onLogin(r.user);
    } catch (x) {
      setError((x as Error).message);
    }
  };

  return (
    <main className="login page-transition">
      <div className="login-orbit" aria-hidden="true">
        <i /><i /><i />
      </div>
      <section className="login-stage">
        <div className="login-art" aria-hidden="true">
          <img className="login-logo" src={logo} alt="Hortobots Planning" />
          <p>PLANEJAMENTO, TESTES E HISTÓRIA EM UM SÓ LUGAR</p>
          <div>
            <img src={fllBook} alt="Caderno FLL" />
            <img src={obrBook} alt="Caderno OBR" />
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="login-team-icons">
            <img src={fll} alt="FLL" />
            <span />
            <img src={obr} alt="OBR" />
          </div>
          <span className="paper-label">ÁREA DA EQUIPE</span>
          <h1>Bem-vindo</h1>
          <p className="login-copy">Escolha seu perfil e informe a senha de acesso.</p>
          <div className="profile-picker" role="radiogroup" aria-label="Perfil de acesso">
            {profiles.map((profile, index) => (
              <button
                type="button"
                role="radio"
                aria-checked={v.username === profile.id}
                tabIndex={v.username === profile.id || (!v.username && index === 0) ? 0 : -1}
                onKeyDown={e => {
                  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                  e.preventDefault();
                  const next = (index + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1) + profiles.length) % profiles.length;
                  setV({ ...v, username: profiles[next]!.id });
                  setError('');
                  (e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
                }}
                className={v.username === profile.id ? 'selected' : ''}
                onClick={() => {
                  setV({ ...v, username: profile.id });
                  setError('');
                }}
                key={profile.id}
              >
                <b>{profile.label}</b>
                <small>{profile.detail}</small>
              </button>
            ))}
          </div>
          <label>
            Senha
            <input
              autoComplete="current-password"
              type="password"
              value={v.password}
              onChange={e => setV({ ...v, password: e.target.value })}
              placeholder={v.username ? 'Digite a senha do perfil' : 'Escolha um perfil primeiro'}
              disabled={!v.username}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button" disabled={!v.username}>
            ENTRAR NA PLATAFORMA
          </button>
          <small>Acesso exclusivo das equipes SESI 437</small>
        </form>
      </section>
    </main>
  );
}

function Home() {
  return (
    <main className="cover page-transition">
      <section className="home-screen">
        <Link to="/" aria-label="Hortobots Planning — escolher diário">
          <img className="brand" src={logo} alt="Hortobots Planning" />
        </Link>
        <p className="eyebrow home-eyebrow">ESCOLHA O DIÁRIO</p>
        <div className="notebook-select">
          <Link className="notebook-logo" to="/fll">
            <img src={fllBook} alt="Caderno FLL" />
            <strong>FLL</strong>
          </Link>
          <span className="choice-line" />
          <Link className="notebook-logo" to="/obr">
            <img src={obrBook} alt="Caderno OBR" />
            <strong>OBR</strong>
          </Link>
        </div>
        <nav className="public-links">
          <Link to="/calendario"><CalendarDays />Calendário</Link>
          <Link to="/fll/registros"><List />Registros FLL</Link>
          <Link to="/obr/registros"><List />Registros OBR</Link>
          <Link to="/fll/testes-salvos"><ChartNoAxesCombined />Testes salvos</Link>
        </nav>
        <Link className="global-calendar" to="/calendario">
          <CalendarDays /> VER CALENDÁRIO <b>URGENTES</b>
        </Link>
      </section>
    </main>
  );
}

function SideMenu({ mod }: { mod: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={`menu-trigger ${mod}-trigger`} onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open} aria-controls="team-menu">
        <Menu />
      </button>
      <div className={`menu-layer ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
        <aside id="team-menu" className={`side-menu ${mod}-menu`} onClick={e => e.stopPropagation()}>
          <header>
            <img src={mod === 'fll' ? fll : obr} alt={mod} />
            <div>
              <strong>HORTOBOTS</strong>
              <span>{mod.toUpperCase()}</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fechar menu">
              <X />
            </button>
          </header>
          <nav>
            <Link to="/"><HomeIcon />HOME</Link>
            <Link to="/calendario"><CalendarDays />CALENDÁRIO GERAL</Link>
            <Link to={`/${mod}/registros`}><List />REGISTROS</Link>
            <Link to={`/${mod}/testes`}><ChartNoAxesCombined />SIMULAÇÕES E TESTES</Link>
            <Link to={`/${mod}/creditos`}><FileText />CRÉDITOS</Link>
          </nav>
          <footer>
            <Link to="/">Trocar de caderno</Link>
          </footer>
        </aside>
      </div>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { mod = 'fll' } = useParams();
  return (
    <div className="shell page-transition" data-modality={mod}>
      <SideMenu mod={mod} />
      <Link className="floating-brand" to="/" aria-label="Hortobots Planning — escolher diário">
        <img src={logo} alt="Hortobots Planning" />
      </Link>
      <img className="corner-team-logo" src={mod === 'fll' ? fll : obr} alt={mod} />
      {children}
    </div>
  );
}

function Hub() {
  const { mod = 'fll' } = useParams();
  return (
    <Shell>
      <section className="hub page-transition">
        <div className="stamp">{mod.toUpperCase()}</div>
        <h1>Diário de Bordo</h1>
        <div className="action-grid three">
          <Link to={`/${mod}/novo`} aria-label="Novo registro">
            <img src={novo} alt="Novo Registro" />
          </Link>
          <Link to={`/${mod}/registros`} aria-label="Registros salvos">
            <img src={salvos} alt="Registros Salvos" />
          </Link>
          <Link to={`/${mod}/testes`} aria-label="Simulações e testes">
            <img src={testsButton} alt="Simulações e Testes" />
          </Link>
        </div>
      </section>
    </Shell>
  );
}

function Records() {
  const { mod = 'fll' } = useParams();
  const [q, setQ] = useState('');
  const [date, setDate] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const loadRecords = () => {
    setLoading(true);
    void api('/api/registros')
      .then((all: any[]) => {
        const filtered = Array.isArray(all) ? all.filter(x => String(x.modality).toLowerCase() === mod) : [];
        setItems(filtered);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecords();
  }, [mod]);

  const { confirm, showError } = useDialog();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm('Tem certeza que deseja excluir este registro?');
    if (!ok) return;
    try {
      await api(`/api/registros/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(r => r.id !== id));
      setActionMsg('SUCESSO: REGISTRO REMOVIDO DO BANCO DE DADOS!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      showError(err.message || 'Erro ao excluir registro');
    }
  };

  const shown = items
    .filter(r => !date || r.date === date)
    .filter(r => `${r.title || ''} ${r.summary || ''} ${(r.tags || []).join(' ')}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Shell>
      <main className="content page-transition">
        <div className="page-title">
          <h1>Registros salvos &bull; {mod.toUpperCase()}</h1>
        </div>

        {actionMsg && (
          <div className="celebration-banner" style={{ marginBottom: '1.2rem' }}>
            <CheckCircle2 size={20} />
            <span>{actionMsg}</span>
          </div>
        )}

        <div className="filters">
          <label>
            <Search />
            <input aria-label="Pesquisar registros por texto ou tag" value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar texto ou tag" />
          </label>
          <label>
            <CalendarDays />
            <input aria-label="Filtrar registros por data" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
        </div>
        <div className="record-list">
          {shown.length > 0 ? (
            shown.map(r => (
              <div className="record-card-container" key={r.id} style={{ position: 'relative' }}>
                <Link className="record-card" to={`/${mod}/registro/${r.id}`}>
                  <div className="date-tab">
                    {String(r.date || '').slice(8)}
                    <small>
                      {String(r.date || '').slice(5, 7)}/{String(r.date || '').slice(0, 4)}
                    </small>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className="kicker">{(r.tags || []).join(' · ')}</span>
                    <h2>{r.title}</h2>
                    <p>{r.summary}</p>
                  </div>
                </Link>
                {auth() && (
                  <div className="record-card-actions">
                    <Link
                      to={`/${mod}/editar/${r.id}`}
                      className="btn-action-edit"
                      style={{ padding: '0.4rem 0.6rem' }}
                      title="Editar"
                    >
                      <Edit3 size={13} />
                    </Link>
                    <button
                      type="button"
                      className="btn-action-delete"
                      style={{ padding: '0.4rem 0.6rem' }}
                      onClick={(e) => handleDelete(r.id, e)}
                      title="Excluir"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-public">
              <h2>Nenhum registro encontrado</h2>
              <p>Comece adicionando novos registros na aba Novo Registro.</p>
            </div>
          )}
        </div>
      </main>
    </Shell>
  );
}

type MediaSlot = {
  name: string;
  type: string;
  data?: string;
  url: string;
  file?: File;
  path?: string;
};

// Faz o upload direto e assinado de mídias para a nuvem do Supabase Storage
// Sem sobrecarregar a memória do servidor nem salvar em disco local
async function uploadMediaList(
  items: MediaSlot[],
  kind: 'registros' | 'testes' = 'registros'
): Promise<Array<{ name: string; type: string; url: string; path?: string }>> {
  return Promise.all(
    items.map(async (m) => {
      // 1. Se já tem URL pública na nuvem e não tem arquivo local pendente, reutiliza direto
      if (m.url && m.url.startsWith('http') && !m.file) {
        return { name: m.name, type: m.type, url: m.url, path: m.path };
      }

      // 2. Se há um arquivo novo para enviar (armazenamento 100% na nuvem Supabase Storage)
      if (m.file) {
        try {
          const authData = await api('/api/storage/upload-url', {
            method: 'POST',
            body: JSON.stringify({ filename: m.name, type: m.type, kind })
          });

          if (authData && authData.direct && authData.signedUrl) {
            // Upload direto do arquivo bruto para o bucket da nuvem
            const upRes = await fetch(authData.signedUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': m.type || 'application/octet-stream'
              },
              body: m.file
            });

            if (upRes.ok) {
              return {
                name: m.name,
                type: m.type,
                url: authData.publicUrl,
                path: authData.path
              };
            }
          }
        } catch (err) {
          console.warn('[Storage] Fallback para envio legado:', err);
        }

        // Fallback legado em base64 se o upload direto falhar
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => resolve('');
          reader.readAsDataURL(m.file!);
        });

        return { name: m.name, type: m.type, url: '', data: base64 };
      }

      return { name: m.name, type: m.type, url: m.url || '', data: m.data || '' };
    })
  );
}

function MediaPagePanel({
  slots,
  onAdd,
  onRemove,
  focusSlot,
  onFocus
}: {
  slots: MediaSlot[];
  onAdd: (files: FileList) => void;
  onRemove: (i: number) => void;
  focusSlot: MediaSlot | null;
  onFocus: (slot: MediaSlot | null) => void;
}) {
  const isImage = (s: MediaSlot) =>
    s.type.startsWith('image') || /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(s.name);

  return (
    <div className="media-notebook-page">
      <div className="media-notebook-head">
        <span className="paper-label" style={{ textShadow: 'none' }}>IMAGENS / VIDEOS</span>
        <small className="media-count-badge">{slots.length} / 4</small>
      </div>
      <div className="media-slot-grid">
        {Array.from({ length: 4 }).map((_, i) => {
          const slot = slots[i];
          return (
            <div key={i} className={`media-slot ${slot ? 'filled' : 'empty'}`}>
              {slot ? (
                <>
                  <button
                    type="button"
                    className="media-slot-preview"
                    onClick={() => onFocus(slot)}
                    aria-label={`Ver ${slot.name}`}
                  >
                    {isImage(slot) ? (
                      <img src={slot.url} alt={slot.name} />
                    ) : (
                      <div className="media-slot-video-thumb">
                        <video src={slot.url} muted playsInline preload="metadata" />
                        <div className="media-slot-play-icon"><Video /></div>
                      </div>
                    )}
                    <div className="media-slot-label">{slot.name}</div>
                  </button>
                  <button
                    type="button"
                    className="media-slot-remove"
                    onClick={() => onRemove(i)}
                    aria-label="Remover"
                  >
                    <X />
                  </button>
                </>
              ) : (
                <label className="media-slot-add">
                  {slots.length < 4 ? (
                    <>
                      <ImageIcon />
                      <Video />
                      <span>Adicionar</span>
                      <input
                        className="visually-hidden"
                        aria-label={`Adicionar imagem ou vídeo no espaço ${i + 1}`}
                        type="file"
                        accept="image/*,video/*"
                        onChange={e => e.target.files && onAdd(e.target.files)}
                      />
                    </>
                  ) : (
                    <span style={{ fontSize: '0.78rem', opacity: 0.5, textAlign: 'center' }}>Limite atingido</span>
                  )}
                </label>
              )}
            </div>
          );
        })}
      </div>

      {/* Player de foco para preview */}
      {focusSlot && (
        <div className="focus-layer" onClick={() => onFocus(null)}>
          <button aria-label="Fechar" onClick={() => onFocus(null)}><X /></button>
          {isImage(focusSlot) ? (
            <img src={focusSlot.url} alt={focusSlot.name} />
          ) : (
            <video controls src={focusSlot.url} autoPlay onClick={e => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  );
}

function Editor({ isEdit }: { isEdit?: boolean }) {
  const { mod = 'fll', id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ date: today, title: '', summary: '', tags: ['treino'] });
  const [tag, setTag] = useState('');
  const [media, setMedia] = useState<MediaSlot[]>([]);
  const [focusSlot, setFocusSlot] = useState<MediaSlot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [celebration, setCelebration] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Se for modo edição, carrega dados atuais
  useEffect(() => {
    if (isEdit && id) {
      api(`/api/registros/${id}`)
        .then((rec: any) => {
          if (rec) {
            setForm({
              date: rec.date || today,
              title: rec.title || '',
              summary: rec.summary || '',
              tags: Array.isArray(rec.tags) ? rec.tags : ['treino']
            });
            if (Array.isArray(rec.media)) {
              setMedia(rec.media.map((m: any) => ({
                name: m.name || 'Arquivo',
                type: m.type || 'image/jpeg',
                data: m.data || '',
                url: m.url || ''
              })));
            }
          }
        })
        .catch(() => {});
    }
  }, [isEdit, id]);

  const addFiles = (fileList: FileList) => {
    const remaining = 4 - media.length;
    const toProcess = Array.from(fileList).slice(0, remaining);
    const newItems: MediaSlot[] = toProcess.map(f => ({
      name: f.name,
      type: f.type,
      url: URL.createObjectURL(f),
      file: f
    }));
    setMedia(m => [...m, ...newItems]);
  };

  const removeMedia = (idx: number) =>
    setMedia(m => m.filter((_, i) => i !== idx));

  const save = async () => {
    if (!form.title.trim()) {
      setErrorMsg('Informe o título do registro.');
      return;
    }
    setErrorMsg('');
    setIsSaving(true);
    try {
      // 1. Upload seguro e direto de todas as mídias para a nuvem Supabase Storage
      const processedMedia = await uploadMediaList(media, 'registros');

      if (isEdit && id) {
        await api(`/api/registros/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, modality: mod.toUpperCase(), media: processedMedia })
        });
      } else {
        await api('/api/registros', {
          method: 'POST',
          body: JSON.stringify({ ...form, modality: mod.toUpperCase(), media: processedMedia })
        });
      }
      setIsSaving(false);
      setCelebration('SUCESSO: REGISTRO SALVO COM EXITO NO BANCO DE DADOS!');
      // Redireciona para o calendário destacando o dia que foi gravado
      setTimeout(() => {
        navigate(`/calendario?date=${form.date}`, { state: { date: form.date } });
      }, 1300);
    } catch (e) {
      setIsSaving(false);
      setErrorMsg((e as Error).message);
    }
  };

  const add = () => {
    const t = tag.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm({ ...form, tags: [...form.tags, t] });
    setTag('');
  };

  return (
    <Shell>
      <main className="content page-transition">
        <div className="notebook-editor">
          {/* Página Esquerda: Formulário */}
          <form className="notebook-form-page" onSubmit={e => e.preventDefault()}>
            <span className="paper-label" style={{ textShadow: 'none' }}>
              {isEdit ? 'EDITAR REGISTRO' : 'NOVO REGISTRO'} · {mod.toUpperCase()}
            </span>
            <div className="ne-two">
              <label>
                Data
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </label>
              <label>
                Título
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título do dia" />
              </label>
            </div>
            <label>
              Resumo do Dia
              <AutoArea
                className="ne-textarea"
                value={form.summary}
                onChange={e => setForm({ ...form, summary: e.target.value })}
                placeholder="Descreva o treino, objetivos, conquistas, dificuldades e relato técnico do dia..."
              />
            </label>
            <div className="custom-tag">
              <input aria-label="Nova tag" value={tag} onChange={e => setTag(e.target.value)} placeholder="Nova tag" />
              <button type="button" onClick={add}><Plus /> Adicionar</button>
            </div>
            <div className="tags">
              {form.tags.map(t => (
                <span key={t}>
                  {t}
                  <button type="button" aria-label={`Remover tag ${t}`} onClick={() => setForm({ ...form, tags: form.tags.filter(x => x !== t) })}>
                    <X />
                  </button>
                </span>
              ))}
            </div>

            {errorMsg && <p className="form-error" role="alert">{errorMsg}</p>}

            {/* Elemento de carregamento não-clicável ou banner de comemoração */}
            {celebration ? (
              <div className="celebration-banner">
                <CheckCircle2 size={20} />
                <span>{celebration}</span>
              </div>
            ) : isSaving ? (
              <div className="saving-cloud-card" aria-label="Carregando">
                <div className="saving-spinner" />
              </div>
            ) : (
              <button type="button" className="button ne-save" onClick={save}>
                {isEdit ? 'SALVAR ALTERAÇÕES' : 'SALVAR REGISTRO'}
              </button>
            )}
          </form>

          {/* Spine / lombo do caderno */}
          <div className="notebook-spine" aria-hidden="true" />

          {/* Página Direita: Mídia (Imagens e Vídeos com preview e player) */}
          <MediaPagePanel
            slots={media}
            onAdd={addFiles}
            onRemove={removeMedia}
            focusSlot={focusSlot}
            onFocus={setFocusSlot}
          />
        </div>
      </main>
    </Shell>
  );
}

// ── DATA ANALYSIS COMPONENT ─────────────────────────────────────────────────
// Render a multi-line/bar analytical chart similar to matplotlib with 3 axes:
// Score, Time, Failures — each with their own scale
function DataAnalysis({ attempts }: { attempts: Attempt[] }) {
  const n = attempts.length;
  if (n === 0) return <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>Nenhuma tentativa para análise.</p>;

  // ── Normalised coordinates for 3 series ──────────────────────────────────
  const PAD = { l: 52, r: 24, t: 18, b: 36 };
  const W = 520, H = 200;
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;

  const xOf = (i: number) => PAD.l + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);

  const maxScore   = Math.max(1, ...attempts.map(a => a.score));
  const maxTime    = Math.max(1, ...attempts.map(a => a.time));
  const maxFail    = Math.max(1, ...attempts.map(a => a.failures));

  const yScore  = (v: number) => PAD.t + plotH - (v / maxScore) * plotH;
  const yTime   = (v: number) => PAD.t + plotH - (v / maxTime)  * plotH;
  const yFail   = (v: number) => PAD.t + plotH - (v / maxFail)  * plotH;

  const linePath = (vals: number[], yFn: (v: number) => number) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yFn(v).toFixed(1)}`).join(' ');

  const areaPath = (vals: number[], yFn: (v: number) => number) =>
    `${linePath(vals, yFn)} L${xOf(n - 1).toFixed(1)},${(PAD.t + plotH).toFixed(1)} L${xOf(0).toFixed(1)},${(PAD.t + plotH).toFixed(1)} Z`;

  // ── Statistics summary ───────────────────────────────────────────────────
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const scores = attempts.map(a => a.score);
  const times  = attempts.map(a => a.time);
  const fails  = attempts.map(a => a.failures);

  const avgScore = avg(scores);
  const avgTime  = avg(times);
  const avgFail  = avg(fails);
  const maxScoreVal = Math.max(...scores);
  const minTimeVal  = Math.min(...times);

  // Trend: slope of linear regression on scores
  const trendSlope = (() => {
    if (n < 2) return 0;
    const meanX = (n - 1) / 2;
    const meanY = avgScore;
    const num = scores.reduce((s, y, i) => s + (i - meanX) * (y - meanY), 0);
    const den = scores.reduce((s, _, i) => s + (i - meanX) ** 2, 0);
    return den === 0 ? 0 : num / den;
  })();

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="da-root">
      {/* ── Chart Area ───────────────────────────────────────── */}
      <div className="da-chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="da-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gscore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gtime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map(t => {
            const y = PAD.t + plotH - t * plotH;
            return (
              <g key={t}>
                <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#334155" strokeWidth="0.8" strokeDasharray="4 3" />
                <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#64748b">
                  {Math.round(t * maxScore)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {attempts.map((_, i) => (
            <text key={i} x={xOf(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize="9" fill="#64748b">T{i + 1}</text>
          ))}

          {/* Axes */}
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + plotH} stroke="#475569" strokeWidth="1" />
          <line x1={PAD.l} y1={PAD.t + plotH} x2={W - PAD.r} y2={PAD.t + plotH} stroke="#475569" strokeWidth="1" />

          {/* Area fills */}
          <path d={areaPath(scores, yScore)} fill="url(#gscore)" />
          <path d={areaPath(times, yTime)}  fill="url(#gtime)" />

          {/* Failure bars (subtle) */}
          {attempts.map((a, i) => {
            const bh = maxFail > 0 ? (a.failures / maxFail) * plotH * 0.4 : 0;
            const bw = Math.max(4, plotW / n * 0.35);
            return (
              <rect
                key={i}
                x={xOf(i) - bw / 2}
                y={PAD.t + plotH - bh}
                width={bw}
                height={bh}
                fill="#f43f5e"
                opacity="0.55"
                rx="2"
              />
            );
          })}

          {/* Time line */}
          <path d={linePath(times, yTime)} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5 3" />
          {attempts.map((a, i) => (
            <circle key={i} cx={xOf(i)} cy={yTime(a.time)} r="3.5" fill="#a78bfa" />
          ))}

          {/* Score line */}
          <path d={linePath(scores, yScore)} fill="none" stroke="#22d3ee" strokeWidth="2" />
          {attempts.map((a, i) => (
            <circle key={i} cx={xOf(i)} cy={yScore(a.score)} r="4.5" fill="#22d3ee" stroke="#0f172a" strokeWidth="1.2" />
          ))}

          {/* Trend line for score */}
          {n >= 2 && (() => {
            const meanX = (n - 1) / 2;
            const intercept = avgScore - trendSlope * meanX;
            const ty0 = yScore(Math.max(0, intercept));
            const ty1 = yScore(Math.max(0, trendSlope * (n - 1) + intercept));
            return (
              <line
                x1={xOf(0)} y1={ty0}
                x2={xOf(n - 1)} y2={ty1}
                stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="6 3" opacity="0.7"
              />
            );
          })()}
        </svg>
      </div>

      {/* ── Legend ────────────────────────────────────────────── */}
      <div className="da-legend">
        <span><i style={{ background: '#22d3ee' }} /> Pontuação</span>
        <span><i style={{ background: '#a78bfa' }} /> Tempo (s)</span>
        <span><i style={{ background: '#f43f5e' }} /> Falhas</span>
        <span><i style={{ background: '#fbbf24', height: '2px', width: '18px', display: 'inline-block', borderRadius: '1px' }} /> Tendência</span>
      </div>

      {/* ── Stats Cards ───────────────────────────────────────── */}
      <div className="da-stats">
        <div className="da-stat-card score">
          <span className="da-stat-label">Pontuação Máxima</span>
          <span className="da-stat-value">{maxScoreVal}</span>
          <span className="da-stat-sub">média {avgScore.toFixed(1)}</span>
        </div>
        <div className="da-stat-card time">
          <span className="da-stat-label">Melhor Tempo</span>
          <span className="da-stat-value">{minTimeVal}s</span>
          <span className="da-stat-sub">média {avgTime.toFixed(0)}s</span>
        </div>
        <div className="da-stat-card fail">
          <span className="da-stat-label">Falhas (média)</span>
          <span className="da-stat-value">{avgFail.toFixed(1)}</span>
          <span className="da-stat-sub">total {fails.reduce((s, v) => s + v, 0)}</span>
        </div>
        <div className={`da-stat-card trend ${trendSlope >= 0 ? 'up' : 'down'}`}>
          <span className="da-stat-label">Tendência</span>
          <span className="da-stat-value">{trendSlope >= 0 ? '↑' : '↓'} {Math.abs(trendSlope).toFixed(2)}</span>
          <span className="da-stat-sub">{trendSlope >= 0 ? 'Melhora' : 'Queda'} por tentativa</span>
        </div>
      </div>
    </div>
  );
}

function Tests({ isEdit }: { isEdit?: boolean }) {
  const { mod = 'fll', id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState('Hortobots');
  const [count, setCount] = useState(3);
  const [attempts, setAttempts] = useState<Attempt[]>(
    Array.from({ length: 15 }, () => ({ time: 150, score: 0, failures: 0, observed: 0 }))
  );
  const [media, setMedia] = useState<MediaSlot[]>([]);
  const [focusSlot, setFocusSlot] = useState<MediaSlot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [celebration, setCelebration] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [base, setBase] = useState({ date: today, title: '', objective: '', comments: '', mission: '' });
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      api(`/api/testes/${id}`)
        .then((t: any) => {
          if (t) {
            setBase({
              date: t.date || today,
              title: t.title || '',
              objective: t.objective || '',
              comments: t.comments || '',
              mission: t.mission || ''
            });
            if (t.team) setTeam(t.team);
            if (Array.isArray(t.attempts) && t.attempts.length > 0) {
              setCount(t.attempts.length);
              setAttempts(prev => {
                const copy = [...prev];
                t.attempts.forEach((att: any, idx: number) => {
                  if (idx < copy.length) copy[idx] = att;
                });
                return copy;
              });
            }
            if (Array.isArray(t.media)) {
              setMedia(t.media.map((m: any) => ({
                name: m.name || 'Arquivo',
                type: m.type || 'image/jpeg',
                data: m.data || '',
                url: m.url || ''
              })));
            }
          }
        })
        .catch(() => {});
    }
  }, [isEdit, id]);

  const addFiles = (fileList: FileList) => {
    const remaining = 4 - media.length;
    const toProcess = Array.from(fileList).slice(0, remaining);
    const newItems: MediaSlot[] = toProcess.map(f => ({
      name: f.name,
      type: f.type,
      url: URL.createObjectURL(f),
      file: f
    }));
    setMedia(m => [...m, ...newItems]);
  };

  const removeMedia = (idx: number) =>
    setMedia(m => m.filter((_, i) => i !== idx));

  const save = async () => {
    if (!base.title.trim()) {
      setErrorMsg('Informe o nome do teste.');
      return;
    }
    setErrorMsg('');
    setIsSaving(true);
    try {
      // 1. Upload seguro e direto de todas as mídias para a nuvem Supabase Storage
      const processedMedia = await uploadMediaList(media, 'testes');

      const payload = {
        ...base,
        modality: mod.toUpperCase(),
        team,
        attempts: attempts.slice(0, count),
        media: processedMedia
      };

      if (isEdit && id) {
        await api(`/api/testes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/api/testes', { method: 'POST', body: JSON.stringify(payload) });
      }

      setIsSaving(false);
      setCelebration('SUCESSO: TESTE E SIMULACAO SALVOS COM EXITO NO BANCO DE DADOS!');
      setTimeout(() => {
        navigate(`/calendario?date=${base.date}`, { state: { date: base.date } });
      }, 1300);
    } catch (e) {
      setIsSaving(false);
      setErrorMsg((e as Error).message);
    }
  };

  const activeAttempts = attempts.slice(0, count);

  return (
    <Shell>
      <main
        className={`content tests-page page-transition ${team === 'UnderConstruction' ? 'under' : ''}`}
      >
        <div className="tests-head">
          <div>
            <span className="kicker">SIMULAÇÕES E TESTES</span>
            <h1>{isEdit ? 'EDITAR TESTE' : mod.toUpperCase()}</h1>
          </div>
          {mod === 'fll' && (
            <select value={team} onChange={e => setTeam(e.target.value)}>
              <option>Hortobots</option>
              <option>UnderConstruction</option>
            </select>
          )}
        </div>

        <div className="test-workspace">
          {/* ── Left: Form ── */}
          <section className="test-form">
            <div className="two">
              <label>
                Data
                <input type="date" value={base.date} onChange={e => setBase({ ...base, date: e.target.value })} />
              </label>
              <label>
                Nº de tentativas
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={count}
                  onChange={e => setCount(Math.max(1, Math.min(15, +e.target.value)))}
                />
              </label>
            </div>
            <label>
              Nome do teste
              <input value={base.title} onChange={e => setBase({ ...base, title: e.target.value })} />
            </label>
            <label>
              Objetivo
              <AutoArea value={base.objective} onChange={e => setBase({ ...base, objective: e.target.value })} />
            </label>
            {mod === 'fll' && (
              <label>
                Missão BIOGLOW
                <select value={base.mission} onChange={e => setBase({ ...base, mission: e.target.value })}>
                  <option value="">Selecione</option>
                  {MISSIONS.map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="attempts">
              {activeAttempts.map((a, i) => (
                <fieldset key={i}>
                  <legend>Tentativa {i + 1}</legend>
                  <label>
                    Tempo (s)
                    <input
                      type="number"
                      value={a.time}
                      onChange={e => {
                        const n = [...attempts];
                        n[i] = { ...a, time: +e.target.value };
                        setAttempts(n);
                      }}
                    />
                  </label>
                  <label>
                    {mod === 'fll' ? 'Pontuação' : 'Valor observado'}
                    <input
                      type="number"
                      value={mod === 'fll' ? a.score : a.observed}
                      onChange={e => {
                        const n = [...attempts];
                        n[i] = { ...a, [mod === 'fll' ? 'score' : 'observed']: +e.target.value, score: +e.target.value };
                        setAttempts(n);
                      }}
                    />
                  </label>
                  <label>
                    Falhas
                    <input
                      type="number"
                      value={a.failures}
                      onChange={e => {
                        const n = [...attempts];
                        n[i] = { ...a, failures: +e.target.value };
                        setAttempts(n);
                      }}
                    />
                  </label>
                </fieldset>
              ))}
            </div>
            <label>
              Comentários opcionais
              <AutoArea value={base.comments} onChange={e => setBase({ ...base, comments: e.target.value })} />
            </label>

            {errorMsg && <p className="form-error" role="alert">{errorMsg}</p>}

            {celebration ? (
              <div className="celebration-banner">
                <CheckCircle2 size={20} />
                <span>{celebration}</span>
              </div>
            ) : isSaving ? (
              <div className="saving-cloud-card" aria-label="Carregando">
                <div className="saving-spinner" />
              </div>
            ) : (
              <button className="button" type="button" onClick={save}>
                {isEdit ? 'SALVAR ALTERAÇÕES' : 'SALVAR TESTE'}
              </button>
            )}
          </section>

          {/* ── Right: Analysis + Media ── */}
          <aside className="test-results">
            <div className="da-panel-header">
              <span className="kicker">ANÁLISE DE DESEMPENHO</span>
              <button
                type="button"
                className={`da-toggle-btn ${showAnalysis ? 'active' : ''}`}
                onClick={() => setShowAnalysis(v => !v)}
              >
                {showAnalysis ? 'Ocultar gráficos' : 'Ver gráficos'}
              </button>
            </div>

            {showAnalysis && <DataAnalysis attempts={activeAttempts} />}

            <div style={{ marginTop: '1.2rem' }}>
              <span className="paper-label test-media-label">MÍDIAS DO TESTE</span>
              <MediaPagePanel
                slots={media}
                onAdd={addFiles}
                onRemove={removeMedia}
                focusSlot={focusSlot}
                onFocus={setFocusSlot}
              />
            </div>
          </aside>
        </div>
      </main>
    </Shell>
  );
}

function SavedTests() {
  const { mod = 'fll' } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const loadTests = () => {
    void api('/api/testes')
      .then((all: any[]) => setItems(all.filter(x => String(x.modality).toLowerCase() === mod)))
      .catch(() => {});
  };

  useEffect(() => {
    loadTests();
  }, [mod]);

  const { confirm, showError } = useDialog();

  const handleDelete = async (id: string) => {
    const ok = await confirm('Tem certeza que deseja excluir este teste?');
    if (!ok) return;
    try {
      await api(`/api/testes/${id}`, { method: 'DELETE' });
      setActionMsg('SUCESSO: TESTE EXCLUIDO DO BANCO DE DADOS!');
      setItems(prev => prev.filter(x => x.id !== id));
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      showError(err.message || 'Erro ao excluir teste');
    }
  };

  const shown = items.filter(x => JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));

  return (
    <Shell>
      <main className="content page-transition">
        <div className="page-title">
          <div>
            <span className="kicker">CONSULTA PÚBLICA</span>
            <h1>Testes salvos</h1>
          </div>
          {auth() && <Link className="button" to={'/' + mod + '/testes'}>LANÇAR NOVO TESTE</Link>}
        </div>

        {actionMsg && (
          <div className="celebration-banner" style={{ marginBottom: '1.2rem' }}>
            <CheckCircle2 size={20} />
            <span>{actionMsg}</span>
          </div>
        )}

        <div className="filters">
          <label>
            <Search />
            <input aria-label="Pesquisar teste, missão ou equipe" value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar teste, missão ou equipe" />
          </label>
        </div>
        <div className="record-list">
          {shown.length ? (
            shown.map(x => (
              <article className="record-card saved-test-card" key={x.id}>
                <div className="saved-test-summary">
                  <div className="date-tab">
                    {String(x.date).slice(8)}
                    <small>
                      {String(x.date).slice(5, 7)}/{String(x.date).slice(0, 4)}
                    </small>
                  </div>
                  <div>
                    <span className="kicker">
                      {x.team || mod.toUpperCase()} &bull; {x.mission || 'TESTE TÉCNICO'}
                    </span>
                    <h2>{x.title}</h2>
                    <p>{x.objective}</p>
                  </div>
                </div>
                {auth() && (
                  <div className="item-actions-row">
                    <Link to={`/${mod}/testes/editar/${x.id}`} className="btn-action-edit">
                      <Edit3 size={13} /> Editar
                    </Link>
                    <button
                      type="button"
                      className="btn-action-delete"
                      onClick={() => handleDelete(x.id)}
                    >
                      <Trash2 size={13} /> Excluir
                    </button>
                  </div>
                )}
              </article>
            ))
          ) : (
            <article className="empty-public">
              <ChartNoAxesCombined />
              <h2>Nenhum teste salvo</h2>
              <p>Os testes publicados aparecerão aqui.</p>
            </article>
          )}
        </div>
      </main>
    </Shell>
  );
}

function RecordView() {
  const { mod = 'fll', id } = useParams();
  const navigate = useNavigate();
  const [rec, setRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [focusMedia, setFocusMedia] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    void api('/api/registros')
      .then((list: any[]) => {
        const found = list.find((x: any) => x.id === id);
        setRec(found || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const { confirm, showError } = useDialog();

  const handleDelete = async () => {
    const ok = await confirm('Tem certeza que deseja excluir este registro do diário de bordo?');
    if (!ok) return;
    setIsDeleting(true);
    try {
      await api(`/api/registros/${id}`, { method: 'DELETE' });
      setActionMsg('SUCESSO: REGISTRO EXCLUIDO DO BANCO DE DADOS!');
      setTimeout(() => {
        navigate(`/calendario?date=${rec?.date || ''}`, { state: { date: rec?.date } });
      }, 1200);
    } catch (err: any) {
      showError(err.message || 'Erro ao excluir registro');
      setIsDeleting(false);
    }
  };

  const mediaItems: any[] = Array.isArray(rec?.media) ? rec.media : [];

  // Resolve URL da mídia: se já for URL pública do Supabase Storage ou data:, usa direto
  const resolveUrl = (m: any): string => {
    if (String(m.url || '').startsWith('http')) return m.url;
    if (String(m.data || '').startsWith('data:')) return m.data;
    const folder = `${rec?.date}-${rec?.id}`;
    return `${API}/api/media/registros/${folder}/${m.path || m.name}`;
  };

  const isVideoItem = (m: any, url: string) =>
    String(m?.type || '').startsWith('video') ||
    /\.(mp4|mov|webm|ogg|m4v)$/i.test(url) ||
    /\.(mp4|mov|webm|ogg|m4v)$/i.test(m?.name || '');

  return (
    <Shell>
      <main className="content page-transition">
        {actionMsg && (
          <div className="celebration-banner" style={{ marginBottom: '1.2rem' }}>
            <CheckCircle2 size={20} />
            <span>{actionMsg}</span>
          </div>
        )}

        <div className="record-view-layout">
          <article className="paper diary">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stamp small">{mod.toUpperCase()}</span>
              {auth() && rec && (
                <div className="item-actions-row" style={{ marginTop: 0 }}>
                  <Link to={`/${mod}/editar/${id}`} className="btn-action-edit">
                    <Edit3 size={14} /> Editar
                  </Link>
                  <button
                    type="button"
                    className="btn-action-delete"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 size={14} /> {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              )}
            </div>

            <h1>{loading ? 'Carregando...' : (rec?.title || 'Registro do Diário')}</h1>
            <p className="long-date">{rec?.date ? `Data oficial: ${rec.date}` : ''}</p>
            {rec?.summary && (
              <div className="summary">
                <strong>Resumo do Dia:</strong>
                <p style={{ whiteSpace: 'pre-line', marginTop: '0.5rem' }}>{rec.summary}</p>
              </div>
            )}
            {rec?.body && <p style={{ marginTop: '1.5rem', whiteSpace: 'pre-line' }}>{rec.body}</p>}
            {Array.isArray(rec?.tags) && rec.tags.length > 0 && (
              <div className="tags" style={{ marginTop: '1.5rem' }}>
                {rec.tags.map((t: string) => <span key={t}>{t}</span>)}
              </div>
            )}
          </article>

          {/* Painel lateral de mídia do registro */}
          {mediaItems.length > 0 && (
            <aside className="record-media-panel">
              <div className="record-media-head">
                <span className="paper-label" style={{ textShadow: 'none', color: 'var(--ink)' }}>IMAGENS / VIDEOS</span>
                <small>{mediaItems.length} arquivo{mediaItems.length !== 1 ? 's' : ''}</small>
              </div>
              <div className="record-media-grid">
                {mediaItems.map((m: any, i: number) => {
                  const url = resolveUrl(m);
                  const isVideo = isVideoItem(m, url);
                  return (
                    <button
                      key={i}
                      type="button"
                      className="record-media-cell"
                      onClick={() => setFocusMedia({ ...m, resolvedUrl: url, isVideo })}
                      aria-label={`Ver ${m.name}`}
                    >
                      {isVideo ? (
                        <div className="record-media-video-thumb">
                          <video src={url} muted playsInline preload="metadata" />
                          <div className="media-slot-play-icon"><Video /></div>
                        </div>
                      ) : (
                        <img src={url} alt={m.name} loading="lazy" />
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>
          )}
        </div>

        {/* Lightbox de foco */}
        {focusMedia && (
          <div className="focus-layer" onClick={() => setFocusMedia(null)}>
            <button aria-label="Fechar" onClick={() => setFocusMedia(null)}><X /></button>
            {focusMedia.isVideo || isVideoItem(focusMedia, focusMedia.resolvedUrl || focusMedia.url) ? (
              <video controls autoPlay src={focusMedia.resolvedUrl || focusMedia.url} onClick={e => e.stopPropagation()} />
            ) : (
              <img src={focusMedia.resolvedUrl || focusMedia.url} alt={focusMedia.name} />
            )}
          </div>
        )}
      </main>
    </Shell>
  );
}

function Credits() {
  return (
    <Shell>
      <main className="content credits page-transition">
        <section className="paper">
          <Link to="/" aria-label="Hortobots Planning — escolher diário">
            <img src={logo} alt="Hortobots Planning" />
          </Link>
          <h1>Hortobots Planning</h1>
          <p>SESI 437 &bull; Hortolândia &bull; Diário de Bordo Digital</p>
        </section>
      </main>
    </Shell>
  );
}

const preloadImage = (src: string): Promise<void> => {
  return new Promise(resolve => {
    const img = new Image();
    img.src = src;
    if (img.complete) {
      if (img.decode) {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    } else {
      img.onload = () => {
        if (img.decode) {
          img.decode().then(() => resolve()).catch(() => resolve());
        } else {
          resolve();
        }
      };
      img.onerror = () => resolve();
    }
  });
};

const waitForDomImages = async (timeoutMs = 450): Promise<void> => {
  const imgs = Array.from(document.querySelectorAll('img'));
  const checkImgs = Promise.all(
    imgs.map(img => {
      if (img.complete && (img.naturalWidth > 0 || img.naturalHeight > 0)) {
        return Promise.resolve();
      }
      return new Promise<void>(resolve => {
        if (img.complete) return resolve();
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(done, timeoutMs);
      });
    })
  );

  await Promise.race([
    checkImgs,
    new Promise(r => setTimeout(r, timeoutMs))
  ]);
};

const waitForRenderComplete = async (criticalSources: string[] = []): Promise<void> => {
  await new Promise(r => requestAnimationFrame(r));

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  if (criticalSources.length > 0) {
    await Promise.all(criticalSources.map(preloadImage));
  }

  await waitForDomImages(500);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise(r => setTimeout(r, 80));
};

function TransitionScreen({ active }: { active: boolean }) {
  return (
    <div className={`screen-transition-overlay ${active ? 'active' : ''}`} aria-hidden="true">
      <div className="transition-loader-card">
        <img className="transition-mascot" src={mascote} alt="Carregando" />
        <div className="transition-bar" />
        <span className="transition-text">Carregando Diário</span>
      </div>
    </div>
  );
}

export function App() {
  useOverlayAccessibility();
  // Restaura sessao anterior da sessionStorage, se existir
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = sessionStorage.getItem('hortobots-user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isFirstMount = useRef(true);

  const location = useLocation();
  const navigate = useNavigate();

  // Bloqueio e mascaramento na inicialização: só libera quando a página inicial estiver 100% pronta
  useEffect(() => {
    const bootLoader = document.getElementById('initial-loader');
    if (bootLoader) bootLoader.remove();

    let mounted = true;
    const criticalAssets = [
      mascote,
      logo,
      fllBook,
      obrBook,
      fll,
      obr,
      fundo1280,
      fundo1920
    ];

    const safetyTimer = setTimeout(() => {
      if (mounted) setIsInitialLoading(false);
    }, 1500);

    waitForRenderComplete(criticalAssets).then(() => {
      if (mounted) {
        clearTimeout(safetyTimer);
        setIsInitialLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Transições entre telas: mascara elementos com timeout garantido de saída
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    let active = true;
    setIsTransitioning(true);
    window.scrollTo(0, 0);

    const safetyTimer = setTimeout(() => {
      if (active) setIsTransitioning(false);
    }, 450);

    const checkRoute = async () => {
      await new Promise(r => requestAnimationFrame(r));
      await waitForDomImages(350);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise(r => setTimeout(r, 60));
      if (active) {
        clearTimeout(safetyTimer);
        setIsTransitioning(false);
      }
    };

    checkRoute();

    return () => {
      active = false;
      clearTimeout(safetyTimer);
    };
  }, [location.pathname]);

  const handleLoginSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    setIsTransitioning(true);
    navigate('/');

    // Desativa a transicao garantidamente mesmo se a rota atual ja for /
    setTimeout(async () => {
      try {
        await new Promise(r => requestAnimationFrame(r));
        await waitForDomImages(350);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      } finally {
        setIsTransitioning(false);
      }
    }, 80);
  };

  const handleLogout = () => {
    setIsTransitioning(true);
    sessionStorage.clear();
    setUser(null);
    navigate('/');

    setTimeout(async () => {
      try {
        await new Promise(r => requestAnimationFrame(r));
        await waitForDomImages(350);
      } finally {
        setIsTransitioning(false);
      }
    }, 80);
  };

  const isOverlayActive = isInitialLoading || isTransitioning;

  // Se o usuário NÃO estiver logado: a tela inicial (index) É SEMPRE o Login
  if (!user) {
    return (
      <>
        <TransitionScreen active={isOverlayActive} />
        <Routes>
          <Route path="/" element={<Login onLogin={handleLoginSuccess} />} />
          <Route path="/login" element={<Login onLogin={handleLoginSuccess} />} />
          {/* Qualquer rota acessada sem autenticação redireciona para a tela de login inicial */}
          <Route path="*" element={<Login onLogin={handleLoginSuccess} />} />
        </Routes>
      </>
    );
  }

  // Usuário autenticado: acesso às áreas da plataforma
  return (
    <DialogProvider>
      <TransitionScreen active={isOverlayActive} />
      <button
        className="logout"
        onClick={handleLogout}
        title={'Sair (' + user.username + ')'}
        aria-label="Sair da conta"
      >
        <LogOut />
      </button>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Home />} />
        <Route path="/calendario" element={<CalendarView api={api} user={user} />} />
        <Route path="/:mod" element={<Hub />} />
        <Route path="/:mod/registros" element={<Records />} />
        <Route path="/:mod/novo" element={<Editor />} />
        <Route path="/:mod/editar/:id" element={<Editor isEdit />} />
        <Route path="/:mod/testes" element={<Tests />} />
        <Route path="/:mod/testes/editar/:id" element={<Tests isEdit />} />
        <Route path="/:mod/testes-salvos" element={<SavedTests />} />
        <Route path="/:mod/registro/:id" element={<RecordView />} />
        <Route path="/:mod/creditos" element={<Credits />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </DialogProvider>
  );
}
