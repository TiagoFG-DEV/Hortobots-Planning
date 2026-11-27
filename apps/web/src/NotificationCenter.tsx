import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  CalendarDays,
  CheckCheck,
  FileText,
  FlaskConical,
  Leaf,
  MessageSquare,
  RefreshCw,
  Trash2,
  X
} from 'lucide-react';
import {
  clearNotificationHistory,
  ensureNotificationPermission,
  getNotificationHistory,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_EVENT,
  TOAST_EVENT,
  type AppNotificationItem,
  type NotificationCategory
} from './appNotifications';
import { runFullOfflineSync } from './offlineSync';

const CATEGORY_META: Record<NotificationCategory, { label: string; color: string }> = {
  registro: { label: 'Registro', color: '#62b300' },
  teste: { label: 'Teste', color: '#16a34a' },
  evento: { label: 'Evento', color: '#f6b922' },
  comentario: { label: 'Comentário', color: '#38bdf8' },
  documento: { label: 'Regra / Doc', color: '#f97316' },
  bioglow: { label: 'BIOGLOW', color: '#4ade80' }
};

function CategoryIcon({ category }: { category: NotificationCategory }) {
  switch (category) {
    case 'evento':
      return <CalendarDays size={16} />;
    case 'teste':
      return <FlaskConical size={16} />;
    case 'comentario':
      return <MessageSquare size={16} />;
    case 'documento':
      return <FileText size={16} />;
    case 'bioglow':
      return <Leaf size={16} />;
    default:
      return <BellRing size={16} />;
  }
}

function formatRelative(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diffMs / 60_000);
    if (min < 1) return 'agora';
    if (min < 60) return `${min}m`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  } catch {
    return '';
  }
}

export function NotificationCenter({ hasLogoutButton }: { hasLogoutButton: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotificationItem[]>(() => getNotificationHistory());
  const [toast, setToast] = useState<AppNotificationItem | null>(null);
  const [checking, setChecking] = useState(false);
  const [permGranted, setPermGranted] = useState<boolean>(() => {
    if (typeof Notification !== 'undefined') return Notification.permission === 'granted';
    return false;
  });

  useEffect(() => {
    const syncList = () => setItems(getNotificationHistory());
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<AppNotificationItem>).detail;
      if (detail) {
        setToast(detail);
      }
    };
    window.addEventListener(NOTIFICATIONS_EVENT, syncList);
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, syncList);
      window.removeEventListener(TOAST_EVENT, onToast);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const unreadCount = items.filter(i => !i.read).length;

  const handleOpenItem = (item: AppNotificationItem) => {
    markNotificationRead(item.id);
    setOpen(false);
    setToast(null);
    if (item.route) navigate(item.route);
  };

  const handleEnablePerm = async () => {
    const ok = await ensureNotificationPermission();
    setPermGranted(ok);
  };

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      await runFullOfflineSync(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`hb-notif-trigger ${hasLogoutButton ? 'with-logout' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        title="Central de Notificações"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="hb-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {toast && !open && (
        <button
          type="button"
          className="hb-notif-toast"
          onClick={() => handleOpenItem(toast)}
          role="status"
          aria-live="polite"
        >
          <span
            className="hb-notif-toast-icon"
            style={{ background: CATEGORY_META[toast.category]?.color || '#62b300' }}
          >
            <CategoryIcon category={toast.category} />
          </span>
          <span className="hb-notif-toast-text">
            <strong>{toast.title}</strong>
            <small>{toast.body}</small>
          </span>
        </button>
      )}

      {open && (
        <div className="hb-notif-backdrop" onClick={() => setOpen(false)}>
          <aside
            className="hb-notif-panel"
            onClick={e => e.stopPropagation()}
            aria-label="Central de Notificações"
          >
            <header className="hb-notif-header">
              <div className="hb-notif-title-wrap">
                <Bell size={18} />
                <strong>Notificações</strong>
                {unreadCount > 0 && <span className="hb-notif-pill">{unreadCount}</span>}
              </div>
              <div className="hb-notif-head-actions">
                <button
                  type="button"
                  className="hb-notif-icon-btn"
                  onClick={handleCheckNow}
                  disabled={checking}
                  title="Verificar atualizações agora"
                  aria-label="Verificar atualizações agora"
                >
                  <RefreshCw size={15} className={checking ? 'spin' : ''} />
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="hb-notif-icon-btn"
                    onClick={markAllNotificationsRead}
                    title="Marcar todas como lidas"
                    aria-label="Marcar todas como lidas"
                  >
                    <CheckCheck size={15} />
                  </button>
                )}
                {items.length > 0 && (
                  <button
                    type="button"
                    className="hb-notif-icon-btn"
                    onClick={clearNotificationHistory}
                    title="Limpar histórico"
                    aria-label="Limpar histórico"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  type="button"
                  className="hb-notif-icon-btn"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar notificações"
                >
                  <X size={17} />
                </button>
              </div>
            </header>

            {!permGranted && (
              <div className="hb-notif-perm-bar">
                <span>Receba alertas de novos registros, testes, eventos, regras e pesquisas BIOGLOW.</span>
                <button type="button" onClick={handleEnablePerm}>
                  Ativar alertas
                </button>
              </div>
            )}

            <div className="hb-notif-list">
              {items.length === 0 ? (
                <div className="hb-notif-empty">
                  <Bell size={28} />
                  <strong>Tudo em dia!</strong>
                  <p>
                    Novos registros, testes, eventos, comentários, documentos oficiais e pesquisas de biologia
                    aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : (
                items.map(item => {
                  const meta = CATEGORY_META[item.category] || CATEGORY_META.registro;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`hb-notif-item ${item.read ? 'read' : 'unread'}`}
                      onClick={() => handleOpenItem(item)}
                    >
                      <span className="hb-notif-item-dot" style={{ background: meta.color }}>
                        <CategoryIcon category={item.category} />
                      </span>
                      <div className="hb-notif-item-body">
                        <div className="hb-notif-item-top">
                          <span className="hb-notif-cat" style={{ color: meta.color }}>
                            {meta.label}
                          </span>
                          <small>{formatRelative(item.createdAt)}</small>
                        </div>
                        <strong>{item.title}</strong>
                        <p>{item.body}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
