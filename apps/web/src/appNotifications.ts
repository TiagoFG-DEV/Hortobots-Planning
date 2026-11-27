import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type NotificationCategory =
  | 'registro'
  | 'teste'
  | 'evento'
  | 'comentario'
  | 'documento'
  | 'bioglow';

export interface AppNotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  route: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationBaseline {
  registros: string[];
  testes: string[];
  eventos: string[];
  feedbacks: string[];
  documentos: string[];
  atualizacoes: string[];
  seasonTests: string[];
  seasonSections: string[];
  biologyItems: string[];
}

export interface SyncSnapshots {
  registros?: Array<{ id: string; title?: string; author?: string; tags?: string[]; date?: string }>;
  testes?: Array<{ id: string; title?: string; mission?: string; tags?: string[]; date?: string }>;
  eventos?: Array<{ id: string; title?: string; date?: string; priority?: string }>;
  feedbacks?: Array<{ id: string; author?: string; message?: string; text?: string; targetType?: string; targetId?: string }>;
  documentos?: Array<{ id: string; title?: string; updatedAt?: string }>;
  atualizacoes?: Array<{ id: string; title?: string; summary?: string; category?: string }>;
  seasonProject?: {
    article?: { sections?: Array<{ id: string; title?: string; updatedAt?: string }> };
    tests?: Array<{ id: string; title?: string; date?: string }>;
  };
  biologyFeeds?: Array<{ feed: string; xml: string }>;
}

const BASELINE_KEY = 'hortobots-notif-baseline-v1';
const HISTORY_KEY = 'hortobots-notif-history-v1';
const MAX_HISTORY = 40;
export const NOTIFICATIONS_EVENT = 'hortobots:notifications-changed';
export const TOAST_EVENT = 'hortobots:notification-toast';

function teamRouteFromTags(tags?: string[]): string {
  if (!Array.isArray(tags)) return 'fll';
  const joined = tags.join(' ').toLowerCase();
  if (joined.includes('obr')) return 'obr';
  if (joined.includes('under')) return 'underconstruction';
  return 'fll';
}

export function parseBiologyRssItems(xml: string, feedName: string): Array<{ id: string; title: string; link: string }> {
  if (!xml || typeof xml !== 'string') return [];
  const items: Array<{ id: string; title: string; link: string }> = [];
  const itemMatches = xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi);
  for (const match of itemMatches) {
    const block = match[1] || '';
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const guidMatch = block.match(/<guid[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/i);
    const title = (titleMatch?.[1] || '').replace(/<[^>]+>/g, '').trim();
    const link = (linkMatch?.[1] || '').trim();
    const guid = (guidMatch?.[1] || link || title).trim();
    if (guid && title) {
      items.push({ id: `${feedName}:${guid}`, title, link });
    }
  }
  return items.slice(0, 20);
}

