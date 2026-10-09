import { useState, useEffect, useMemo } from 'react';
import { AutoArea, useDialog } from './App';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ActivityCard, type ActivityKind, type ActivitySource } from './ActivityCard';
import { TEAMS, notebookRoute, type TeamKey } from './teams';
import { findActivities } from './activities';
import {
  Home as HomeIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CalendarDays,
  List,
  ChartNoAxesCombined,
  Edit3,
  Trash2,
  X,
  Search
} from 'lucide-react';

interface CalendarEvent extends ActivitySource {
  id: string;
  date: string;
  title: string;
  priority: 'COMUM' | 'URGENTE';
  period: string;
  lesson: string;
  comments?: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'PUBLICADO';
  createdBy?: string;
  createdAt?: string;
}

interface StoredRecordSummary extends ActivitySource {
  id: string;
  modality: 'FLL' | 'OBR';
  date: string;
  title: string;
  summary: string;
  tags?: string[];
}

interface StoredTestSummary extends ActivitySource {
  id: string;
  modality: string;
  team: string;
  date: string;
  title: string;
  objective: string;
}

interface CalendarViewProps {
  api: (path: string, init?: RequestInit) => Promise<any>;
  user: { username: string; role: 'management' | 'mentor' | 'obr' | 'fll' } | null;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CalendarView({ api, user }: CalendarViewProps) {
  const { confirm, showError } = useDialog();
  const location = useLocation();
  const [urlParams, setUrlParams] = useSearchParams();
  const view = urlParams.get('view') === 'list' ? 'list' : 'calendar';
  const [query, setQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<TeamKey | ''>('');
  const [kindFilter, setKindFilter] = useState<ActivityKind | ''>('');
  const [page, setPage] = useState(1);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlDate = searchParams.get('date');

  // Data de hoje em tempo real no fuso de São Paulo
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  }, []);

