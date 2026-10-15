import type { NotificationSettings } from './collaborationService.js';

const escapeHtml = (value: unknown) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const base64Url = (value: string) => Buffer.from(value, 'utf8').toString('base64url');

async function gmailAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    signal: AbortSignal.timeout(12_000),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' })
  });
  if (!response.ok) throw new Error(`OAuth Google respondeu ${response.status}`);
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error('OAuth Google não retornou um token de acesso.');
  return payload.access_token;
}

export function importantEventManagementUrl(event: { id: string; date: string }) {
  const appUrl = (process.env.PUBLIC_APP_URL || process.env.WEB_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
  const returnTo = `/calendario?date=${encodeURIComponent(event.date)}&event=${encodeURIComponent(event.id)}`;
  return `${appUrl}/login?profile=gestao&returnTo=${encodeURIComponent(returnTo)}`;
}

export function emailHtml(event: any, managementUrl: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(event.date || '') ? event.date.split('-').reverse().join('/') : event.date;
  return `<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#07140d;font-family:Arial,sans-serif;color:#173326">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07140d;padding:24px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#f6f8f2;border-radius:22px;overflow:hidden;border:1px solid #2f5f43">
        <tr><td style="padding:30px;background-color:#0b2b19;background-image:linear-gradient(135deg,#0b2b19,#16794b);color:#fff">
          <div style="font-size:12px;letter-spacing:2px;color:#a9ed86;font-weight:700">HORTOBOTS PLANNING</div>
          <h1 style="margin:10px 0 4px;font-size:28px;line-height:1.15">Novo evento importante</h1>
          <p style="margin:0;color:#dcecdf">A agenda da equipe recebeu uma nova pauta.</p>
        </td></tr>
        <tr><td style="padding:28px">
          <div style="display:inline-block;padding:7px 12px;border-radius:999px;background:#ffe2df;color:#9d1c13;font-size:12px;font-weight:700">${escapeHtml(event.priority)} • ${escapeHtml(event.status)}</div>
          <h2 style="font-size:24px;margin:18px 0 8px;color:#0c2818">${escapeHtml(event.title)}</h2>
          <p style="margin:0 0 18px;color:#537061">${escapeHtml(date)} • ${escapeHtml(event.period)} • ${escapeHtml(event.lesson)}</p>
          <div style="background:#fff;border-left:4px solid #78be20;border-radius:12px;padding:16px;line-height:1.6;color:#304b3c">${escapeHtml(event.comments || 'Sem descrição adicional.')}</div>
          <p style="margin:22px 0 0;line-height:1.55;color:#537061">A Gestão pode consultar o evento e, sem obrigatoriedade, confirmar ou recusar a solicitação.</p>
          <p style="margin:24px 0 4px"><a href="${escapeHtml(managementUrl)}" style="display:inline-block;background:#16794b;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">ABRIR EVENTO NA PLATAFORMA</a></p>
        </td></tr>
        <tr><td style="padding:18px 28px;background:#e9f1e7;color:#5d7467;font-size:12px">SESI 437 • Planejamento, testes e história em um só lugar.</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

export async function sendImportantEventEmail(event: any, settings: NotificationSettings) {
  const recipients = [settings.managementEmail, settings.coordinationEmail, settings.technicalEmail].map(value => value.trim()).filter(Boolean);
  if (recipients.length !== 3) return { sent: false, reason: 'Destinatários incompletos na configuração do Mentor.' };
  const accessToken = await gmailAccessToken();
  if (!accessToken) return { sent: false, reason: 'Credenciais OAuth da API Gmail não configuradas no servidor.' };
  const managementUrl = importantEventManagementUrl(event);
  const sender = process.env.GMAIL_SENDER || 'me';
  const headers = [
    ...(process.env.GMAIL_FROM_EMAIL ? [`From: Hortobots Planning <${process.env.GMAIL_FROM_EMAIL}>`] : []),
    `To: ${recipients.join(', ')}`,
    `Subject: =?UTF-8?B?${Buffer.from(`Evento importante: ${event.title}`).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    emailHtml(event, managementUrl)
  ].join('\r\n');
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(sender)}/messages/send`, {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ raw: base64Url(headers) })
  });
  if (!response.ok) throw new Error(`API Gmail respondeu ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const payload = await response.json() as { id?: string };
  return { sent: true, messageId: payload.id || '' };
}
