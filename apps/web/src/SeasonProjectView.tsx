import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Droplets,
  Edit3,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  Leaf,
  Plus,
  Save,
  Sun,
  Thermometer,
  Trash2,
  Upload,
  Video,
  Wind,
  X
} from 'lucide-react';
import { API, api } from './client';
import type { AccountUser } from '@hortobots/shared/permissions';

export type SeasonMediaKind = 'image' | 'video' | 'pdf';

export interface SeasonAttachment {
  id: string;
  name: string;
  kind: SeasonMediaKind;
  mime: string;
  url: string;
  path?: string;
  uploadedAt: string;
}

export interface SeasonArticleSection {
  id: string;
  title: string;
  category: 'projeto' | 'conscientizacao' | 'jatai' | 'metodologia' | 'resultados';
  status: 'completo' | 'em_aberto';
  body: string;
  openNote?: string;
  updatedAt: string;
  attachments: SeasonAttachment[];
}

export interface SeasonProjectTest {
  id: string;
  date: string;
  title: string;
  description: string;
  weather: string;
  temperatureC: number | null;
  humidityPct: number | null;
  windKmh: number | null;
  buzzerActive: boolean | null;
  frequencyHz: number | null;
  beeAppearances: number | null;
  notes: string;
  attachments: SeasonAttachment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonProjectData {
  version: number;
  updatedAt: string;
  updatedBy: string;
  article: {
    title: string;
    subtitle: string;
    summary: string;
    sections: SeasonArticleSection[];
  };
  tests: SeasonProjectTest[];
}

function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo selecionado.'));
    reader.readAsDataURL(file);
  });
}

