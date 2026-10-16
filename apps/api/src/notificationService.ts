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

// ─── Template: Evento URGENTE ────────────────────────────────────────────────
export function urgentEventEmailHtml(event: any, managementUrl: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(event.date || '') ? event.date.split('-').reverse().join('/') : event.date;
  return `<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="UTF-8"><title>Evento URGENTE — Hortobots Planning</title></head>
  <body style="margin:0;background:#1a0505;font-family:Arial,sans-serif;color:#1a0505">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1a0505;padding:24px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff8f5;border-radius:22px;overflow:hidden;border:2px solid #c0392b">
        <tr><td style="padding:30px;background:linear-gradient(135deg,#7b1010,#c0392b);color:#fff">
          <div style="font-size:11px;letter-spacing:3px;color:#ffcdd2;font-weight:700;margin-bottom:6px">HORTOBOTS PLANNING</div>
          <div style="display:inline-block;background:#ff5252;color:#fff;font-size:11px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;margin-bottom:12px">EVENTO URGENTE</div>
          <h1 style="margin:0 0 6px;font-size:26px;line-height:1.2">Acao imediata necessaria</h1>
          <p style="margin:0;color:#ffcdd2;font-size:14px">Um evento urgente foi lancado e aguarda sua aprovacao ou recusa.</p>
        </td></tr>
        <tr><td style="padding:28px">
          <div style="background:#fff;border-left:4px solid #c0392b;border-radius:12px;padding:18px 20px;margin-bottom:18px">
            <div style="font-size:11px;letter-spacing:2px;color:#c0392b;font-weight:700;margin-bottom:8px">DETALHES DO EVENTO</div>
            <h2 style="font-size:22px;margin:0 0 10px;color:#1a0505">${escapeHtml(event.title)}</h2>
            <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%">
              <tr>
                <td style="padding:4px 0;color:#555;font-size:13px"><strong>Data:</strong> ${escapeHtml(date)}</td>
                <td style="padding:4px 0;color:#555;font-size:13px"><strong>Periodo:</strong> ${escapeHtml(event.period)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:4px 0;color:#555;font-size:13px"><strong>Horario:</strong> ${escapeHtml(event.lesson)}</td>
              </tr>
            </table>
          </div>
          ${event.comments ? `<div style="background:#fff;border-radius:12px;border:1px solid #f5c6c6;padding:16px;line-height:1.6;color:#444;font-size:14px;margin-bottom:18px"><strong style="display:block;margin-bottom:6px;color:#c0392b">Observacoes:</strong>${escapeHtml(event.comments)}</div>` : ''}
          <div style="background:#fff3e0;border-radius:12px;padding:16px;margin-bottom:20px;border-left:4px solid #ff9800">
            <p style="margin:0;color:#e65100;font-size:13px;line-height:1.55"><strong>Atencao:</strong> Este evento exige sua analise. Voce pode confirmar, recusar ou simplesmente visualizar sem decidir. A decisao e opcional.</p>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#666">Clique no botao abaixo para acessar a plataforma diretamente neste evento:</p>
          <p style="margin:0 0 4px"><a href="${escapeHtml(managementUrl)}" style="display:inline-block;background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:12px;font-size:14px;letter-spacing:0.5px">VISUALIZAR E DECIDIR SOBRE O EVENTO</a></p>
          <p style="margin:12px 0 0;font-size:11px;color:#999">O botao abrira a tela de login. Selecione o perfil Gestao, informe sua senha e sera redirecionado diretamente para o evento.</p>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#ffeaea;color:#7b1010;font-size:12px">SESI 437 — Hortobots Planning &bull; Notificacao de evento urgente</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

// ─── Template: Evento COMUM ───────────────────────────────────────────────────
export function comumEventEmailHtml(event: any, managementUrl: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(event.date || '') ? event.date.split('-').reverse().join('/') : event.date;
  return `<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="UTF-8"><title>Novo Evento — Hortobots Planning</title></head>
  <body style="margin:0;background:#07140d;font-family:Arial,sans-serif;color:#173326">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07140d;padding:24px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#f6f8f2;border-radius:22px;overflow:hidden;border:1px solid #2f5f43">
        <tr><td style="padding:30px;background:linear-gradient(135deg,#0b2b19,#16794b);color:#fff">
          <div style="font-size:11px;letter-spacing:3px;color:#a9ed86;font-weight:700;margin-bottom:6px">HORTOBOTS PLANNING</div>
          <div style="display:inline-block;background:#2e7d52;color:#a9ed86;font-size:11px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;margin-bottom:12px">NOVO EVENTO</div>
          <h1 style="margin:0 0 6px;font-size:26px;line-height:1.2">Novo evento na agenda</h1>
          <p style="margin:0;color:#dcecdf;font-size:14px">A agenda da equipe recebeu uma nova pauta. Clique para visualizar.</p>
        </td></tr>
        <tr><td style="padding:28px">
          <div style="background:#fff;border-left:4px solid #16794b;border-radius:12px;padding:18px 20px;margin-bottom:18px">
            <div style="font-size:11px;letter-spacing:2px;color:#16794b;font-weight:700;margin-bottom:8px">DETALHES DO EVENTO</div>
            <h2 style="font-size:22px;margin:0 0 10px;color:#0c2818">${escapeHtml(event.title)}</h2>
            <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%">
              <tr>
                <td style="padding:4px 0;color:#537061;font-size:13px"><strong>Data:</strong> ${escapeHtml(date)}</td>
                <td style="padding:4px 0;color:#537061;font-size:13px"><strong>Periodo:</strong> ${escapeHtml(event.period)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:4px 0;color:#537061;font-size:13px"><strong>Horario:</strong> ${escapeHtml(event.lesson)}</td>
              </tr>
            </table>
          </div>
          ${event.comments ? `<div style="background:#fff;border-radius:12px;border:1px solid #c3ddc8;padding:16px;line-height:1.6;color:#304b3c;font-size:14px;margin-bottom:18px"><strong style="display:block;margin-bottom:6px;color:#16794b">Observacoes:</strong>${escapeHtml(event.comments)}</div>` : ''}
          <p style="margin:0 0 8px;font-size:13px;color:#537061">Acesse a plataforma para consultar todos os detalhes deste evento no calendario:</p>
          <p style="margin:0 0 4px"><a href="${escapeHtml(managementUrl)}" style="display:inline-block;background:linear-gradient(135deg,#16794b,#1da462);color:#fff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:12px;font-size:14px;letter-spacing:0.5px">VISUALIZAR EVENTO NA PLATAFORMA</a></p>
          <p style="margin:12px 0 0;font-size:11px;color:#8aa890">O botao abrira a tela de login. Selecione o perfil Gestao e sera redirecionado diretamente para o evento no calendario.</p>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#e9f1e7;color:#5d7467;font-size:12px">SESI 437 — Hortobots Planning &bull; Planejamento, testes e historia em um so lugar.</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

// ─── Legado: template unificado (mantido para compatibilidade) ────────────────
export function emailHtml(event: any, managementUrl: string) {
  return event.priority === 'URGENTE' || Boolean(event.important)
    ? urgentEventEmailHtml(event, managementUrl)
    : comumEventEmailHtml(event, managementUrl);
}

// ─── Envio via Gmail API ──────────────────────────────────────────────────────
async function sendEmail(event: any, settings: NotificationSettings, htmlBody: string, subject: string) {
  const recipients = [settings.managementEmail, settings.coordinationEmail, settings.technicalEmail].map(value => value.trim()).filter(Boolean);
  if (recipients.length !== 3) return { sent: false, reason: 'Destinatarios incompletos na configuracao do Mentor.' };
  const accessToken = await gmailAccessToken();
  if (!accessToken) return { sent: false, reason: 'Credenciais OAuth da API Gmail nao configuradas no servidor.' };
  const sender = process.env.GMAIL_SENDER || 'me';
  const headers = [
    ...(process.env.GMAIL_FROM_EMAIL ? [`From: Hortobots Planning <${process.env.GMAIL_FROM_EMAIL}>`] : []),
    `To: ${recipients.join(', ')}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlBody
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

// ─── Exportações públicas ─────────────────────────────────────────────────────
export async function sendImportantEventEmail(event: any, settings: NotificationSettings) {
  const managementUrl = importantEventManagementUrl(event);
  return sendEmail(event, settings, urgentEventEmailHtml(event, managementUrl), `Evento URGENTE: ${event.title}`);
}

export async function sendComumEventEmail(event: any, settings: NotificationSettings) {
  const managementUrl = importantEventManagementUrl(event);
  return sendEmail(event, settings, comumEventEmailHtml(event, managementUrl), `Novo evento na agenda: ${event.title}`);
}
