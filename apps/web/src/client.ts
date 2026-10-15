export const API = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');

export const auth = () => sessionStorage.getItem('hortobots-token') || '';

export const api = async (path: string, init: RequestInit = {}) => {
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
  return body;
};
