import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  CalendarDays,
  List,
  ChartNoAxesCombined,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import underBg from './assets/originals/fundo_underconstruction.png';

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
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlDate = searchParams.get('date');

  // Data de hoje em tempo real no fuso de São Paulo
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  }, []);

  const [currentYear, setCurrentYear] = useState(2026);
  // O usuário solicitou contemplar Outubro, Novembro e Dezembro (meses 9, 10, 11 em base 0)
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
      const parts = urlDate.split('-');
      const m = parseInt(parts[1] || '1', 10) - 1;
      if (m >= 9 && m <= 11) return m;
    }
    const todayMonth = new Date().getMonth();
    return todayMonth >= 9 && todayMonth <= 11 ? todayMonth : 9; // padrão: Outubro
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) return urlDate;
    return todayStr;
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [records, setRecords] = useState<StoredRecordSummary[]>([]);
  const [tests, setTests] = useState<StoredTestSummary[]>([]);
  const [loading, setLoading] = useState(true);
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
    lesson: '07:00–07:50',
    comments: ''
  });

  // Atualiza data selecionada se vier por parâmetro de URL
  useEffect(() => {
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
      setSelectedDate(urlDate);
      const parts = urlDate.split('-');
      const m = parseInt(parts[1] || '1', 10) - 1;
      if (m >= 9 && m <= 11) {
        setCurrentMonth(m);
      }
    }
  }, [urlDate]);

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

  // Navegação restrita entre Outubro, Novembro e Dezembro
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

  // Abrir modal para criar evento
  const openCreateModal = () => {
    setEditingEventId(null);
    setNewEvent({
      date: selectedDate,
      title: '',
      priority: 'COMUM',
      period: 'MANHÃ',
      lesson: '07:00–07:50',
      comments: ''
    });
    setShowAddModal(true);
  };

  // Abrir modal para editar evento
  const openEditModal = (ev: CalendarEvent) => {
    setEditingEventId(ev.id);
    setNewEvent({
      date: ev.date || selectedDate,
      title: ev.title || '',
      priority: ev.priority || 'COMUM',
      period: ev.period || 'MANHÃ',
      lesson: ev.lesson || '07:00–07:50',
      comments: ev.comments || ''
    });
    setShowAddModal(true);
  };

  // Salvar ou atualizar evento
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    setIsSavingEvent(true);
    try {
      if (editingEventId) {
        const updated = await api(`/api/eventos/${editingEventId}`, {
          method: 'PUT',
          body: JSON.stringify(newEvent)
        });
        setEvents(prev => prev.map(ev => ev.id === editingEventId ? { ...ev, ...updated } : ev));
        setActionMsg('SUCESSO: EVENTO ATUALIZADO COM EXITO NO BANCO DE DADOS!');
      } else {
        const created = await api('/api/eventos', {
          method: 'POST',
          body: JSON.stringify(newEvent)
        });
        setEvents(prev => [created, ...prev]);
        setActionMsg('SUCESSO: EVENTO AGENDADO COM EXITO NO BANCO DE DADOS!');
      }

      setShowAddModal(false);
      setEditingEventId(null);
      setTimeout(() => setActionMsg(''), 4500);
    } catch (err: any) {
      alert(err.message || 'Erro ao processar evento');
    } finally {
      setIsSavingEvent(false);
    }
  };

  // Excluir evento
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
      await api(`/api/eventos/${id}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(ev => ev.id !== id));
      setActionMsg('SUCESSO: EVENTO REMOVIDO DO BANCO DE DADOS!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir evento');
    }
  };

  // Excluir registro
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Deseja excluir este registro do diário de bordo?')) return;
    try {
      await api(`/api/registros/${id}`, { method: 'DELETE' });
      setRecords(prev => prev.filter(r => r.id !== id));
      setActionMsg('SUCESSO: REGISTRO EXCLUIDO DO BANCO DE DADOS!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir registro');
    }
  };

  // Excluir teste
  const handleDeleteTest = async (id: string) => {
    if (!window.confirm('Deseja excluir este teste técnico?')) return;
    try {
      await api(`/api/testes/${id}`, { method: 'DELETE' });
      setTests(prev => prev.filter(t => t.id !== id));
      setActionMsg('SUCESSO: TESTE EXCLUIDO DO BANCO DE DADOS!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir teste');
    }
  };

  // Gestão autoriza evento
  const handleConfirmEvent = async (id: string) => {
    try {
      const updated = await api(`/api/eventos/${id}/confirmar`, { method: 'PATCH' });
      setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, status: 'CONFIRMADO' } : ev));
      setActionMsg('SUCESSO: EVENTO AUTORIZADO PELA GESTAO!');
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar evento');
    }
  };

  return (
    <main
      className="calendar-page-pro page-transition"
      style={{
        backgroundImage: `linear-gradient(rgba(8, 12, 8, 0.55), rgba(6, 10, 6, 0.65)), url(${underBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
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
                    const canManage = user && (user.role === 'mentor' || user.role === 'management');

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

                          {canManage && (
                            <div className="item-actions-row">
                              <button
                                type="button"
                                className="btn-action-edit"
                                onClick={() => openEditModal(ev)}
                              >
                                <Edit3 size={13} /> Editar
                              </button>
                              <button
                                type="button"
                                className="btn-action-delete"
                                onClick={() => handleDeleteEvent(ev.id)}
                              >
                                <Trash2 size={13} /> Excluir
                              </button>
                            </div>
                          )}
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
                    <div key={rec.id} className="cal-record-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Link
                        to={`/${rec.modality.toLowerCase()}/registro/${rec.id}`}
                        className="cal-record-link"
                        style={{ flex: 1 }}
                      >
                        <span className={`mod-pill ${rec.modality.toLowerCase()}`}>
                          {rec.modality}
                        </span>
                        <div>
                          <strong>{rec.title}</strong>
                          <p>{rec.summary}</p>
                        </div>
                      </Link>
                      {user && (
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => handleDeleteRecord(rec.id)}
                          title="Excluir Registro"
                          style={{ padding: '0.5rem 0.6rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
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
                    <div key={tst.id} className="cal-test-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <span className="mod-pill neutral">{tst.modality || 'ROBÔ'}</span>
                        <div>
                          <strong>{tst.title}</strong>
                          <p>{tst.objective}</p>
                        </div>
                      </div>
                      {user && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Link
                            to={`/${(tst.modality || 'fll').toLowerCase()}/testes/editar/${tst.id}`}
                            className="btn-action-edit"
                            style={{ padding: '0.45rem 0.65rem' }}
                            title="Editar Teste"
                          >
                            <Edit3 size={13} />
                          </Link>
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => handleDeleteTest(tst.id)}
                            style={{ padding: '0.45rem 0.65rem' }}
                            title="Excluir Teste"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

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
