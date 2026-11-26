/**
 * Hortobots Planning - Motor de Sincronização Automática Offline
 *
 * Sempre que há conexão com a internet (Wi-Fi/dados), baixa e atualiza localmente:
 * - Registros, Testes, Eventos e Feedbacks
 * - Documentos oficiais de competição e Atualizações
 * - Banners científicos das 3 equipes
 * - Dados públicos e notícias de biologia do Portal BIOGLOW
 * - PDFs oficiais de competição (via Cache API / Service Worker)
 *
 * IMPORTANTE: Imagens e vídeos de registros/testes NÃO são baixados automaticamente;
 * ficam disponíveis para download sob demanda pelo usuário.
 */

import { API, auth } from './client';
import { offlinePrefs, offlineStorage } from './offlineStorage';

const PUBLIC_SYNC_ROUTES = [
  '/api/registros',
  '/api/testes',
  '/api/eventos',
  '/api/feedbacks',
  '/api/documentos',
  '/api/documentos/atualizacoes',
  '/api/banners/sesi-hortobots-fll',
  '/api/banners/under-construction-fll',
  '/api/banners/hortobots-obr',
  '/api/public/teams/sesi-hortobots-fll',
  '/api/projeto-temporada'
];

const BIOLOGY_FEEDS = [
  '/api/public/biology-feed/nature',
  '/api/public/biology-feed/biology',
  '/api/public/biology-feed/research'
];

const BIOGLOW_SHELL_ASSETS = [
  '/bioglow/index.html',
  '/bioglow/source.json'
];

let syncInFlight: Promise<void> | null = null;
let lastSyncAttemptAt = 0;
const MIN_SYNC_INTERVAL_MS = 15_000;

async function fetchAndCacheJson(route: string): Promise<boolean> {
  try {
    const token = auth();
    const res = await fetch(`${API}${route}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) return false;
    const data = await res.json();
    await offlineStorage.save(route, data);

    // Se for lista de registros ou testes, também salva entradas individuais por ID
    // para que a abertura direta (/registro/:id ou /teste/:id) funcione 100% offline
    if (Array.isArray(data)) {
      if (route === '/api/registros') {
        await Promise.all(
          data
            .filter(item => item && item.id)
            .map(item => offlineStorage.save(`/api/registros/${item.id}`, item))
        );
      } else if (route === '/api/testes') {
        await Promise.all(
          data
            .filter(item => item && item.id)
            .map(item => offlineStorage.save(`/api/testes/${item.id}`, item))
        );
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function warmCacheUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${API}${url}`);
    if (!res.ok) return false;
    if (typeof caches !== 'undefined') {
      const cache = await caches.open('hortobots-api-public-v1');
      await cache.put(new Request(`${API}${url}`), res.clone());
    }
    return true;
  } catch {
    return false;
  }
}

async function warmBioglowShell(): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open('hortobots-static-v3');
    for (const asset of BIOGLOW_SHELL_ASSETS) {
      try {
        const res = await fetch(asset);
        if (res.ok) await cache.put(asset, res.clone());
      } catch {}
    }

    // Descobre scripts/styles/imagens referenciados no /bioglow/index.html (exceto .mp4)
    const htmlRes = await fetch('/bioglow/index.html');
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const assetMatches = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g)).map(m => m[1]);
      for (const rawAsset of assetMatches) {
        if (!rawAsset || /\.mp4(\?|$)/i.test(rawAsset)) continue;
        const resolved = rawAsset.startsWith('/') ? rawAsset : `/bioglow/${rawAsset.replace(/^\.\//, '')}`;
        try {
          const r = await fetch(resolved);
          if (r.ok) await cache.put(resolved, r.clone());
        } catch {}
      }
    }
  } catch {}
}

async function warmOfficialDocsPdfs(): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const docs = await offlineStorage.get<Array<{ id: string }>>('/api/documentos');
    if (!Array.isArray(docs)) return;
    const cache = await caches.open('hortobots-api-public-v1');
    for (const doc of docs) {
      if (!doc?.id) continue;
      const pdfUrl = `${API}/api/documentos/download/${doc.id}?v=ptbr_sesi_v3`;
      try {
        const existing = await cache.match(pdfUrl);
        if (!existing) {
          const res = await fetch(pdfUrl);
          if (res.ok) await cache.put(pdfUrl, res.clone());
        }
      } catch {}
    }
  } catch {}
}

export async function runFullOfflineSync(force = false): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  if (!force && !offlinePrefs.shouldAllowNetworkSync()) return;
  const now = Date.now();
  if (!force && now - lastSyncAttemptAt < MIN_SYNC_INTERVAL_MS) return;
  if (syncInFlight) return syncInFlight;

  lastSyncAttemptAt = now;
  syncInFlight = (async () => {
    let syncedRoutes = 0;
    let failedRoutes = 0;

    const results = await Promise.allSettled([
      ...PUBLIC_SYNC_ROUTES.map(r => fetchAndCacheJson(r)),
      ...BIOLOGY_FEEDS.map(f => warmCacheUrl(f))
    ]);

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) syncedRoutes += 1;
      else failedRoutes += 1;
    }

    await Promise.allSettled([warmBioglowShell(), warmOfficialDocsPdfs()]);

    await offlineStorage.setSyncStats({
      timestamp: Date.now(),
      syncedRoutes,
      failedRoutes
    });
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

/**
 * Inicializa listeners de sincronização automática ao abrir o app e ao reconectar ao Wi-Fi
 */
export function initAutoOfflineSync(): () => void {
  if (typeof window === 'undefined') return () => {};

  const trigger = () => {
    if (navigator.onLine) {
      void runFullOfflineSync(false);
    }
  };

  // Sincroniza logo após a inicialização da UI
  const initTimer = window.setTimeout(trigger, 1200);
  window.addEventListener('online', trigger);

  // Re-sincroniza ao voltar para a aba/app se estiver online
  const onVisibility = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      void runFullOfflineSync(false);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    window.clearTimeout(initTimer);
    window.removeEventListener('online', trigger);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
