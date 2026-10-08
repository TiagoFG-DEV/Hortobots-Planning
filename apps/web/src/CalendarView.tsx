import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Home as HomeIcon, ChevronLeft, ChevronRight, CheckCircle2, Clock, CalendarDays, List, ChartNoAxesCombined } from 'lucide-react';

interface CalendarEvent {
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

interface StoredRecordSummary {
  id: string;
  modality: 'FLL' | 'OBR';
  date: string;
  title: string;
  summary: string;
  tags?: string[];
}

interface StoredTestSummary {
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
  // Data de hoje em tempo real no fuso de São Paulo
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  }, []);

  const [currentYear, setCurrentYear] = useState(2026);
  // O usuário solicitou contemplar Outubro, Novembro e Dezembro (meses 9, 10, 11 em base 0)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const todayMonth = new Date().getMonth();
    return todayMonth >= 9 && todayMonth <= 11 ? todayMonth : 9; // padrão: Outubro
  });

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [records, setRecords] = useState<StoredRecordSummary[]>([]);
  const [tests, setTests] = useState<StoredTestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Formulário de novo evento
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    date: todayStr,
    title: '',
    priority: 'COMUM' as 'COMUM' | 'URGENTE',
    period: 'MANHÃ',
    lesson: '07:00–07:50',
    comments: ''
  });

  // Carregar dados de eventos, registros e testes
  const loadAll = async () => {
    setLoading(true);
    try {
      const [evts, recs, tsts] = await Promise.allSettled([
        api('/api/eventos'),
        api('/api/registros'),
        api('/api/testes')
      ]);

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

  // Calendário Matemático rigoroso (dias reais do mês sem erros de dias inexistentes)
  const monthData = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    return { firstDayIndex, daysInMonth };
  }, [currentYear, currentMonth]);

  // Navegação restrita entre Outubro, Novembro e Dezembro (ou livre para 2026)
  const handlePrevMonth = () => {
    if (currentMonth > 9) {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth < 11) {
      setCurrentMonth(currentMonth + 1);
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

  // Salvar novo evento
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;
    try {
      const created = await api('/api/eventos', {
        method: 'POST',
        body: JSON.stringify(newEvent)
      });
      setEvents(prev => [created, ...prev]);
      setShowAddModal(false);
      setNewEvent({
        date: selectedDate,
        title: '',
        priority: 'COMUM',
        period: 'MANHÃ',
        lesson: '07:00–07:50',
        comments: ''
      });
      setActionMsg('Evento enviado com sucesso!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar evento');
    }
  };

  // Gestão autoriza evento
  const handleConfirmEvent = async (id: string) => {
    try {
      const updated = await api(`/api/eventos/${id}/confirmar`, { method: 'PATCH' });
      setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, status: 'CONFIRMADO' } : ev));
      setActionMsg('Evento autorizado pela Gestão!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar evento');
    }
  };

  return (
    <main className="calendar-page-pro page-transition">
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
          <button
            className="cal-primary-btn"
            onClick={() => {
              setNewEvent(prev => ({ ...prev, date: selectedDate }));
              setShowAddModal(true);
            }}
          >
            Lançar Evento
          </button>
        )}
      </div>

      {actionMsg && <div className="cal-alert-banner">{actionMsg}</div>}

      <div className="cal-main-grid">
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
              <ChevronLeft size={22} />
            </button>
            <div className="cal-month-title">
              <h2>{MONTH_NAMES[currentMonth]?.toUpperCase()} {currentYear}</h2>
              <small>Equipes FLL & OBR &bull; SESI 437</small>
            </div>
            <button
              className="cal-nav-btn"
              onClick={handleNextMonth}
              disabled={currentMonth >= 11}
              title="Próximo mês"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Abas rápidas para os meses solicitados */}
          <div className="cal-month-tabs">
            {[9, 10, 11].map(m => (
              <button
                key={m}
                className={`cal-tab-btn ${currentMonth === m ? 'active' : ''}`}
                onClick={() => setCurrentMonth(m)}
              >
                {MONTH_NAMES[m]}
              </button>
            ))}
          </div>

          <div className="cal-week-labels">
            {WEEK_DAYS.map(day => (
              <span key={day} className="cal-day-label">{day}</span>
            ))}
          </div>

          <div className="cal-days-grid">
            {/* Espaços vazios antes do 1º dia */}
            {Array.from({ length: monthData.firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="cal-cell empty" />
            ))}

            {/* Dias reais do mês */}
            {Array.from({ length: monthData.daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateString === todayStr;
              const isSelected = dateString === selectedDate;
              const evList = eventsByDate.get(dateString) || [];
              const recList = recordsByDate.get(dateString) || [];
              const tstList = testsByDate.get(dateString) || [];

              const hasUrgente = evList.some(e => e.priority === 'URGENTE');
              const hasEvents = evList.length > 0;
              const hasRecords = recList.length > 0;
              const hasTests = tstList.length > 0;

              return (
                <button
                  key={dateString}
                  type="button"
                  className={`cal-cell day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => setSelectedDate(dateString)}
                >
                  <span className="cal-cell-num">{dayNum}</span>
                  {isToday && <span className="cal-today-tag">HOJE</span>}

                  {/* Indicadores visuais do dia */}
                  <div className="cal-cell-dots">
                    {hasRecords && <span className="dot dot-record" title={`${recList.length} registros`} />}
                    {hasTests && <span className="dot dot-test" title={`${tstList.length} testes`} />}
                    {hasEvents && (
                      <span
                        className={`dot ${hasUrgente ? 'dot-urgent' : 'dot-event'}`}
                        title={`${evList.length} eventos`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="cal-legend">
            <span><i className="dot dot-record" /> Registros</span>
            <span><i className="dot dot-test" /> Testes</span>
            <span><i className="dot dot-event" /> Eventos</span>
            <span><i className="dot dot-urgent" /> Evento Urgente</span>
          </div>
        </section>

        {/* Lado Direito: Painel Detalhado do Dia Selecionado */}
        <section className="cal-day-panel">
          <div className="cal-day-header">
            <span className="paper-label">DETALHES DO DIA</span>
            <h2>{selectedDate}</h2>
            {selectedDate === todayStr && <span className="today-badge">DATA ATUAL (EM TEMPO REAL)</span>}
          </div>

          <div className="cal-day-content">
            {/* Seção 1: Eventos do Dia */}
            <div className="cal-section-group">
              <h3>
                <CalendarDays size={18} /> Eventos & Pautas ({dayEvents.length})
              </h3>
              {dayEvents.length === 0 ? (
                <p className="cal-empty-text">Nenhum evento agendado para esta data.</p>
              ) : (
                <div className="cal-items-list">
                  {dayEvents.map(ev => {
                    const isPending = ev.status === 'PENDENTE';
                    const canAuthorize = user && user.role === 'management' && isPending;

                    return (
                      <div
                        key={ev.id}
                        className={`cal-event-item ${ev.priority === 'URGENTE' ? 'urgent' : ''}`}
                      >
                        <div className="cal-event-info">
                          <div className="cal-event-title-row">
                            <strong>{ev.title}</strong>
                            <span className={`status-pill ${ev.status.toLowerCase()}`}>
                              {ev.status === 'CONFIRMADO' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              {ev.status}
                            </span>
                          </div>
                          <span className="cal-event-meta">
                            {ev.period} &bull; Aula: {ev.lesson} &bull; Prioridade: {ev.priority}
                          </span>
                          {ev.comments && <p className="cal-event-desc">{ev.comments}</p>}
                        </div>

                        {canAuthorize && (
                          <button
                            type="button"
                            className="cal-auth-btn"
                            onClick={() => handleConfirmEvent(ev.id)}
                            title="Autorizar este evento como Gestão"
                          >
                            Autorizar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seção 2: Registros de Diário de Bordo no Dia */}
            <div className="cal-section-group">
              <h3>
                <List size={18} /> Diário de Bordo ({dayRecords.length})
              </h3>
              {dayRecords.length === 0 ? (
                <p className="cal-empty-text">Nenhum registro gravado nesta data.</p>
              ) : (
                <div className="cal-items-list">
                  {dayRecords.map(rec => (
                    <Link
                      key={rec.id}
                      to={`/${rec.modality.toLowerCase()}/registros`}
                      className="cal-record-link"
                    >
                      <span className={`mod-pill ${rec.modality.toLowerCase()}`}>
                        {rec.modality}
                      </span>
                      <div>
                        <strong>{rec.title}</strong>
                        <p>{rec.summary}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Seção 3: Testes e Simulações no Dia */}
            <div className="cal-section-group">
              <h3>
                <ChartNoAxesCombined size={18} /> Testes Realizados ({dayTests.length})
              </h3>
              {dayTests.length === 0 ? (
                <p className="cal-empty-text">Nenhum teste de robô gravado nesta data.</p>
              ) : (
                <div className="cal-items-list">
                  {dayTests.map(tst => (
                    <div key={tst.id} className="cal-test-item">
                      <span className="mod-pill neutral">{tst.modality || 'ROBÔ'}</span>
                      <div>
                        <strong>{tst.title}</strong>
                        <p>{tst.objective}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Modal de Criação de Evento */}
      {showAddModal && (
        <div className="dialog-layer" onClick={() => setShowAddModal(false)}>
          <div className="cal-modal-card" onClick={e => e.stopPropagation()}>
            <span className="paper-label">COORDENAÇÃO DE CRONOGRAMA</span>
            <h2>Lançar Evento</h2>
            <p className="cal-modal-desc">
              Eventos urgentes ou lançados por mentoria exigem autorização da Gestão.
            </p>
            <form onSubmit={handleCreateEvent}>
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

              <label>
                Horário / Aula
                <select
                  value={newEvent.lesson}
                  onChange={e => setNewEvent({ ...newEvent, lesson: e.target.value })}
                >
                  {[
                    '07:00–07:50', '07:50–08:40', '08:40–09:30',
                    '09:50–10:40', '10:40–11:30', '11:30–12:20',
                    '12:40–13:30', '13:30–14:20', '14:20–15:10',
                    '15:30–16:20', '16:20–17:10', '17:10–18:00'
                  ].map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </label>

              <label>
                Observações Adicionais
                <textarea
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
                >
                  Cancelar
                </button>
                <button type="submit" className="cal-primary-btn">
                  Confirmar e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
