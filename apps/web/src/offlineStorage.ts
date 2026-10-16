/**
 * Hortobots Planning - Gerenciador de Persistência Offline
 * 
 * Permite que eventos, registros, testes e feedbacks continuem acessíveis
 * e visualizáveis no WebApp / APK mesmo sem qualquer conexão com a internet.
 */

import { useState, useEffect } from 'react';

const CACHE_PREFIX = 'hb_offline_data_v1:';
const SYNC_META_KEY = 'hb_last_sync_timestamp';

export interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

// Normaliza o caminho para chave de cache estável
function getCacheKey(path: string): string {
  // Remove parâmetros que não alteram o conteúdo base ou normaliza
  const clean = path.replace(/^\/+/, '');
  return `${CACHE_PREFIX}${clean}`;
}

export const offlineStorage = {
  /**
   * Salva uma resposta de API no cache offline do dispositivo
   */
  save<T>(path: string, data: T): void {
    try {
      if (data === null || data === undefined) return;
      const key = getCacheKey(path);
      const entry: CacheEntry<T> = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(key, JSON.stringify(entry));
      localStorage.setItem(SYNC_META_KEY, String(Date.now()));
    } catch (err) {
      // Se quota do localStorage estourar, ignora silenciosamente ou purga antigos
      console.warn('[OfflineStorage] Aviso ao persistir dados no cache local:', err);
    }
  },

  /**
   * Recupera os últimos dados salvos no cache para a rota informada
   */
  get<T>(path: string): T | null {
    try {
      const key = getCacheKey(path);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheEntry<T>;
      return parsed.data ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Remove entradas de cache
   */
  remove(path: string): void {
    try {
      localStorage.removeItem(getCacheKey(path));
    } catch {}
  },

  /**
   * Retorna o timestamp da última sincronização bem-sucedida
   */
  getLastSync(): Date | null {
    try {
      const raw = localStorage.getItem(SYNC_META_KEY);
      return raw ? new Date(Number(raw)) : null;
    } catch {
      return null;
    }
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
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Remove o aviso de "reconectado" após 4 segundos
      const timer = setTimeout(() => setWasOffline(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}