function ClimateBeeChart({ tests }: { tests: SeasonProjectTest[] }) {
  const ordered = useMemo(
    () =>
      [...tests]
        .filter(t => t.beeAppearances !== null || t.temperatureC !== null || t.humidityPct !== null || t.windKmh !== null)
        .sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [tests]
  );

  const [showTemp, setShowTemp] = useState(true);
  const [showHumidity, setShowHumidity] = useState(true);
  const [showWind, setShowWind] = useState(true);

  if (ordered.length === 0) {
    return (
      <div className="sp-empty-chart">
        <BarChart3 size={32} />
        <strong>Gráfico científico aguardando dados reais</strong>
        <p>
          Assim que os testes da placa com contagem de abelhas jataí e parâmetros climáticos forem registrados pela equipe,
          as curvas comparativas aparecerão automaticamente aqui.
        </p>
      </div>
    );
  }

  const width = 760;
  const height = 270;
  const padL = 48;
  const padR = 48;
  const padT = 24;
  const padB = 46;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxBees = Math.max(10, ...ordered.map(t => Number(t.beeAppearances ?? 0)));
  const maxClimate = Math.max(
    100,
    ...ordered.map(t => Math.max(Number(t.temperatureC ?? 0), Number(t.humidityPct ?? 0), Number(t.windKmh ?? 0)))
  );

  const xAt = (i: number) => (ordered.length === 1 ? padL + plotW / 2 : padL + (i / (ordered.length - 1)) * plotW);
  const yBees = (val: number) => padT + plotH - (val / maxBees) * plotH;
  const yClim = (val: number) => padT + plotH - (val / maxClimate) * plotH;

  const buildPath = (getter: (t: SeasonProjectTest) => number | null, yFn: (v: number) => number) => {
    const pts = ordered
      .map((t, i) => {
        const v = getter(t);
        return v === null || Number.isNaN(v) ? null : `${xAt(i)},${yFn(v)}`;
      })
      .filter(Boolean) as string[];
    if (pts.length === 0) return '';
    return `M ${pts.join(' L ')}`;
  };

  const tempPath = showTemp ? buildPath(t => t.temperatureC, yClim) : '';
  const humPath = showHumidity ? buildPath(t => t.humidityPct, yClim) : '';
  const windPath = showWind ? buildPath(t => t.windKmh, yClim) : '';

  return (
    <div className="sp-chart-box">
      <div className="sp-chart-controls">
        <span className="sp-chart-legend-item bees">
          <i /> Aparições de Jataís (barras)
        </span>
        <button
          type="button"
          className={`sp-chart-toggle ${showTemp ? 'active temp' : ''}`}
          onClick={() => setShowTemp(v => !v)}
        >
          Temperatura (°C)
        </button>
        <button
          type="button"
          className={`sp-chart-toggle ${showHumidity ? 'active hum' : ''}`}
          onClick={() => setShowHumidity(v => !v)}
        >
          Umidade (%)
        </button>
        <button
          type="button"
          className={`sp-chart-toggle ${showWind ? 'active wind' : ''}`}
          onClick={() => setShowWind(v => !v)}
        >
          Vento (km/h)
        </button>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="sp-chart-svg" role="img" aria-label="Gráfico de aparições de abelhas e parâmetros climáticos">
        {[0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
          const y = padT + plotH * (1 - step);
          return (
            <g key={idx}>
              <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#173d2d22" strokeDasharray="4 4" />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#173d2d99">
                {Math.round(maxBees * step)}
              </text>
              <text x={width - padR + 8} y={y + 4} textAnchor="start" fontSize="11" fill="#173d2d99">
                {Math.round(maxClimate * step)}
              </text>
            </g>
          );
        })}

        {ordered.map((t, i) => {
          const x = xAt(i);
          const bees = Number(t.beeAppearances ?? 0);
          const barW = Math.min(34, Math.max(14, plotW / Math.max(ordered.length * 2, 4)));
          const barY = yBees(bees);
          return (
            <g key={t.id}>
              {t.beeAppearances !== null && (
                <rect
                  x={x - barW / 2}
                  y={barY}
                  width={barW}
                  height={Math.max(2, padT + plotH - barY)}
                  rx={4}
                  fill="#173d2d"
                  opacity={0.78}
                >
                  <title>{`${t.title} (${t.date}): ${bees} aparições`}</title>
                </rect>
              )}
              <text x={x} y={height - 14} textAnchor="middle" fontSize="11" fill="#173d2d">
                {t.date ? `${t.date.slice(8)}/${t.date.slice(5, 7)}` : `T${i + 1}`}
              </text>
            </g>
          );
        })}

        {tempPath && <path d={tempPath} fill="none" stroke="#dc2626" strokeWidth={2.5} />}
        {humPath && <path d={humPath} fill="none" stroke="#0284c7" strokeWidth={2.5} />}
        {windPath && <path d={windPath} fill="none" stroke="#d97706" strokeWidth={2.5} strokeDasharray="5 3" />}

        {ordered.map((t, i) => (
          <g key={`${t.id}-pts`}>
            {showTemp && t.temperatureC !== null && (
              <circle cx={xAt(i)} cy={yClim(t.temperatureC)} r={4} fill="#dc2626">
                <title>{`Temp: ${t.temperatureC}°C`}</title>
              </circle>
            )}
            {showHumidity && t.humidityPct !== null && (
              <circle cx={xAt(i)} cy={yClim(t.humidityPct)} r={4} fill="#0284c7">
                <title>{`Umidade: ${t.humidityPct}%`}</title>
              </circle>
            )}
            {showWind && t.windKmh !== null && (
              <circle cx={xAt(i)} cy={yClim(t.windKmh)} r={4} fill="#d97706">
                <title>{`Vento: ${t.windKmh} km/h`}</title>
              </circle>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function SeasonProjectView({ user }: { user: AccountUser | null }) {
  const canEdit = user?.role === 'fll';
  const [data, setData] = useState<SeasonProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'artigo' | 'testes'>('artigo');

  // Edição de artigo (Aluno FLL)
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerDraft, setHeaderDraft] = useState({ title: '', subtitle: '', summary: '' });
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionDraft, setSectionDraft] = useState<SeasonArticleSection | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [newSection, setNewSection] = useState<{
    title: string;
    category: SeasonArticleSection['category'];
    status: 'completo' | 'em_aberto';
    body: string;
    openNote: string;
  }>({
    title: '',
    category: 'projeto',
    status: 'em_aberto',
    body: '',
    openNote: ''
  });

  // Criação / edição de teste científico
  const emptyTestForm = () => ({
    id: '',
    date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()),
    title: '',
    description: '',
    weather: 'Ensolarado',
    temperatureC: '',
    humidityPct: '',
    windKmh: '',
    buzzerActive: 'sim' as 'sim' | 'nao' | 'na',
    frequencyHz: '',
    beeAppearances: '',
    notes: '',
    attachments: [] as SeasonAttachment[]
  });
  const [testFormOpen, setTestFormOpen] = useState(false);
  const [testForm, setTestForm] = useState(emptyTestForm);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api('/api/projeto-temporada')
      .then((res: SeasonProjectData) => {
        if (active && res?.article) {
          setData(res);
          setHeaderDraft({
            title: res.article.title,
            subtitle: res.article.subtitle,
            summary: res.article.summary
          });
        }
      })
      .catch(() => {
        if (active) setErrorMsg('Não foi possível carregar os dados do Projeto da Temporada.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const persistProject = async (next: SeasonProjectData, successMessage: string) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const saved = await api('/api/projeto-temporada', {
        method: 'PUT',
        body: JSON.stringify(next)
      });
      setData(saved);
      setStatusMsg(successMessage);
      window.setTimeout(() => setStatusMsg(''), 4000);
      return true;
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar alterações.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadFiles = async (files: FileList | null): Promise<SeasonAttachment[]> => {
    if (!files || files.length === 0) return [];
    setUploading(true);
    setErrorMsg('');
    const uploaded: SeasonAttachment[] = [];
    try {
      for (const file of Array.from(files)) {
        const base64 = await fileToDataUrl(file);
        const res = await api('/api/projeto-temporada/media', {
          method: 'POST',
          body: JSON.stringify({
            name: file.name,
            type: file.type || 'application/octet-stream',
            data: base64
          })
        });
        uploaded.push(res);
      }
      return uploaded;
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao enviar arquivo anexo.');
      return uploaded;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const next: SeasonProjectData = {
      ...data,
      article: {
        ...data.article,
        title: headerDraft.title.trim() || data.article.title,
        subtitle: headerDraft.subtitle.trim(),
        summary: headerDraft.summary.trim()
      }
    };
    const ok = await persistProject(next, 'Cabeçalho do artigo atualizado!');
    if (ok) setEditingHeader(false);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !sectionDraft) return;
    const next: SeasonProjectData = {
      ...data,
      article: {
        ...data.article,
        sections: data.article.sections.map(s =>
          s.id === sectionDraft.id
            ? { ...sectionDraft, updatedAt: new Date().toISOString() }
            : s
        )
      }
    };
    const ok = await persistProject(next, 'Seção do artigo salva!');
    if (ok) {
      setEditingSectionId(null);
      setSectionDraft(null);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newSection.title.trim()) return;
    const created: SeasonArticleSection = {
      id: `sec-${Date.now().toString(36)}`,
      title: newSection.title.trim(),
      category: newSection.category,
      status: newSection.status,
      body: newSection.body.trim(),
      openNote: newSection.openNote.trim() || undefined,
      updatedAt: new Date().toISOString(),
      attachments: []
    };
    const next: SeasonProjectData = {
      ...data,
      article: {
        ...data.article,
        sections: [...data.article.sections, created]
      }
    };
    const ok = await persistProject(next, 'Nova seção adicionada ao artigo!');
    if (ok) {
      setAddingSection(false);
      setNewSection({ title: '', category: 'projeto', status: 'em_aberto', body: '', openNote: '' });
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!data) return;
    const next: SeasonProjectData = {
      ...data,
      article: {
        ...data.article,
        sections: data.article.sections.filter(s => s.id !== id)
      }
    };
    await persistProject(next, 'Seção removida.');
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !testForm.title.trim()) return;
    const now = new Date().toISOString();
    const toNum = (v: string) => (v.trim() === '' ? null : Number(v));

    const entry: SeasonProjectTest = {
      id: testForm.id || `test-${Date.now().toString(36)}`,
      date: testForm.date,
      title: testForm.title.trim(),
      description: testForm.description.trim(),
      weather: testForm.weather.trim() || 'Não informado',
      temperatureC: toNum(testForm.temperatureC),
      humidityPct: toNum(testForm.humidityPct),
      windKmh: toNum(testForm.windKmh),
      buzzerActive: testForm.buzzerActive === 'na' ? null : testForm.buzzerActive === 'sim',
      frequencyHz: toNum(testForm.frequencyHz),
      beeAppearances: toNum(testForm.beeAppearances),
      notes: testForm.notes.trim(),
      attachments: testForm.attachments,
      createdBy: user?.username || 'fll',
      createdAt: testForm.id
        ? data.tests.find(t => t.id === testForm.id)?.createdAt || now
        : now,
      updatedAt: now
    };

    const exists = data.tests.some(t => t.id === entry.id);
    const nextTests = exists
      ? data.tests.map(t => (t.id === entry.id ? entry : t))
      : [entry, ...data.tests];

    const ok = await persistProject(
      { ...data, tests: nextTests },
      exists ? 'Teste científico atualizado!' : 'Teste científico registrado!'
    );
    if (ok) {
      setTestFormOpen(false);
      setTestForm(emptyTestForm());
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!data) return;
    await persistProject(
      { ...data, tests: data.tests.filter(t => t.id !== id) },
      'Teste removido.'
    );
  };

  const stats = useMemo(() => {
    const tests = data?.tests || [];
    const beeVals = tests.map(t => t.beeAppearances).filter((v): v is number => v !== null);
    const tempVals = tests.map(t => t.temperatureC).filter((v): v is number => v !== null);
    const humVals = tests.map(t => t.humidityPct).filter((v): v is number => v !== null);
    const avg = (arr: number[]) => (arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—');
    return {
      total: tests.length,
      avgBees: avg(beeVals),
      avgTemp: avg(tempVals),
      avgHum: avg(humVals)
    };
  }, [data]);

  if (loading) {
    return (
      <div className="sp-shell">
        <div className="sp-loading">Carregando Projeto da Temporada BIOGLOW...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="sp-shell">
        <div className="sp-alert error">{errorMsg || 'Conteúdo indisponível.'}</div>
      </div>
    );
  }

  return (
    <div className="sp-shell">
      <div className="sp-hero">
        <div className="sp-hero-kicker">
          <Leaf size={15} />
          <span>SESI HORTOBOTS · FIRST LEGO LEAGUE BIOGLOW 2026/2027</span>
          <span className={`sp-mode-pill ${canEdit ? 'edit' : 'read'}`}>
            {canEdit ? 'Modo Edição (Aluno FLL)' : 'Modo Leitura'}
          </span>
        </div>

        {!editingHeader ? (
          <>
            <div className="sp-hero-title-row">
              <h1>{data.article.title}</h1>
              {canEdit && (
                <button
                  type="button"
                  className="sp-btn-outline"
                  onClick={() => {
                    setHeaderDraft({
                      title: data.article.title,
                      subtitle: data.article.subtitle,
                      summary: data.article.summary
                    });
                    setEditingHeader(true);
                  }}
                >
                  <Edit3 size={15} /> Editar resumo
                </button>
              )}
            </div>
            <p className="sp-hero-subtitle">{data.article.subtitle}</p>
            <p className="sp-hero-summary">{data.article.summary}</p>
          </>
        ) : (
          <form className="sp-card sp-form" onSubmit={handleSaveHeader}>
            <label>
              <span>Título do Artigo</span>
              <input
                value={headerDraft.title}
                onChange={e => setHeaderDraft(h => ({ ...h, title: e.target.value }))}
                required
              />
            </label>
            <label>
              <span>Subtítulo</span>
              <input
                value={headerDraft.subtitle}
                onChange={e => setHeaderDraft(h => ({ ...h, subtitle: e.target.value }))}
              />
            </label>
            <label>
              <span>Resumo Executivo</span>
              <textarea
                rows={4}
                value={headerDraft.summary}
                onChange={e => setHeaderDraft(h => ({ ...h, summary: e.target.value }))}
              />
            </label>
            <div className="sp-form-actions">
              <button type="button" className="sp-btn-outline" onClick={() => setEditingHeader(false)}>
                Cancelar
              </button>
              <button type="submit" className="sp-btn-primary" disabled={saving}>
                <Save size={15} /> {saving ? 'Salvando...' : 'Salvar cabeçalho'}
              </button>
            </div>
          </form>
        )}

        <nav className="sp-pill-nav" aria-label="Navegação do Projeto da Temporada">
          <button
            type="button"
            className={activeTab === 'artigo' ? 'active' : ''}
            onClick={() => setActiveTab('artigo')}
          >
            <BookOpen size={16} /> Artigo e Conscientização
          </button>
          <button
            type="button"
            className={activeTab === 'testes' ? 'active' : ''}
            onClick={() => setActiveTab('testes')}
          >
            <FlaskConical size={16} /> Testes Científicos e Clima ({data.tests.length})
          </button>
        </nav>
      </div>

      {statusMsg && (
        <div className="sp-alert success">
          <CheckCircle2 size={17} /> <span>{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="sp-alert error">
          <AlertCircle size={17} /> <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'artigo' && (
        <div className="sp-article-layout">
          <aside className="sp-toc sp-card">
            <h2>Índice do Artigo</h2>
            <ol>
              {data.article.sections.map(sec => (
                <li key={sec.id}>
                  <a href={`#${sec.id}`}>{sec.title}</a>
                  {sec.status === 'em_aberto' && <span className="sp-open-dot" title="Área em aberto" />}
                </li>
              ))}
            </ol>
            {canEdit && (
              <button
                type="button"
                className="sp-btn-primary sp-full-btn"
                onClick={() => setAddingSection(true)}
              >
                <Plus size={15} /> Nova Seção
              </button>
            )}
          </aside>

          <div className="sp-article-content">
            {addingSection && canEdit && (
              <form className="sp-card sp-form" onSubmit={handleAddSection}>
                <h3>Adicionar Nova Seção (Estilo Wikipédia)</h3>
                <div className="sp-form-grid">
                  <label>
                    <span>Título da Seção</span>
                    <input
                      value={newSection.title}
                      onChange={e => setNewSection(s => ({ ...s, title: e.target.value }))}
                      placeholder="Ex.: 5. Resultados das Iterações do Protótipo"
                      required
                    />
                  </label>
                  <label>
                    <span>Categoria</span>
                    <select
                      value={newSection.category}
                      onChange={e => setNewSection(s => ({ ...s, category: e.target.value as any }))}
                    >
                      <option value="projeto">O Projeto (The Beezy Box)</option>
                      <option value="conscientizacao">Conscientização sobre Abelhas</option>
                      <option value="jatai">Abelhas Jataí</option>
                      <option value="metodologia">Metodologia</option>
                      <option value="resultados">Resultados e Iterações</option>
                    </select>
                  </label>
                  <label>
                    <span>Status da Seção</span>
                    <select
                      value={newSection.status}
                      onChange={e => setNewSection(s => ({ ...s, status: e.target.value as any }))}
                    >
                      <option value="em_aberto">Em aberto (aguardando dados)</option>
                      <option value="completo">Conteúdo consolidado</option>
                    </select>
                  </label>
                </div>
                <label>
                  <span>Texto Científico / Conteúdo</span>
                  <textarea
                    rows={6}
                    value={newSection.body}
                    onChange={e => setNewSection(s => ({ ...s, body: e.target.value }))}
                    placeholder="Escreva o conteúdo detalhado desta seção..."
                  />
                </label>
                {newSection.status === 'em_aberto' && (
                  <label>
                    <span>Aviso de pendência (o que falta completar)</span>
                    <input
                      value={newSection.openNote}
                      onChange={e => setNewSection(s => ({ ...s, openNote: e.target.value }))}
                      placeholder="Ex.: Faltam fotos do antes/depois e links das fontes."
                    />
                  </label>
                )}
                <div className="sp-form-actions">
                  <button type="button" className="sp-btn-outline" onClick={() => setAddingSection(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="sp-btn-primary" disabled={saving}>
                    <Save size={15} /> {saving ? 'Salvando...' : 'Publicar seção'}
                  </button>
                </div>
              </form>
            )}

            {data.article.sections.map(sec => {
              const isEditingThis = editingSectionId === sec.id && sectionDraft;
              return (
                <article className="sp-card sp-section" id={sec.id} key={sec.id}>
                  {!isEditingThis ? (
                    <>
                      <header className="sp-section-head">
                        <div>
                          <h2>{sec.title}</h2>
                          {sec.status === 'em_aberto' && (
                            <span className="sp-badge-open">
                              <AlertCircle size={13} /> Área em aberto — aguardando dados da equipe
                            </span>
                          )}
                        </div>
                        {canEdit && (
                          <div className="sp-section-actions">
                            <button
                              type="button"
                              className="sp-btn-outline"
                              onClick={() => {
                                setEditingSectionId(sec.id);
                                setSectionDraft({ ...sec });
                              }}
                            >
                              <Edit3 size={14} /> Editar
                            </button>
                            <button
                              type="button"
                              className="sp-btn-danger"
                              onClick={() => handleDeleteSection(sec.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </header>

                      {sec.status === 'em_aberto' && sec.openNote && (
                        <div className="sp-open-box">
                          <strong>Pendência registrada:</strong> {sec.openNote}
                        </div>
                      )}

                      <div className="sp-section-body">
                        {sec.body.split('\n').map((para, idx) =>
                          para.trim() ? <p key={idx}>{para}</p> : <br key={idx} />
                        )}
                      </div>

                      {sec.attachments.length > 0 && (
                        <div className="sp-attachments-grid">
                          {sec.attachments.map(att => (
                            <div className="sp-attachment-item" key={att.id}>
                              {att.kind === 'image' && (
                                <img src={resolveMediaUrl(att.url)} alt={att.name} loading="lazy" />
                              )}
                              {att.kind === 'video' && (
                                <video src={resolveMediaUrl(att.url)} controls preload="metadata" />
                              )}
                              {att.kind === 'pdf' && (
                                <a
                                  href={resolveMediaUrl(att.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="sp-pdf-link"
                                >
                                  <FileText size={20} />
                                  <span>{att.name}</span>
                                </a>
                              )}
                              <small>{att.name}</small>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <form className="sp-form" onSubmit={handleSaveSection}>
                      <h3>Editando Seção</h3>
                      <div className="sp-form-grid">
                        <label>
                          <span>Título</span>
                          <input
                            value={sectionDraft.title}
                            onChange={e => setSectionDraft(s => (s ? { ...s, title: e.target.value } : s))}
                            required
                          />
                        </label>
                        <label>
                          <span>Status</span>
                          <select
                            value={sectionDraft.status}
                            onChange={e =>
                              setSectionDraft(s => (s ? { ...s, status: e.target.value as any } : s))
                            }
                          >
                            <option value="em_aberto">Em aberto (aguardando dados)</option>
                            <option value="completo">Conteúdo consolidado</option>
                          </select>
                        </label>
                      </div>
                      <label>
                        <span>Conteúdo</span>
                        <textarea
                          rows={8}
                          value={sectionDraft.body}
                          onChange={e => setSectionDraft(s => (s ? { ...s, body: e.target.value } : s))}
                        />
                      </label>
                      {sectionDraft.status === 'em_aberto' && (
                        <label>
                          <span>Nota de pendência</span>
                          <input
                            value={sectionDraft.openNote || ''}
                            onChange={e => setSectionDraft(s => (s ? { ...s, openNote: e.target.value } : s))}
                          />
                        </label>
                      )}
                      <div className="sp-upload-row">
                        <label className="sp-upload-btn">
                          <Upload size={15} />
                          <span>{uploading ? 'Enviando...' : 'Anexar Imagem, Vídeo ou PDF'}</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*,application/pdf"
                            disabled={uploading}
                            onChange={async e => {
                              const added = await uploadFiles(e.target.files);
                              if (added.length) {
                                setSectionDraft(s =>
                                  s ? { ...s, attachments: [...s.attachments, ...added] } : s
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      {sectionDraft.attachments.length > 0 && (
                        <div className="sp-chip-list">
                          {sectionDraft.attachments.map(att => (
                            <span className="sp-chip" key={att.id}>
                              {att.name}
                              <button
                                type="button"
                                onClick={() =>
                                  setSectionDraft(s =>
                                    s
                                      ? { ...s, attachments: s.attachments.filter(a => a.id !== att.id) }
                                      : s
                                  )
                                }
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="sp-form-actions">
                        <button
                          type="button"
                          className="sp-btn-outline"
                          onClick={() => {
                            setEditingSectionId(null);
                            setSectionDraft(null);
                          }}
                        >
                          Cancelar
                        </button>
                        <button type="submit" className="sp-btn-primary" disabled={saving || uploading}>
                          <Save size={15} /> {saving ? 'Salvando...' : 'Salvar seção'}
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'testes' && (
        <div className="sp-tests-layout">
          <div className="sp-kpi-grid">
            <div className="sp-kpi-card">
              <FlaskConical size={20} />
              <div>
                <small>Testes Registrados</small>
                <strong>{stats.total}</strong>
              </div>
            </div>
            <div className="sp-kpi-card">
              <Leaf size={20} />
              <div>
                <small>Média Aparições (Jataís)</small>
                <strong>{stats.avgBees}</strong>
              </div>
            </div>
            <div className="sp-kpi-card">
              <Thermometer size={20} />
              <div>
                <small>Temperatura Média</small>
                <strong>{stats.avgTemp === '—' ? '—' : `${stats.avgTemp} °C`}</strong>
              </div>
            </div>
            <div className="sp-kpi-card">
              <Droplets size={20} />
              <div>
                <small>Umidade Média</small>
                <strong>{stats.avgHum === '—' ? '—' : `${stats.avgHum} %`}</strong>
              </div>
            </div>
          </div>

          <section className="sp-card">
            <div className="sp-section-head">
              <div>
                <h2>Correlação: Aparições de Abelhas Jataí × Parâmetros Climáticos</h2>
                <p className="sp-muted">
                  Comparativo entre quantidade de visitações registradas e variáveis de clima, temperatura, umidade e vento.
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="sp-btn-primary"
                  onClick={() => {
                    setTestForm(emptyTestForm());
                    setTestFormOpen(true);
                  }}
                >
                  <Plus size={15} /> Registrar Teste da Placa
                </button>
              )}
            </div>
            <ClimateBeeChart tests={data.tests} />
          </section>

          {testFormOpen && canEdit && (
            <form className="sp-card sp-form" onSubmit={handleSaveTest}>
              <div className="sp-section-head">
                <h3>{testForm.id ? 'Editar Sessão de Teste' : 'Nova Sessão de Teste Científico'}</h3>
                <button type="button" className="sp-btn-outline" onClick={() => setTestFormOpen(false)}>
                  <X size={15} />
                </button>
              </div>
              <div className="sp-form-grid">
                <label>
                  <span>Data do Teste</span>
                  <input
                    type="date"
                    value={testForm.date}
                    onChange={e => setTestForm(f => ({ ...f, date: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  <span>Título / Identificação da Sessão</span>
                  <input
                    value={testForm.title}
                    onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ex.: Teste Campo #01 - Colmeia Jataí"
                    required
                  />
                </label>
                <label>
                  <span>Clima</span>
                  <select
                    value={testForm.weather}
                    onChange={e => setTestForm(f => ({ ...f, weather: e.target.value }))}
                  >
                    <option value="Ensolarado">Ensolarado</option>
                    <option value="Parcialmente nublado">Parcialmente nublado</option>
                    <option value="Nublado">Nublado</option>
                    <option value="Chuvoso">Chuvoso</option>
                    <option value="Ambiente controlado">Ambiente controlado</option>
                  </select>
                </label>
                <label>
                  <span>Temperatura (°C)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={testForm.temperatureC}
                    onChange={e => setTestForm(f => ({ ...f, temperatureC: e.target.value }))}
                    placeholder="Ex.: 26.5"
                  />
                </label>
                <label>
                  <span>Umidade (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={testForm.humidityPct}
                    onChange={e => setTestForm(f => ({ ...f, humidityPct: e.target.value }))}
                    placeholder="Ex.: 62"
                  />
                </label>
                <label>
                  <span>Vento (km/h)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={testForm.windKmh}
                    onChange={e => setTestForm(f => ({ ...f, windKmh: e.target.value }))}
                    placeholder="Ex.: 8.4"
                  />
                </label>
                <label>
                  <span>Buzzer Ligado?</span>
                  <select
                    value={testForm.buzzerActive}
                    onChange={e => setTestForm(f => ({ ...f, buzzerActive: e.target.value as any }))}
                  >
                    <option value="sim">Sim (Buzzer ativo)</option>
                    <option value="nao">Não (Controle sem som)</option>
                    <option value="na">Não informado</option>
                  </select>
                </label>
                <label>
                  <span>Frequência (Hz)</span>
                  <input
                    type="number"
                    step="1"
                    value={testForm.frequencyHz}
                    onChange={e => setTestForm(f => ({ ...f, frequencyHz: e.target.value }))}
                    placeholder="Ex.: 240"
                  />
                </label>
                <label>
                  <span>Aparições de Jataís</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={testForm.beeAppearances}
                    onChange={e => setTestForm(f => ({ ...f, beeAppearances: e.target.value }))}
                    placeholder="Quantidade observada"
                  />
                </label>
              </div>
              <label>
                <span>Descrição / Protocolo Aplicado</span>
                <textarea
                  rows={3}
                  value={testForm.description}
                  onChange={e => setTestForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva o cenário, distância da flor/colmeia e duração do teste..."
                />
              </label>
              <label>
                <span>Observações e Conclusões</span>
                <textarea
                  rows={3}
                  value={testForm.notes}
                  onChange={e => setTestForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Anotações sobre o comportamento das abelhas ou ajustes na placa..."
                />
              </label>
              <div className="sp-upload-row">
                <label className="sp-upload-btn">
                  <Upload size={15} />
                  <span>{uploading ? 'Enviando anexos...' : 'Anexar Planilha/Relatório em PDF, Fotos ou Vídeos'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,application/pdf"
                    disabled={uploading}
                    onChange={async e => {
                      const added = await uploadFiles(e.target.files);
                      if (added.length) {
                        setTestForm(f => ({ ...f, attachments: [...f.attachments, ...added] }));
                      }
                    }}
                  />
                </label>
              </div>
              {testForm.attachments.length > 0 && (
                <div className="sp-chip-list">
                  {testForm.attachments.map(att => (
                    <span className="sp-chip" key={att.id}>
                      {att.name}
                      <button
                        type="button"
                        onClick={() =>
                          setTestForm(f => ({
                            ...f,
                            attachments: f.attachments.filter(a => a.id !== att.id)
                          }))
                        }
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="sp-form-actions">
                <button type="button" className="sp-btn-outline" onClick={() => setTestFormOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="sp-btn-primary" disabled={saving || uploading}>
                  <Save size={15} /> {saving ? 'Salvando...' : 'Salvar Teste Científico'}
                </button>
              </div>
            </form>
          )}

          <section className="sp-card">
            <h2>Planilha e Histórico de Testes da Placa</h2>
            {data.tests.length === 0 ? (
              <div className="sp-open-box">
                <strong>Em aberto:</strong> Nenhum teste de campo foi lançado ainda. Quando os testes da placa e as
                planilhas de aparecimento das abelhas jataí forem registrados pelo perfil <strong>Aluno FLL</strong>,
                eles aparecerão aqui com todos os parâmetros climáticos e anexos em PDF.
              </div>
            ) : (
              <div className="sp-test-list">
                {data.tests.map(t => (
                  <article className="sp-test-item" key={t.id}>
                    <header className="sp-test-head">
                      <div>
                        <span className="sp-test-date">
                          <Calendar size={13} /> {t.date}
                        </span>
                        <h3>{t.title}</h3>
                      </div>
                      {canEdit && (
                        <div className="sp-section-actions">
                          <button
                            type="button"
                            className="sp-btn-outline"
                            onClick={() => {
                              setTestForm({
                                id: t.id,
                                date: t.date,
                                title: t.title,
                                description: t.description,
                                weather: t.weather,
                                temperatureC: t.temperatureC === null ? '' : String(t.temperatureC),
                                humidityPct: t.humidityPct === null ? '' : String(t.humidityPct),
                                windKmh: t.windKmh === null ? '' : String(t.windKmh),
                                buzzerActive: t.buzzerActive === null ? 'na' : t.buzzerActive ? 'sim' : 'nao',
                                frequencyHz: t.frequencyHz === null ? '' : String(t.frequencyHz),
                                beeAppearances: t.beeAppearances === null ? '' : String(t.beeAppearances),
                                notes: t.notes,
                                attachments: t.attachments || []
                              });
                              setTestFormOpen(true);
                            }}
                          >
                            <Edit3 size={14} /> Editar
                          </button>
                          <button
                            type="button"
                            className="sp-btn-danger"
                            onClick={() => handleDeleteTest(t.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </header>

                    <div className="sp-param-badges">
                      <span><Sun size={13} /> Clima: {t.weather}</span>
                      <span><Thermometer size={13} /> Temp: {t.temperatureC !== null ? `${t.temperatureC} °C` : '—'}</span>
                      <span><Droplets size={13} /> Umidade: {t.humidityPct !== null ? `${t.humidityPct} %` : '—'}</span>
                      <span><Wind size={13} /> Vento: {t.windKmh !== null ? `${t.windKmh} km/h` : '—'}</span>
                      <span>
                        Buzzer: {t.buzzerActive === null ? '—' : t.buzzerActive ? 'Ligado' : 'Desligado'}
                        {t.frequencyHz !== null ? ` (${t.frequencyHz} Hz)` : ''}
                      </span>
                      <span className="highlight">
                        Aparições de Jataís: {t.beeAppearances !== null ? t.beeAppearances : '—'}
                      </span>
                    </div>

                    {t.description && <p>{t.description}</p>}
                    {t.notes && (
                      <p className="sp-muted">
                        <strong>Observações:</strong> {t.notes}
                      </p>
                    )}

                    {t.attachments && t.attachments.length > 0 && (
                      <div className="sp-attachments-grid">
                        {t.attachments.map(att => (
                          <div className="sp-attachment-item" key={att.id}>
                            {att.kind === 'image' && (
                              <a href={resolveMediaUrl(att.url)} target="_blank" rel="noopener noreferrer">
                                <ImageIcon size={14} /> {att.name}
                              </a>
                            )}
                            {att.kind === 'video' && (
                              <a href={resolveMediaUrl(att.url)} target="_blank" rel="noopener noreferrer">
                                <Video size={14} /> {att.name}
                              </a>
                            )}
                            {att.kind === 'pdf' && (
                              <a
                                href={resolveMediaUrl(att.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sp-pdf-link"
                              >
                                <FileText size={16} /> <span>{att.name}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
