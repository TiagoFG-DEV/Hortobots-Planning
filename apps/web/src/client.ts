import { offlineStorage } from './offlineStorage';

export const API = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

export const auth = () => 
  sessionStorage.getItem('hortobots-token') || 
  localStorage.getItem('hortobots-token') || 
  '';

export const api = async (path: string, init: RequestInit = {}) => {
  const method = (init.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // 1. Se estiver explicitamente offline em requisição de leitura, serve do cache
  if (isGet && typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = offlineStorage.get(path);
    if (cached !== null) {
      return cached;
    }
    // Fallback gracioso para coleções principais
    if (path.includes('/api/eventos') || path.includes('/api/registros') || path.includes('/api/testes') || path.includes('/api/feedbacks')) {
      return [];
    }
  }

  // 2. Se for mutação sem internet, barra imediatamente com mensagem amigável
  if (!isGet && typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Você está no Modo Offline. Conecte-se à internet para salvar, editar ou excluir dados.');
  }

  try {
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${auth()}`,
        ...init.headers
      }
    });

    const body = await response.json();
    if (!response.ok) throw Error(body.error?.message || 'Falha na requisição');

    // Em leituras com sucesso, atualiza o snapshot offline para persistência
    if (isGet && body !== null && body !== undefined) {
      offlineStorage.save(path, body);
    }

    return body;
  } catch (err: any) {
    // 3. Fallback de rede: se o servidor estiver inacessível ou conexão cair durante a requisição
    if (isGet) {
      const cached = offlineStorage.get(path);
      if (cached !== null) {
        console.warn(`[Offline] Rede inacessível, carregando snapshot em cache de ${path}`);
        return cached;
      }
      if (path.includes('/api/eventos') || path.includes('/api/registros') || path.includes('/api/testes') || path.includes('/api/feedbacks')) {
        return [];
      }
    }

    if (!isGet && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
      throw new Error('Falha de conexão com a rede. Verifique sua internet para concluir esta alteração.');
    }

    throw err;
  }
};

