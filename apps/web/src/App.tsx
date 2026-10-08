import { useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  ChartNoAxesCombined,
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
import underBg from './assets/originals/fundo_underconstruction.png';
import mascote from './assets/generated/mascote.webp';
import { CalendarView } from './CalendarView';

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

function AutoArea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = '0';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [p.value]);
  return <textarea {...p} ref={ref} />;
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
            {profiles.map(profile => (
              <button
                type="button"
                role="radio"
                aria-checked={v.username === profile.id}
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
        <img className="brand" src={logo} alt="Hortobots Planning" />
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
          <Link className="access-link" to="/login">ACESSAR CONTA</Link>
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
      <button className={`menu-trigger ${mod}-trigger`} onClick={() => setOpen(true)} aria-label="Abrir menu">
        <Menu />
      </button>
      <div className={`menu-layer ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
        <aside className={`side-menu ${mod}-menu`} onClick={e => e.stopPropagation()}>
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
            <Link to={`/${mod}`}><HomeIcon />HOME</Link>
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
      <Link className="floating-brand" to={`/${mod}`}>
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

  useEffect(() => {
    setLoading(true);
    void api('/api/registros')
      .then((all: any[]) => {
        const filtered = Array.isArray(all) ? all.filter(x => String(x.modality).toLowerCase() === mod) : [];
        setItems(filtered);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [mod]);

  const shown = items
    .filter(r => !date || r.date === date)
    .filter(r => `${r.title || ''} ${r.summary || ''} ${(r.tags || []).join(' ')}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Shell>
      <main className="content page-transition">
        <div className="page-title">
          <h1>Registros salvos &bull; {mod.toUpperCase()}</h1>
        </div>
        <div className="filters">
          <label>
            <Search />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar texto ou tag" />
          </label>
          <label>
            <CalendarDays />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
        </div>
        <div className="record-list">
          {shown.length > 0 ? (
            shown.map(r => (
              <Link className="record-card" to={`/${mod}/registro/${r.id}`} key={r.id}>
                <div className="date-tab">
                  {String(r.date || '').slice(8)}
                  <small>
                    {String(r.date || '').slice(5, 7)}/{String(r.date || '').slice(0, 4)}
                  </small>
                </div>
                <div>
                  <span className="kicker">{(r.tags || []).join(' · ')}</span>
                  <h2>{r.title}</h2>
                  <p>{r.summary}</p>
                </div>
              </Link>
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

function Editor() {
  const { mod = 'fll' } = useParams();
  const [form, setForm] = useState({ date: today, title: '', summary: '', body: '', tags: ['treino'] });
  const [tag, setTag] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const [saved, setSaved] = useState('');

  const files = (e: React.ChangeEvent<HTMLInputElement>) =>
    [...(e.target.files || [])].forEach(f => {
      const r = new FileReader();
      r.onload = () => setMedia(m => [...m, { name: f.name, type: f.type, data: String(r.result) }]);
      r.readAsDataURL(f);
    });

  const save = async () => {
    try {
      await api('/api/registros', {
        method: 'POST',
        body: JSON.stringify({ ...form, modality: mod.toUpperCase(), media })
      });
      setSaved('Registro salvo com sucesso!');
    } catch (e) {
      setSaved((e as Error).message);
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
        <form className="simple-editor" onSubmit={e => e.preventDefault()}>
          <span className="paper-label">NOVO REGISTRO · {mod.toUpperCase()}</span>
          <label>
            Data
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </label>
          <label>
            Título
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </label>
          <label>
            Resumo
            <AutoArea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          </label>
          <label>
            Relato Técnico
            <AutoArea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
          </label>
          <div className="custom-tag">
            <input value={tag} onChange={e => setTag(e.target.value)} placeholder="Adicionar tag personalizada" />
            <button type="button" onClick={add}>
              <Plus /> Adicionar
            </button>
          </div>
          <div className="tags">
            {form.tags.map(t => (
              <span key={t}>
                {t}
                <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter(x => x !== t) })}>
                  <X />
                </button>
              </span>
            ))}
          </div>
          <label className="media-add">
            <ImageIcon />
            <Video />
            Adicionar imagens ou vídeos
            <input hidden multiple type="file" accept="image/*,video/*" onChange={files} />
          </label>
          <button type="button" className="button" onClick={save}>
            SALVAR REGISTRO
          </button>
          {saved && <p className="cal-alert-banner">{saved}</p>}
        </form>
      </main>
    </Shell>
  );
}

function Chart({ attempts, type }: { attempts: Attempt[]; type: string }) {
  const max = Math.max(1, ...attempts.map(x => x.score));
  if (type === 'pie') {
    const total = attempts.reduce((s, x) => s + x.score, 0) || 1;
    let acc = 0;
    return (
      <div
        className="pie"
        style={{
          background: `conic-gradient(${attempts
            .map((x, i) => {
              const a = (acc / total) * 360;
              acc += x.score;
              return `hsl(${i * 45} 75% 48%) ${a}deg ${(acc / total) * 360}deg`;
            })
            .join(',')})`
        }}
      />
    );
  }
  return (
    <svg className="chart" viewBox="0 0 520 260">
      {attempts.map((a, i) => {
        const x = 35 + i * (450 / Math.max(1, attempts.length - 1));
        const y = 225 - (a.score / max) * 180;
        return type === 'bar' ? (
          <rect key={i} x={x - 12} y={y} width="24" height={225 - y} rx="5" />
        ) : (
          <g key={i}>
            <circle cx={x} cy={y} r="6" />
            {i > 0 && (
              <line
                x1={35 + (i - 1) * (450 / Math.max(1, attempts.length - 1))}
                y1={225 - (attempts[i - 1]!.score / max) * 180}
                x2={x}
                y2={y}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Tests() {
  const { mod = 'fll' } = useParams();
  const [team, setTeam] = useState('Hortobots');
  const [count, setCount] = useState(3);
  const [chart, setChart] = useState('line');
  const [attempts, setAttempts] = useState<Attempt[]>(
    Array.from({ length: 15 }, () => ({ time: 150, score: 0, failures: 0, observed: 0 }))
  );
  const [focus, setFocus] = useState<string | null>(null);
  const [media, setMedia] = useState<{ name: string; type: string; url: string; data: string }[]>([]);
  const [saved, setSaved] = useState('');
  const [base, setBase] = useState({ date: today, title: '', objective: '', comments: '', mission: '' });

  const files = (e: React.ChangeEvent<HTMLInputElement>) =>
    [...(e.target.files || [])].forEach(f => {
      const r = new FileReader();
      r.onload = () => setMedia(m => [...m, { name: f.name, type: f.type, url: String(r.result), data: String(r.result) }]);
      r.readAsDataURL(f);
    });

  const save = async () => {
    try {
      await api('/api/testes', {
        method: 'POST',
        body: JSON.stringify({
          ...base,
          modality: mod.toUpperCase(),
          team,
          chart,
          attempts: attempts.slice(0, count),
          media
        })
      });
      setSaved('Teste salvo com sucesso!');
    } catch (e) {
      setSaved((e as Error).message);
    }
  };

  return (
    <Shell>
      <main
        className={`content tests-page page-transition ${team === 'UnderConstruction' ? 'under' : ''}`}
        style={team === 'UnderConstruction' ? { backgroundImage: `linear-gradient(#18091bbb,#18091bbb),url(${underBg})` } : {}}
      >
        <div className="tests-head">
          <div>
            <span className="kicker">SIMULAÇÕES E TESTES</span>
            <h1>{mod.toUpperCase()}</h1>
          </div>
          {mod === 'fll' && (
            <select value={team} onChange={e => setTeam(e.target.value)}>
              <option>Hortobots</option>
              <option>UnderConstruction</option>
            </select>
          )}
        </div>
        <div className="test-workspace">
          <section className="test-form">
            <div className="two">
              <label>
                Data
                <input type="date" value={base.date} onChange={e => setBase({ ...base, date: e.target.value })} />
              </label>
              <label>
                Quantidade de tentativas
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={count}
                  onChange={e => setCount(Math.max(3, Math.min(15, +e.target.value)))}
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
              {attempts.slice(0, count).map((a, i) => (
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
            <button className="button" type="button" onClick={save}>
              SALVAR TESTE
            </button>
            {saved && <p className="cal-alert-banner">{saved}</p>}
          </section>
          <aside className="test-results">
            <div className="chart-tools">
              <select value={chart} onChange={e => setChart(e.target.value)}>
                <option value="line">Linha</option>
                <option value="bar">Barras</option>
                <option value="pie">Circular</option>
              </select>
            </div>
            <button className="chart-focus" onClick={() => setFocus('chart')}>
              <Chart attempts={attempts.slice(0, count)} type={chart} />
            </button>
            <label className="media-add">
              <ImageIcon />
              <Video />
              Adicionar imagens ou vídeos
              <input hidden multiple type="file" accept="image/*,video/*" onChange={files} />
            </label>
            <div className="media-grid">
              {media.map((m, i) => (
                <button key={i} onClick={() => setFocus(m.url)}>
                  {m.type.startsWith('image') ? <img src={m.url} alt={m.name} /> : <video src={m.url} />}
                </button>
              ))}
            </div>
          </aside>
        </div>
        {focus && (
          <div className="focus-layer" onClick={() => setFocus(null)}>
            <button aria-label="Fechar"><X /></button>
            {focus === 'chart' ? (
              <Chart attempts={attempts.slice(0, count)} type={chart} />
            ) : focus.startsWith('data:image') ? (
              <img src={focus} alt="Foco" />
            ) : (
              <video controls src={focus} />
            )}
          </div>
        )}
      </main>
    </Shell>
  );
}

function SavedTests() {
  const { mod = 'fll' } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    void api('/api/testes')
      .then((all: any[]) => setItems(all.filter(x => String(x.modality).toLowerCase() === mod)))
      .catch(() => {});
  }, [mod]);

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
        <div className="filters">
          <label>
            <Search />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar teste, missão ou equipe" />
          </label>
        </div>
        <div className="record-list">
          {shown.length ? (
            shown.map(x => (
              <article className="record-card" key={x.id}>
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
  const [rec, setRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api('/api/registros')
      .then((list: any[]) => {
        const found = list.find((x: any) => x.id === id);
        setRec(found || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Shell>
      <main className="content page-transition">
        <article className="paper diary">
          <span className="stamp small">{mod.toUpperCase()}</span>
          <h1>{rec?.title || 'Registro do Diário'}</h1>
          <p className="long-date">{rec?.date ? `Data oficial: ${rec.date}` : ''}</p>
          <div className="summary">
            <strong>Resumo:</strong> {rec?.summary || 'Carregando detalhes...'}
          </div>
          {rec?.body && <p style={{ marginTop: '1.5rem', whiteSpace: 'pre-line' }}>{rec.body}</p>}
        </article>
      </main>
    </Shell>
  );
}

function Credits() {
  return (
    <Shell>
      <main className="content credits page-transition">
        <section className="paper">
          <img src={logo} alt="Hortobots Planning" />
          <h1>Hortobots Planning</h1>
          <p>SESI 437 &bull; Hortolândia &bull; Diário de Bordo Digital</p>
        </section>
      </main>
    </Shell>
  );
}

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
  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('hortobots-user') || 'null');
    } catch {
      return null;
    }
  });

  const location = useLocation();
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Efeito de transição suave estilo videogame (fade out to black -> troca -> fade in)
  useEffect(() => {
    setIsTransitioning(true);
    window.scrollTo(0, 0);

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLoginSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/home');
      setIsTransitioning(false);
    }, 250);
  };

  const handleLogout = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      sessionStorage.clear();
      setUser(null);
      navigate('/');
      setIsTransitioning(false);
    }, 250);
  };

  // Se o usuário NÃO estiver logado: a tela inicial (index) É SEMPRE o Login
  if (!user) {
    return (
      <>
        <TransitionScreen active={isTransitioning} />
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
    <>
      <TransitionScreen active={isTransitioning} />
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
        <Route path="/:mod/testes" element={<Tests />} />
        <Route path="/:mod/testes-salvos" element={<SavedTests />} />
        <Route path="/:mod/registro/:id" element={<RecordView />} />
        <Route path="/:mod/creditos" element={<Credits />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}

