/**
 * Hortobots Planning - Gerenciador de Persistência Offline (IndexedDB + Cache API)
 *
 * Salva localmente TODAS as coleções de dados (registros, testes, eventos, feedbacks,
 * documentos oficiais, atualizações e dados do Portal BIOGLOW) via IndexedDB (idb),
 * além de gerenciar o download sob demanda de imagens e vídeos.
 */

import { useState, useEffect, useCallback } from 'react';
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'hortobots-offline-db';
const DB_VERSION = 1;
const STORE_API = 'apiCache';
const STORE_MEDIA = 'mediaCache';
const STORE_META = 'meta';

const SYNC_META_KEY = 'lastSyncTimestamp';
const SYNC_STATS_KEY = 'lastSyncStats';

export interface CacheEntry<T = unknown> {
  key: string;
  timestamp: number;
  data: T;
}

export interface MediaCacheEntry {
  url: string;
  blob: Blob;
  contentType: string;
  name: string;
  size: number;
  timestamp: number;
}

export interface SyncStats {
  timestamp: number;
  syncedRoutes: number;
  failedRoutes: number;
}

type Listener = () => void;

const mediaListeners = new Set<Listener>();
const syncListeners = new Set<Listener>();

function notifyMediaListeners() {
  mediaListeners.forEach(fn => {
    try { fn(); } catch {}
  });
}

function notifySyncListeners() {
  syncListeners.forEach(fn => {
    try { fn(); } catch {}
  });
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> | null {
  if (typeof indexedDB === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_API)) {
          db.createObjectStore(STORE_API, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_MEDIA)) {
          db.createObjectStore(STORE_MEDIA, { keyPath: 'url' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      }
    });
  }
  return dbPromise;
}

// Normaliza o caminho para chave de cache estável
export function normalizeCacheKey(path: string): string {
  return path.replace(/^\/+/, '');
}

// Espelho em memória para acesso síncrono imediato quando já carregado
const memoryApiCache = new Map<string, unknown>();

export const offlineStorage = {
  /**
   * Salva uma resposta de API no IndexedDB do dispositivo
   */
  async save<T>(path: string, data: T): Promise<void> {
    if (data === null || data === undefined) return;
    const key = normalizeCacheKey(path);
    const now = Date.now();
    memoryApiCache.set(key, data);

    try {
      const db = getDb();
      if (db) {
        const instance = await db;
        await instance.put(STORE_API, { key, timestamp: now, data } satisfies CacheEntry<T>);
        await instance.put(STORE_META, { key: SYNC_META_KEY, value: now });
      }
    } catch (err) {
      console.warn('[OfflineStorage] Aviso ao persistir dados no IndexedDB:', err);
    }

    try {
      localStorage.setItem(`hb_meta_${SYNC_META_KEY}`, String(now));
    } catch {}
  },

  /**
   * Recupera os últimos dados salvos no cache (async via IndexedDB)
   */
  async get<T>(path: string): Promise<T | null> {
    const key = normalizeCacheKey(path);
    if (memoryApiCache.has(key)) {
      return memoryApiCache.get(key) as T;
    }

    try {
      const db = getDb();
      if (db) {
        const instance = await db;
        const entry = (await instance.get(STORE_API, key)) as CacheEntry<T> | undefined;
        if (entry && entry.data !== undefined && entry.data !== null) {
          memoryApiCache.set(key, entry.data);
          return entry.data;
        }
      }
    } catch (err) {
      console.warn('[OfflineStorage] Aviso ao ler dados do IndexedDB:', err);
    }

    return null;
  },

  /**
   * Remove entrada de cache
   */
  async remove(path: string): Promise<void> {
    const key = normalizeCacheKey(path);
    memoryApiCache.delete(key);
    try {
      const db = getDb();
      if (db) {
        const instance = await db;
        await instance.delete(STORE_API, key);
      }
    } catch {}
  },

  /**
   * Salva estatísticas da última sincronização automática
   */
  async setSyncStats(stats: SyncStats): Promise<void> {
    try {
      const db = getDb();
      if (db) {
        const instance = await db;
        await instance.put(STORE_META, { key: SYNC_STATS_KEY, value: stats });
        await instance.put(STORE_META, { key: SYNC_META_KEY, value: stats.timestamp });
      }
    } catch {}
    try {
      localStorage.setItem(`hb_meta_${SYNC_META_KEY}`, String(stats.timestamp));
    } catch {}
    notifySyncListeners();
  },

  /**
   * Retorna o timestamp da última sincronização bem-sucedida
   */
  getLastSync(): Date | null {
    try {
      const raw = localStorage.getItem(`hb_meta_${SYNC_META_KEY}`);
      return raw ? new Date(Number(raw)) : null;
    } catch {
      return null;
    }
  }
};