  const [currentYear, setCurrentYear] = useState(() => {
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
      return parseInt(urlDate.split('-')[0] || String(new Date().getFullYear()), 10);
    }
    return new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
      return parseInt(urlDate.split('-')[1] || '1', 10) - 1;
    }
    return new Date().getMonth();
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) return urlDate;
    return todayStr;
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [records, setRecords] = useState<StoredRecordSummary[]>([]);
  const [tests, setTests] = useState<StoredTestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // Formulário de novo evento ou edição
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    date: todayStr,
    title: '',
    priority: 'COMUM' as 'COMUM' | 'URGENTE',
    period: 'MANHÃ',
    lessonStart: '07:00',
    lessonEnd: '07:50',
    comments: ''
  });

  // Atualiza data selecionada e mes/ano visivel se vier por parametro de URL
  useEffect(() => {
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
      setSelectedDate(urlDate);
      const parts = urlDate.split('-');
      const y = parseInt(parts[0] || String(new Date().getFullYear()), 10);
      const m = parseInt(parts[1] || '1', 10) - 1;
      setCurrentYear(y);
      setCurrentMonth(m);
    }
  }, [urlDate]);

  // Carregar dados de eventos, registros e testes
  const loadAll = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [evts, recs, tsts] = await Promise.allSettled([
        api('/api/eventos'),
        api('/api/registros'),
        api('/api/testes')
      ]);
      if ([evts, recs, tsts].some(result => result.status === 'rejected')) setLoadError('Parte dos lançamentos não pôde ser carregada. Tente atualizar a consulta.');

      if (evts.status === 'fulfilled' && Array.isArray(evts.value)) {
        setEvents(evts.value);
      }
      if (recs.status === 'fulfilled' && Array.isArray(recs.value)) {
        setRecords(recs.value);
      }
      if (tsts.status === 'fulfilled' && Array.isArray(tsts.value)) {
        setTests(tsts.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const matches = useMemo(() => {
    const items: Array<{ kind: ActivityKind; item: ActivitySource }> = [
      ...records.map(item => ({ kind: 'record' as const, item })),
      ...tests.map(item => ({ kind: 'test' as const, item })),
      ...events.map(item => ({ kind: 'event' as const, item }))
    ];
    return findActivities(items, query, teamFilter, kindFilter);
  }, [records, tests, events, query, kindFilter, teamFilter]);
  useEffect(() => { setPage(1); }, [query, kindFilter, teamFilter]);
  const totalPages = Math.max(1, Math.ceil(matches.length / 20));
  const currentPage = Math.min(page, totalPages);
  const changeView = (next: 'calendar' | 'list') => {
    const params = new URLSearchParams(urlParams);
    if (next === 'list') params.set('view', 'list'); else params.delete('view');
    setUrlParams(params, { replace: true });
  };

  // Calendário Matemático rigoroso (dias reais do mês sem erros de dias inexistentes)
  const monthData = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    return { firstDayIndex, daysInMonth };
  }, [currentYear, currentMonth]);

  // Navegacao livre entre todos os meses e anos
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(y => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(y => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Agrupamentos por data YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const d = String(e.date || '').slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(e);
    }
    return map;
  }, [events]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, StoredRecordSummary[]>();
    for (const r of records) {
      const d = String(r.date || '').slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(r);
    }
    return map;
  }, [records]);

  const testsByDate = useMemo(() => {
    const map = new Map<string, StoredTestSummary[]>();
    for (const t of tests) {
      const d = String(t.date || '').slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(t);
    }
    return map;
  }, [tests]);

  // Itens do dia selecionado
  const dayEvents = eventsByDate.get(selectedDate) || [];
  const dayRecords = recordsByDate.get(selectedDate) || [];
  const dayTests = testsByDate.get(selectedDate) || [];

  // Abrir modal para criar evento
  const openCreateModal = () => {
    setEditingEventId(null);
    setNewEvent({
      date: selectedDate,
      title: '',
      priority: 'COMUM',
      period: 'MANHÃ',
      lessonStart: '07:00',
      lessonEnd: '07:50',
      comments: ''
    });
    setShowAddModal(true);
  };

  // Abrir modal para editar evento
  const openEditModal = (ev: CalendarEvent) => {
    setEditingEventId(ev.id);
    // Parse the lesson string back into start/end or use defaults
    const lessonParts = (ev.lesson || '07:00–07:50').split('–');
    setNewEvent({
      date: ev.date || selectedDate,
      title: ev.title || '',
      priority: ev.priority || 'COMUM',
      period: ev.period || 'MANHÃ',
      lessonStart: lessonParts[0] || '07:00',
      lessonEnd: lessonParts[1] || '07:50',
      comments: ev.comments || ''
    });
    setShowAddModal(true);
  };

  // Salvar ou atualizar evento
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    // Business rule: COMUM events are auto-published, URGENTE need management approval
    const lesson = `${newEvent.lessonStart}–${newEvent.lessonEnd}`;
    const payload = {
      ...newEvent,
      lesson,
      status: newEvent.priority === 'URGENTE' ? 'PENDENTE' : 'PUBLICADO'
    };

    setIsSavingEvent(true);
    try {
      if (editingEventId) {
        const updated = await api(`/api/eventos/${editingEventId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setEvents(prev => prev.map(ev => ev.id === editingEventId ? { ...ev, ...updated } : ev));
        setActionMsg('SUCESSO: EVENTO ATUALIZADO COM EXITO NO BANCO DE DADOS!');
      } else {
        const created = await api('/api/eventos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setEvents(prev => [created, ...prev]);
        setActionMsg('SUCESSO: EVENTO AGENDADO COM EXITO NO BANCO DE DADOS!');
      }

      setShowAddModal(false);
      setEditingEventId(null);
      setTimeout(() => setActionMsg(''), 4500);
    } catch (err: any) {
      showError(err.message || 'Erro ao processar evento');
    } finally {
      setIsSavingEvent(false);
    }
  };

  // Excluir evento
  const handleDeleteEvent = async (id: string) => {
    const ok = await confirm('Tem certeza que deseja excluir este evento?');
    if (!ok) return;
    try {
      await api(`/api/eventos/${id}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(ev => ev.id !== id));
      setActionMsg('SUCESSO: EVENTO REMOVIDO DO BANCO DE DADOS!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      showError(err.message || 'Erro ao excluir evento');
    }
  };

  // Excluir registro
  const handleDeleteRecord = async (id: string) => {
    const ok = await confirm('Deseja excluir este registro do diário de bordo?');
    if (!ok) return;
    try {
      await api(`/api/registros/${id}`, { method: 'DELETE' });
      setRecords(prev => prev.filter(r => r.id !== id));
      setActionMsg('SUCESSO: REGISTRO EXCLUIDO DO BANCO DE DADOS!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      showError(err.message || 'Erro ao excluir registro');
    }
  };

  // Excluir teste
  const handleDeleteTest = async (id: string) => {
    const ok = await confirm('Deseja excluir este teste técnico?');
    if (!ok) return;
    try {
      await api(`/api/testes/${id}`, { method: 'DELETE' });
      setTests(prev => prev.filter(t => t.id !== id));
      setActionMsg('SUCESSO: TESTE EXCLUIDO DO BANCO DE DADOS!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      showError(err.message || 'Erro ao excluir teste');
    }
  };

  // Gestão autoriza evento
  const handleConfirmEvent = async (id: string) => {
    try {
      await api(`/api/eventos/${id}/confirmar`, { method: 'PATCH' });
      setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, status: 'CONFIRMADO' } : ev));
      setActionMsg('SUCESSO: EVENTO AUTORIZADO PELA GESTAO!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      showError(err.message || 'Erro ao confirmar evento');
    }
  };

  const renderActivity = (kind: ActivityKind, item: ActivitySource) => {
    const canManageEvent = user && (user.role === 'mentor' || user.role === 'management');
    return <ActivityCard key={`${kind}-${item.id}`} kind={kind} item={item}>
      {kind === 'event' ? <>
        {canManageEvent && <>
          <button type="button" className="btn-action-edit" onClick={() => openEditModal(item as CalendarEvent)}><Edit3 size={15} /> Editar</button>
          <button type="button" className="btn-action-delete" onClick={() => handleDeleteEvent(item.id)}><Trash2 size={15} /> Excluir</button>
        </>}
        {user?.role === 'management' && item.priority === 'URGENTE' && item.status === 'PENDENTE' && <button type="button" className="cal-auth-btn" onClick={() => handleConfirmEvent(item.id)}>Autorizar evento</button>}
      </> : user && <>
        {kind === 'test' && <Link className="btn-action-edit" to={`/${notebookRoute(item)}/testes/editar/${item.id}`}><Edit3 size={15} /> Editar</Link>}
        <button type="button" className="btn-action-delete" onClick={() => kind === 'record' ? handleDeleteRecord(item.id) : handleDeleteTest(item.id)}><Trash2 size={15} /> Excluir</button>
      </>}
    </ActivityCard>;
  };

  return (
    <main
      className="calendar-page-pro page-transition"
    >
      <div className="cal-header-bar">
        <Link to="/" className="back-home-button">
          <HomeIcon size={18} /> Início
        </Link>
        <div className="cal-title-section">
          <span className="cal-badge-pill">DIÁRIO & CRONOGRAMA OFICIAL</span>
          <h1>Calendário de Atividades</h1>
          <p className="cal-subtitle">
            Outubro, Novembro e Dezembro de {currentYear} &bull; Hoje é <strong>{todayStr}</strong>
          </p>
        </div>
        {user && (user.role === 'mentor' || user.role === 'management') && (
          <button className="cal-primary-btn" onClick={openCreateModal}>
            Lançar Evento
          </button>
        )}
      </div>

      {actionMsg && (
        <div className="celebration-banner" style={{ margin: '1rem auto', maxWidth: '800px' }}>
          <CheckCircle2 size={20} />
          <span>{actionMsg}</span>
        </div>
      )}

      <nav className="calendar-view-switch" aria-label="Visualização das atividades">
        <button type="button" aria-pressed={view === 'calendar'} aria-controls="calendar-panel" onClick={() => changeView('calendar')}><CalendarDays size={20} /> Calendário</button>
        <button type="button" aria-pressed={view === 'list'} aria-controls="activity-search-panel" onClick={() => changeView('list')}><Search size={20} /> Pesquisa geral</button>
      </nav>
      {loadError && <div className="activity-load-error" role="alert"><p>{loadError}</p><button type="button" disabled={loading} onClick={() => void loadAll()}>Tentar novamente</button></div>}
      {loading && <p className="activity-loading" role="status">Carregando atividades…</p>}

      {view === 'calendar' && <div className="cal-main-grid" id="calendar-panel">
        {/* Lado Esquerdo: Calendário Estilo Bloco Técnico */}
        <section className="cal-desk-card">
          <div className="cal-desk-rings" aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          <div className="cal-desk-header">
            <button
              className="cal-nav-btn"
              onClick={handlePrevMonth}
              disabled={currentMonth <= 9}
              title="Mês anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="cal-month-indicator">
              <h2>{MONTH_NAMES[currentMonth]} {currentYear}</h2>
              <small>Hortobots Robotics Planning</small>
            </div>
            <button
              className="cal-nav-btn"
              onClick={handleNextMonth}
              disabled={currentMonth >= 11}
              title="Próximo mês"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Grade de dias da semana */}
          <div className="cal-weekdays-row">
            {WEEK_DAYS.map((wd, i) => (
              <span key={wd} className={`cal-weekday-label ${i === 0 || i === 6 ? 'weekend' : ''}`}>
                {wd}
              </span>
            ))}
          </div>

          {/* Grade Numérica dos Dias */}
          <div className="cal-days-grid">
            {/* Dias vazios antes do dia 1 */}
            {Array.from({ length: monthData.firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="cal-day-cell empty" />
            ))}

            {/* Dias reais do mês */}
            {Array.from({ length: monthData.daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              const dayEvts = eventsByDate.get(dateStr) || [];
              const dayRecs = recordsByDate.get(dateStr) || [];
              const dayTsts = testsByDate.get(dateStr) || [];

              const hasUrgente = dayEvts.some(e => e.priority === 'URGENTE');
              const hasPendente = dayEvts.some(e => e.status === 'PENDENTE');
              const hasConfirmado = dayEvts.some(e => e.status === 'CONFIRMADO' || e.status === 'PUBLICADO');

              return (
                <button
                  key={dateStr}
                  type="button"
                  className={`cal-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                  aria-pressed={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={`${dayNum} de ${MONTH_NAMES[currentMonth]} de ${currentYear}, ${dayEvts.length} eventos, ${dayRecs.length} registros, ${dayTsts.length} testes${hasUrgente ? ', evento urgente' : ''}`}
                  title={`${dayNum} de ${MONTH_NAMES[currentMonth]}`}
                >
                  <span className="cal-day-number">{dayNum}</span>

                  {/* Indicadores Visuais de Atividade */}
                  <div className="cal-dots-row">
                    {hasUrgente && <span className="dot dot-urgent" title="Evento Urgente" />}
                    {hasPendente && !hasUrgente && <span className="dot dot-pending" title="Pendente Gestão" />}
                    {hasConfirmado && !hasUrgente && <span className="dot dot-confirmed" title="Confirmado" />}
                    {dayRecs.length > 0 && <span className="dot dot-record" title="Registros de Diário" />}
                    {dayTsts.length > 0 && <span className="dot dot-test" title="Testes Realizados" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="cal-legend-bar">
            <span><i className="dot dot-urgent" /> Urgente</span>
            <span><i className="dot dot-confirmed" /> Evento</span>
            <span><i className="dot dot-record" /> Diário de Bordo</span>
            <span><i className="dot dot-test" /> Teste de Robô</span>
          </div>
        </section>

        {/* Lado Direito: Painel Detalhado do Dia Selecionado */}
        <section className="cal-day-details-card">
          <header className="cal-details-header">
            <div>
              <span className="paper-label" style={{ textShadow: 'none' }}>DETALHES DO DIA</span>
              <h2>
                {selectedDate.slice(8)} de {MONTH_NAMES[parseInt(selectedDate.slice(5, 7), 10) - 1]} de {selectedDate.slice(0, 4)}
              </h2>
            </div>
            {selectedDate === todayStr && (
              <span className="today-badge">HOJE</span>
            )}
          </header>

          <div className="cal-details-scroll">
            <div className="cal-section-group">
              <h3><CalendarDays size={18} /> Eventos e pautas ({dayEvents.length})</h3>
              {dayEvents.length ? <div className="cal-items-list">{dayEvents.map(item => renderActivity('event', item))}</div> : <p className="cal-empty-text">Nenhum evento nesta data.</p>}
            </div>
            <div className="cal-section-group">
              <h3><List size={18} /> Diário de bordo ({dayRecords.length})</h3>
              {dayRecords.length ? <div className="cal-items-list">{dayRecords.map(item => renderActivity('record', item))}</div> : <p className="cal-empty-text">Nenhum registro nesta data.</p>}
            </div>
            <div className="cal-section-group">
              <h3><ChartNoAxesCombined size={18} /> Testes ({dayTests.length})</h3>
              {dayTests.length ? <div className="cal-items-list">{dayTests.map(item => renderActivity('test', item))}</div> : <p className="cal-empty-text">Nenhum teste nesta data.</p>}
            </div>
          </div>
        </section>
      </div>}

      {view === 'list' && <section id="activity-search-panel" className="activity-search-panel" aria-label="Pesquisa geral de atividades">
        <header className="activity-search-heading">
          <div><span className="paper-label">ACERVO DAS EQUIPES</span><h2>Registros, testes e eventos</h2></div>
          <p>Registros, testes e eventos reunidos, do mais recente para o mais antigo.</p>
        </header>
        <div className="activity-filters">
          <label className="activity-query">Palavras-chave
            <span><Search size={20} aria-hidden="true" /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Título, conteúdo ou tags" /></span>
          </label>
          <label>Time
            <select aria-label="Time" value={teamFilter} onChange={e => setTeamFilter(e.target.value as TeamKey | '')}>
              <option value="">Todos os times</option>
              {Object.entries(TEAMS).map(([key, team]) => <option key={key} value={key}>{team.label}</option>)}
            </select>
          </label>
          <label>Tipo
            <select aria-label="Tipo" value={kindFilter} onChange={e => setKindFilter(e.target.value as ActivityKind | '')}>
              <option value="">Todos os tipos</option><option value="record">Registro</option><option value="test">Teste</option><option value="event">Evento</option>
            </select>
          </label>
        </div>
        <div className="activity-results-meta">
          <p role="status">{loading ? 'Consultando acervo…' : `${matches.length} ${matches.length === 1 ? 'lançamento encontrado' : 'lançamentos encontrados'}`}</p>
          {(query || teamFilter || kindFilter) && <button type="button" onClick={() => { setQuery(''); setTeamFilter(''); setKindFilter(''); }}>Limpar filtros</button>}
        </div>
        {!loading && !matches.length && <div className="activity-empty"><Search size={32} /><h3>Nenhum lançamento encontrado</h3><p>Tente outra palavra ou remova um filtro para ampliar a busca.</p></div>}
        <div className="activity-results">
          {matches.slice((currentPage - 1) * 20, currentPage * 20).map(({ kind, item }) => renderActivity(kind, item))}
        </div>
        {totalPages > 1 && <nav className="activity-pagination" aria-label="Páginas de resultados">
          <button type="button" disabled={currentPage === 1} onClick={() => { setPage(currentPage - 1); document.getElementById('activity-search-panel')?.scrollIntoView({ block: 'start' }); }}><ChevronLeft size={18} /> Anterior</button>
          <span>Página {currentPage} de {totalPages}</span>
          <button type="button" disabled={currentPage === totalPages} onClick={() => { setPage(currentPage + 1); document.getElementById('activity-search-panel')?.scrollIntoView({ block: 'start' }); }}>Próxima <ChevronRight size={18} /></button>
        </nav>}
        <p className="activity-footnote">Eventos sem equipe específica aparecem como Agenda geral, na opção Todos os times.</p>
      </section>}

      {/* Modal de Criação / Edição de Evento */}
      {showAddModal && (
        <div className="dialog-layer" onClick={() => !isSavingEvent && setShowAddModal(false)}>
          <div className="cal-modal-card" onClick={e => e.stopPropagation()}>
            <span className="paper-label">COORDENAÇÃO DE CRONOGRAMA</span>
            <h2>{editingEventId ? 'Editar Evento' : 'Lançar Evento'}</h2>
            <p className="cal-modal-desc">
              Eventos urgentes ou lançados por mentoria exigem autorização da Gestão.
            </p>
            <form onSubmit={handleSaveEvent}>
              <label>
                Data do Acontecimento
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
              </label>

              <label>
                Título do Evento
                <input
                  type="text"
                  placeholder="Ex: Treino Geral FLL / Avaliação de Design"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                />
              </label>

              <div className="two-cols">
                <label>
                  Classificação
                  <select
                    value={newEvent.priority}
                    onChange={e => setNewEvent({ ...newEvent, priority: e.target.value as any })}
                  >
                    <option value="COMUM">COMUM</option>
                    <option value="URGENTE">URGENTE (Requer Gestão)</option>
                  </select>
                </label>

                <label>
                  Período
                  <select
                    value={newEvent.period}
                    onChange={e => setNewEvent({ ...newEvent, period: e.target.value })}
                  >
                    <option value="MANHÃ">MANHÃ</option>
                    <option value="TARDE">TARDE</option>
                    <option value="INTEGRAL">INTEGRAL</option>
                  </select>
                </label>
              </div>

              <div className="two-cols">
                <label>
                  Horário Inicial
                  <select
                    value={newEvent.lessonStart}
                    onChange={e => setNewEvent({ ...newEvent, lessonStart: e.target.value })}
                  >
                    {[
                      '07:00', '07:50', '08:40', '09:30',
                      '09:50', '10:40', '11:30',
                      '12:00', '12:40', '13:30', '14:20',
                      '15:10', '15:30', '16:20', '17:10', '18:00'
                    ].map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Horário Final
                  <select
                    value={newEvent.lessonEnd}
                    onChange={e => setNewEvent({ ...newEvent, lessonEnd: e.target.value })}
                  >
                    {[
                      '07:50', '08:40', '09:30',
                      '09:50', '10:40', '11:30', '12:20',
                      '12:40', '13:30', '14:20', '15:10',
                      '15:30', '16:20', '17:10', '18:00'
                    ].map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Observações Adicionais
                <AutoArea
                  rows={3}
                  value={newEvent.comments}
                  onChange={e => setNewEvent({ ...newEvent, comments: e.target.value })}
                  placeholder="Detalhes de materiais, participantes ou pautas..."
                />
              </label>

              <div className="cal-modal-actions">
                <button
                  type="button"
                  className="cal-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSavingEvent}
                >
                  Cancelar
                </button>
                {isSavingEvent ? (
                  <div className="saving-cloud-card" style={{ padding: '0.65rem 1.2rem', minWidth: '70px', width: 'auto' }} aria-label="Carregando">
                    <div className="saving-spinner" />
                  </div>
                ) : (
                  <button type="submit" className="cal-primary-btn">
                    {editingEventId ? 'Salvar Alterações' : 'Confirmar e Salvar'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