export function detectNewNotifications(
  snapshots: SyncSnapshots,
  prev: NotificationBaseline | null,
  nowIso = new Date().toISOString()
): { notifications: AppNotificationItem[]; nextBaseline: NotificationBaseline } {
  const isFirstRun = prev === null;
  const baseline: NotificationBaseline = prev || {
    registros: [],
    testes: [],
    eventos: [],
    feedbacks: [],
    documentos: [],
    atualizacoes: [],
    seasonTests: [],
    seasonSections: [],
    biologyItems: []
  };

  const notifications: AppNotificationItem[] = [];
  const nextBaseline: NotificationBaseline = { ...baseline };

  const pushNotif = (
    category: NotificationCategory,
    key: string,
    title: string,
    body: string,
    route: string
  ) => {
    notifications.push({
      id: `${category}-${key}-${Date.now().toString(36)}`,
      category,
      title,
      body,
      route,
      createdAt: nowIso,
      read: false
    });
  };

  if (Array.isArray(snapshots.registros)) {
    const prevSet = new Set(baseline.registros);
    const ids = snapshots.registros.map(r => r.id).filter(Boolean);
    if (!isFirstRun) {
      for (const r of snapshots.registros) {
        if (r?.id && !prevSet.has(r.id)) {
          const team = teamRouteFromTags(r.tags);
          pushNotif(
            'registro',
            r.id,
            'Novo registro publicado',
            `${r.title || 'Registro no Diário de Bordo'}${r.author ? ` · por ${r.author}` : ''}`,
            `/${team}/registro/${r.id}`
          );
        }
      }
    }
    nextBaseline.registros = ids;
  }

  if (Array.isArray(snapshots.testes)) {
    const prevSet = new Set(baseline.testes);
    const ids = snapshots.testes.map(t => t.id).filter(Boolean);
    if (!isFirstRun) {
      for (const t of snapshots.testes) {
        if (t?.id && !prevSet.has(t.id)) {
          const team = teamRouteFromTags(t.tags);
          pushNotif(
            'teste',
            t.id,
            'Novo teste de robô registrado',
            `${t.title || t.mission || 'Teste técnico'}${t.date ? ` (${t.date})` : ''}`,
            `/${team}/teste/${t.id}`
          );
        }
      }
    }
    nextBaseline.testes = ids;
  }

  if (Array.isArray(snapshots.eventos)) {
    const prevSet = new Set(baseline.eventos);
    const ids = snapshots.eventos.map(e => e.id).filter(Boolean);
    if (!isFirstRun) {
      for (const ev of snapshots.eventos) {
        if (ev?.id && !prevSet.has(ev.id)) {
          const urgent = ev.priority === 'URGENTE' ? ' [URGENTE]' : '';
          pushNotif(
            'evento',
            ev.id,
            `Novo evento no calendário${urgent}`,
            `${ev.title || 'Evento agendado'}${ev.date ? ` · ${ev.date}` : ''}`,
            ev.date ? `/calendario?date=${encodeURIComponent(ev.date)}` : '/calendario'
          );
        }
      }
    }
    nextBaseline.eventos = ids;
  }

  if (Array.isArray(snapshots.feedbacks)) {
    const prevSet = new Set(baseline.feedbacks);
    const ids = snapshots.feedbacks.map(f => f.id).filter(Boolean);
    if (!isFirstRun) {
      for (const fb of snapshots.feedbacks) {
        if (fb?.id && !prevSet.has(fb.id)) {
          const msg = (fb.message || fb.text || 'Novo comentário na equipe').slice(0, 90);
          pushNotif(
            'comentario',
            fb.id,
            'Novo comentário recebido',
            `${fb.author ? `${fb.author}: ` : ''}${msg}`,
            '/calendario'
          );
        }
      }
    }
    nextBaseline.feedbacks = ids;
  }

  if (Array.isArray(snapshots.documentos)) {
    const prevSet = new Set(baseline.documentos);
    const keys = snapshots.documentos.map(d => `${d.id}:${d.updatedAt || ''}`).filter(Boolean);
    if (!isFirstRun) {
      for (const doc of snapshots.documentos) {
        const key = `${doc.id}:${doc.updatedAt || ''}`;
        if (doc?.id && !prevSet.has(key)) {
          pushNotif(
            'documento',
            doc.id,
            'Documento oficial atualizado',
            doc.title || 'Novo documento ou regra oficial disponível',
            '/documentos'
          );
        }
      }
    }
    nextBaseline.documentos = keys;
  }

  if (Array.isArray(snapshots.atualizacoes)) {
    const prevSet = new Set(baseline.atualizacoes);
    const ids = snapshots.atualizacoes.map(a => a.id).filter(Boolean);
    if (!isFirstRun) {
      for (const upd of snapshots.atualizacoes) {
        if (upd?.id && !prevSet.has(upd.id)) {
          pushNotif(
            'documento',
            upd.id,
            'Atualização oficial de regras',
            upd.title || upd.summary || 'Nova mensagem ou atualização oficial publicada',
            '/documentos/atualizacoes'
          );
        }
      }
    }
    nextBaseline.atualizacoes = ids;
  }

  if (snapshots.seasonProject) {
    const seasonTests = snapshots.seasonProject.tests || [];
    const prevTestSet = new Set(baseline.seasonTests);
    const testIds = seasonTests.map(t => t.id).filter(Boolean);
    if (!isFirstRun) {
      for (const st of seasonTests) {
        if (st?.id && !prevTestSet.has(st.id)) {
          pushNotif(
            'teste',
            `bioglow-${st.id}`,
            'Novo teste do Projeto BIOGLOW',
            `${st.title || 'Sessão de campo The Beezy Box'}${st.date ? ` · ${st.date}` : ''}`,
            '/equipe/sesi-hortobots-fll/projeto'
          );
        }
      }
    }
    nextBaseline.seasonTests = testIds;

    const sections = snapshots.seasonProject.article?.sections || [];
    const prevSecSet = new Set(baseline.seasonSections);
    const secKeys = sections.map(s => `${s.id}:${s.updatedAt || ''}`).filter(Boolean);
    if (!isFirstRun) {
      for (const sec of sections) {
        const key = `${sec.id}:${sec.updatedAt || ''}`;
        if (sec?.id && !prevSecSet.has(key)) {
          pushNotif(
            'bioglow',
            sec.id,
            'Pesquisa BIOGLOW atualizada',
            sec.title || 'Atualização no artigo científico The Beezy Box',
            '/equipe/sesi-hortobots-fll/projeto'
          );
        }
      }
    }
    nextBaseline.seasonSections = secKeys;
  }

  if (Array.isArray(snapshots.biologyFeeds) && snapshots.biologyFeeds.length > 0) {
    const parsedAll = snapshots.biologyFeeds.flatMap(f => parseBiologyRssItems(f.xml, f.feed));
    const prevBioSet = new Set(baseline.biologyItems);
    const bioIds = parsedAll.map(i => i.id);
    if (!isFirstRun) {
      let bioCount = 0;
      for (const item of parsedAll) {
        if (!prevBioSet.has(item.id) && bioCount < 3) {
          bioCount += 1;
          pushNotif(
            'bioglow',
            item.id,
            'Nova pesquisa de biologia no Portal BIOGLOW',
            item.title,
            '/equipe/sesi-hortobots-fll'
          );
        }
      }
    }
    if (bioIds.length > 0) {
      nextBaseline.biologyItems = bioIds;
    }
  }

  return { notifications, nextBaseline };
}