/**
 * Gerenciador de Mídias Sob Demanda (Imagens e Vídeos)
 * NUNCA baixa automaticamente; apenas quando o usuário clicar em "Baixar".
 */
const objectUrlCache = new Map<string, string>();
const downloadingSet = new Set<string>();

export const offlineMedia = {
  isDownloading(url: string): boolean {
    return downloadingSet.has(url);
  },

  async isDownloaded(url: string): Promise<boolean> {
    if (!url) return false;
    if (url.startsWith('data:') || url.startsWith('blob:')) return true;
    try {
      const db = getDb();
      if (!db) return false;
      const instance = await db;
      const entry = (await instance.get(STORE_MEDIA, url)) as MediaCacheEntry | undefined;
      return Boolean(entry?.blob);
    } catch {
      return false;
    }
  },

  async getMediaBlob(url: string): Promise<Blob | null> {
    if (!url) return null;
    try {
      const db = getDb();
      if (!db) return null;
      const instance = await db;
      const entry = (await instance.get(STORE_MEDIA, url)) as MediaCacheEntry | undefined;
      return entry?.blob || null;
    } catch {
      return null;
    }
  },

  async getMediaObjectUrl(url: string): Promise<string | null> {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (objectUrlCache.has(url)) {
      return objectUrlCache.get(url)!;
    }
    const blob = await this.getMediaBlob(url);
    if (!blob) return null;
    const objUrl = URL.createObjectURL(blob);
    objectUrlCache.set(url, objUrl);
    return objUrl;
  },

  async downloadMedia(url: string, name: string): Promise<boolean> {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) return true;
    if (downloadingSet.has(url)) return false;

    downloadingSet.add(url);
    notifyMediaListeners();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Falha ao baixar mídia (${response.status})`);
      }
      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || blob.type || 'application/octet-stream';

      const db = getDb();
      if (db) {
        const instance = await db;
        await instance.put(STORE_MEDIA, {
          url,
          blob,
          contentType,
          name: name || 'midia',
          size: blob.size,
          timestamp: Date.now()
        } satisfies MediaCacheEntry);
      }

      if (objectUrlCache.has(url)) {
        URL.revokeObjectURL(objectUrlCache.get(url)!);
      }
      objectUrlCache.set(url, URL.createObjectURL(blob));
      return true;
    } catch (err) {
      console.warn('[OfflineMedia] Erro ao baixar mídia sob demanda:', err);
      return false;
    } finally {
      downloadingSet.delete(url);
      notifyMediaListeners();
    }
  },

  async removeMedia(url: string): Promise<void> {
    try {
      const db = getDb();
      if (db) {
        const instance = await db;
        await instance.delete(STORE_MEDIA, url);
      }
      if (objectUrlCache.has(url)) {
        URL.revokeObjectURL(objectUrlCache.get(url)!);
        objectUrlCache.delete(url);
      }
    } finally {
      notifyMediaListeners();
    }
  },

  subscribe(listener: Listener): () => void {
    mediaListeners.add(listener);
    return () => mediaListeners.delete(listener);
  }
};

/**
 * Hook React para observar o status de conexão da aplicação
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    let reconnectTimer: number | undefined;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      window.clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(() => setWasOffline(false), 4500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.clearTimeout(reconnectTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

/**
 * Hook React para acompanhar o status de mídia offline específica
 */
export function useOfflineMedia(url: string) {
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!url) return;
    const isDl = await offlineMedia.isDownloaded(url);
    setDownloaded(isDl);
    setDownloading(offlineMedia.isDownloading(url));
    if (isDl) {
      const obj = await offlineMedia.getMediaObjectUrl(url);
      setLocalUrl(obj);
    } else {
      setLocalUrl(null);
    }
  }, [url]);

  useEffect(() => {
    void refresh();
    return offlineMedia.subscribe(() => {
      void refresh();
    });
  }, [refresh]);

  const download = useCallback(async (name: string) => {
    return offlineMedia.downloadMedia(url, name);
  }, [url]);

  const remove = useCallback(async () => {
    return offlineMedia.removeMedia(url);
  }, [url]);

  return { downloaded, downloading, localUrl, download, remove };
}

export function subscribeSyncStatus(listener: Listener): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

const PREF_MOBILE_DATA_KEY = 'hb_pref_mobile_data';
const PREF_ONBOARDING_KEY = 'hb_pref_onboarding_done';
const prefListeners = new Set<Listener>();

function notifyPrefListeners() {
  prefListeners.forEach(fn => {
    try { fn(); } catch {}
  });
}

export const offlinePrefs = {
  getMobileDataAllowed(): boolean {
    try {
      const raw = localStorage.getItem(PREF_MOBILE_DATA_KEY);
      return raw === null ? true : raw === 'true';
    } catch {
      return true;
    }
  },
  setMobileDataAllowed(allowed: boolean): void {
    try {
      localStorage.setItem(PREF_MOBILE_DATA_KEY, String(allowed));
    } catch {}
    notifyPrefListeners();
  },
  isOnboardingDone(): boolean {
    try {
      return localStorage.getItem(PREF_ONBOARDING_KEY) === 'true';
    } catch {
      return true;
    }
  },
  markOnboardingDone(): void {
    try {
      localStorage.setItem(PREF_ONBOARDING_KEY, 'true');
    } catch {}
    notifyPrefListeners();
  },
  isOnCellular(): boolean {
    try {
      const conn = (navigator as any)?.connection || (navigator as any)?.mozConnection || (navigator as any)?.webkitConnection;
      return conn?.type === 'cellular';
    } catch {
      return false;
    }
  },
  shouldAllowNetworkSync(): boolean {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
    if (!this.getMobileDataAllowed() && this.isOnCellular()) return false;
    return true;
  },
  subscribe(listener: Listener): () => void {
    prefListeners.add(listener);
    return () => prefListeners.delete(listener);
  }
};

export function useMobileDataPreference() {
  const [mobileDataAllowed, setAllowed] = useState(() => offlinePrefs.getMobileDataAllowed());
  const [onboardingDone, setOnboardingDone] = useState(() => offlinePrefs.isOnboardingDone());

  useEffect(() => {
    return offlinePrefs.subscribe(() => {
      setAllowed(offlinePrefs.getMobileDataAllowed());
      setOnboardingDone(offlinePrefs.isOnboardingDone());
    });
  }, []);

  const updateMobileData = useCallback((allowed: boolean) => {
    offlinePrefs.setMobileDataAllowed(allowed);
  }, []);

  const completeOnboarding = useCallback((allowed: boolean) => {
    offlinePrefs.setMobileDataAllowed(allowed);
    offlinePrefs.markOnboardingDone();
  }, []);

  return { mobileDataAllowed, onboardingDone, updateMobileData, completeOnboarding };
}
