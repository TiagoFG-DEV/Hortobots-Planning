/**
 * Hortobots Planning - Service Worker PWA & WebApp Offline (v3)
 *
 * - Cacheia a casca estática da SPA (HTML, JS, CSS, fontes, ícones)
 * - Cacheia o Portal BIOGLOW (/bioglow/*), exceto vídeos pesados que são opcionais
 * - Intercepta /api/public/biology-feed/*, /api/public/teams/* e /api/documentos/download/*
 *   com estratégia Network-First + fallback para Cache, garantindo notícias de biologia,
 *   dados do portal e PDFs oficiais mesmo sem Wi-Fi.
 * - NÃO cacheia automaticamente imagens e vídeos de registros/testes (/api/media/*),
 *   pois eles possuem download sob demanda via IndexedDB.
 */

const STATIC_CACHE = 'hortobots-static-v3';
const PUBLIC_API_CACHE = 'hortobots-api-public-v1';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/bioglow/index.html',
  '/bioglow/source.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(CORE_ASSETS).catch(err => {
        console.warn('[SW] Aviso ao pré-carregar recursos essenciais:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  const validCaches = new Set([STATIC_CACHE, PUBLIC_API_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(keys.filter(key => !validCaches.has(key)).map(key => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

function isPublicOfflineApi(pathname) {
  return (
    pathname.startsWith('/api/public/biology-feed/') ||
    pathname.startsWith('/api/public/teams/') ||
    pathname.startsWith('/api/documentos/download/')
  );
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Não intercepta mídias de registros/testes (download sob demanda pelo usuário)
  if (url.pathname.startsWith('/api/media/')) {
    return;
  }

  // Endpoints públicos do Portal BIOGLOW (notícias de biologia + dados da equipe) e PDFs oficiais:
  // Network-First para sempre atualizar quando há Wi-Fi, com fallback para última versão salva offline
  if (isPublicOfflineApi(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(PUBLIC_API_CACHE).then(cache => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              error: { message: 'Sem conexão e nenhum dado em cache para este recurso.' }
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Demais rotas /api são tratadas pelo client.ts + IndexedDB (offlineStorage.ts)
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Assets estáticos (JS, CSS, Imagens do app, Fontes, HTML, /bioglow/*)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || url.origin === self.location.origin)
          ) {
            // Evita cachear automaticamente vídeos .mp4 pesados do /bioglow/*
            const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url.pathname);
            if (!isVideo) {
              const responseToCache = networkResponse.clone();
              caches.open(STATIC_CACHE).then(cache => cache.put(event.request, responseToCache));
            }
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            if (url.pathname.startsWith('/bioglow')) {
              return caches.match('/bioglow/index.html');
            }
            return caches.match('/index.html') || caches.match('/');
          }
          return cachedResponse || Response.error();
        });

      return cachedResponse || fetchPromise;
    })
  );
});