export function getNotificationHistory(): AppNotificationItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotificationHistory(items: AppNotificationItem[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT));
  } catch {}
}

export function markAllNotificationsRead(): void {
  const updated = getNotificationHistory().map(n => ({ ...n, read: true }));
  saveNotificationHistory(updated);
}

export function markNotificationRead(id: string): void {
  const updated = getNotificationHistory().map(n => (n.id === id ? { ...n, read: true } : n));
  saveNotificationHistory(updated);
}

export function clearNotificationHistory(): void {
  saveNotificationHistory([]);
}

function loadBaseline(): NotificationBaseline | null {
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    return raw ? (JSON.parse(raw) as NotificationBaseline) : null;
  } catch {
    return null;
  }
}

function saveBaseline(baseline: NotificationBaseline): void {
  try {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline));
  } catch {}
}

let channelReady = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return false;
      }
      if (!channelReady) {
        await LocalNotifications.createChannel({
          id: 'hortobots-updates',
          name: 'Atualizações Hortobots',
          description: 'Novos registros, testes, eventos, regras e pesquisas BIOGLOW',
          importance: 4,
          visibility: 1,
          vibration: true
        });
        channelReady = true;
      }
      return true;
    }

    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'default') {
        const res = await Notification.requestPermission();
        return res === 'granted';
      }
    }
  } catch {}
  return false;
}

async function dispatchSystemNotifications(items: AppNotificationItem[]): Promise<void> {
  if (items.length === 0) return;

  // Limita disparo simultâneo para evitar excesso de alertas
  const batch = items.slice(0, 5);

  // Toast in-app imediato para a última notificação
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: batch[0] }));

  try {
    if (Capacitor.isNativePlatform()) {
      const allowed = await ensureNotificationPermission();
      if (!allowed) return;
      await LocalNotifications.schedule({
        notifications: batch.map((item, idx) => ({
          id: Math.floor((Date.now() % 1_000_000) + idx + 1),
          title: item.title,
          body: item.body,
          channelId: 'hortobots-updates',
          smallIcon: 'ic_launcher',
          extra: { route: item.route, notificationId: item.id }
        }))
      });
      return;
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      for (const item of batch) {
        try {
          new Notification(item.title, {
            body: item.body,
            icon: '/icon-192.png',
            tag: item.id
          });
        } catch {}
      }
    }
  } catch {}
}

export async function processSyncSnapshots(snapshots: SyncSnapshots): Promise<AppNotificationItem[]> {
  const prev = loadBaseline();
  const { notifications, nextBaseline } = detectNewNotifications(snapshots, prev);
  saveBaseline(nextBaseline);

  if (notifications.length > 0) {
    const existing = getNotificationHistory();
    const merged = [...notifications, ...existing].slice(0, MAX_HISTORY);
    saveNotificationHistory(merged);
    await dispatchSystemNotifications(notifications);
  }
  return notifications;
}

export function initNativeNotificationNavigation(navigate: (route: string) => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};
  let handle: { remove: () => Promise<void> } | null = null;
  LocalNotifications.addListener('localNotificationActionPerformed', action => {
    const route = action.notification?.extra?.route;
    const notifId = action.notification?.extra?.notificationId;
    if (notifId) markNotificationRead(String(notifId));
    if (typeof route === 'string' && route.startsWith('/')) {
      navigate(route);
    }
  }).then(h => {
    handle = h;
  }).catch(() => {});

  return () => {
    handle?.remove().catch(() => {});
  };
}
