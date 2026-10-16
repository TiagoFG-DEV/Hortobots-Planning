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

// ─── Template HTML de E-mail (Identidade Visual Padrão Hortobots — Verde/Calmo) ───
export function buildEventEmailHtml(event: any, managementUrl: string, isUrgent = false) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(event.date || '') ? event.date.split('-').reverse().join('/') : event.date;
  const hasUrgentTag = isUrgent || event.priority === 'URGENTE' || Boolean(event.important);
  const tagLabel = hasUrgentTag ? 'Tag: Prioritário' : 'Novo Evento';

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Um novo evento foi enviado — Hortobots Planning</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#183225;-webkit-font-smoothing:antialiased">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f7f4;padding:32px 12px">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(11,43,25,0.08);border:1px solid #dbe6dd">
          
          <!-- Cabeçalho Institucional Hortobots (Verde Floresta Elegante) -->
          <tr>
            <td style="padding:32px 32px 28px;background:linear-gradient(135deg,#0b2b19 0%,#16794b 100%);color:#ffffff">
              <div style="font-size:11px;letter-spacing:2.5px;color:#a9ed86;font-weight:700;margin-bottom:8px">HORTOBOTS PLANNING</div>
              <div style="display:inline-block;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.28);color:#ffffff;font-size:11px;font-weight:600;letter-spacing:1px;padding:3px 10px;border-radius:999px;margin-bottom:12px">${escapeHtml(tagLabel)}</div>
              <h1 style="margin:0 0 6px;font-size:24px;line-height:1.25;font-weight:700;color:#ffffff">Um novo evento foi enviado!</h1>
              <p style="margin:0;color:#dcecdf;font-size:14px;line-height:1.45">Uma nova atividade foi cadastrada na agenda da equipe e já está disponível para acompanhamento.</p>
            </td>
          </tr>

          <!-- Corpo com Detalhes do Evento -->
          <tr>
            <td style="padding:32px 30px">
              
              <!-- Card de Detalhes -->
              <div style="background-color:#fbfdfb;border:1px solid #dce8df;border-left:4px solid #16794b;border-radius:12px;padding:20px;margin-bottom:20px">
                <div style="font-size:11px;letter-spacing:1.5px;color:#16794b;font-weight:700;margin-bottom:8px">DETALHES DO EVENTO</div>
                <h2 style="font-size:20px;margin:0 0 14px;color:#0b2b19;line-height:1.3">${escapeHtml(event.title)}</h2>
                
                <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%">
                  <tr>
                    <td style="padding:6px 0;color:#496557;font-size:13px;width:50%">
                      <strong style="color:#0b2b19">Data:</strong> ${escapeHtml(date)}
                    </td>
                    <td style="padding:6px 0;color:#496557;font-size:13px;width:50%">
                      <strong style="color:#0b2b19">Período:</strong> ${escapeHtml(event.period || 'Não especificado')}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:6px 0;color:#496557;font-size:13px">
                      <strong style="color:#0b2b19">Horário:</strong> ${escapeHtml(event.lesson || 'Não especificado')}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Observações (se houver) -->
              ${event.comments ? `
              <div style="background-color:#ffffff;border:1px solid #e1ece3;border-radius:12px;padding:16px 18px;line-height:1.55;color:#2c4537;font-size:13px;margin-bottom:20px">
                <strong style="display:block;margin-bottom:6px;color:#16794b;font-size:12px;letter-spacing:1px">OBSERVAÇÕES:</strong>
                ${escapeHtml(event.comments)}
              </div>` : ''}

              <!-- Informação Tranquila e Acolhedora -->
              <div style="background-color:#f2f7f3;border-radius:10px;padding:14px 18px;margin-bottom:24px;border-left:3px solid #16794b">
                <p style="margin:0;color:#214e36;font-size:13px;line-height:1.55">Você pode consultar este evento diretamente no calendário da equipe e registrar notas, feedbacks ou confirmações pelo painel da gestão.</p>
              </div>

              <!-- Botão de Ação (Estilo Padrão Hortobots) -->
              <p style="margin:0 0 8px;font-size:13px;color:#496557">Clique no botão abaixo para acessar a plataforma:</p>
              <p style="margin:0 0 4px">
                <a href="${escapeHtml(managementUrl)}" style="display:inline-block;background-color:#16794b;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:10px;font-size:14px;letter-spacing:0.3px;box-shadow:0 3px 10px rgba(22,121,75,0.2)">VISUALIZAR EVENTO NA PLATAFORMA</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#708a7b;line-height:1.4">O botão direciona você diretamente para a data do evento no calendário após o login com o perfil Gestão.</p>
            </td>
          </tr>

          <!-- Rodapé Institucional -->
          <tr>
            <td style="padding:16px 30px;background-color:#eef4ef;color:#496557;font-size:12px;border-top:1px solid #dce8df">
              SESI 437 — Hortobots Planning &bull; Planejamento e organização em um só lugar.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Versão Texto Puro (Essencial para pontuação anti-spam e inbox normal) ─────
export function buildEventEmailText(event: any, managementUrl: string, isUrgent = false) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(event.date || '') ? event.date.split('-').reverse().join('/') : event.date;
  const hasUrgentTag = isUrgent || event.priority === 'URGENTE' || Boolean(event.important);
  const tagLabel = hasUrgentTag ? '[Tag: Prioritário]' : '[Novo Evento]';

  return `HORTOBOTS PLANNING
${tagLabel}

Um novo evento foi enviado!
Uma nova atividade foi cadastrada na agenda da equipe e já está disponível para acompanhamento.

DETALHES DO EVENTO:
- Título: ${event.title || 'Sem título'}
- Data: ${date}
- Período: ${event.period || 'Não especificado'}
- Horário: ${event.lesson || 'Não especificado'}
${event.comments ? `- Observações: ${event.comments}\n` : ''}
Para visualizar todos os detalhes e gerenciar o evento no calendário:
${managementUrl}

--
SESI 437 — Hortobots Planning
Planejamento e organização da equipe.`;
}

// Aliases para manter compatibilidade com módulos existentes
export function urgentEventEmailHtml(event: any, managementUrl: string) {
  return buildEventEmailHtml(event, managementUrl, true);
}

export function comumEventEmailHtml(event: any, managementUrl: string) {
  return buildEventEmailHtml(event, managementUrl, false);
}

export function emailHtml(event: any, managementUrl: string) {
  const isUrgent = event.priority === 'URGENTE' || Boolean(event.important);
  return buildEventEmailHtml(event, managementUrl, isUrgent);
}

// ─── Envio com Alta Entregabilidade (MIME Multipart + Headers Anti-Spam) ──────
async function sendEmail(event: any, settings: NotificationSettings, isUrgent: boolean, subject: string) {
  const recipients = [settings.managementEmail, settings.coordinationEmail, settings.technicalEmail]
    .map(value => value.trim())
    .filter(Boolean);
  if (recipients.length !== 3) {
    return { sent: false, reason: 'Destinatários incompletos na configuração do Mentor.' };
  }

  const accessToken = await gmailAccessToken();
  if (!accessToken) {
    return { sent: false, reason: 'Credenciais OAuth da API Gmail não configuradas no servidor.' };
  }

  const managementUrl = importantEventManagementUrl(event);
  const htmlBody = buildEventEmailHtml(event, managementUrl, isUrgent);
  const textBody = buildEventEmailText(event, managementUrl, isUrgent);

  const sender = process.env.GMAIL_SENDER || 'me';
  const fromEmail = process.env.GMAIL_FROM_EMAIL || 'tiagop05gregorio@gmail.com';
  const boundary = `_NextPart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2, 10)}@hortobots.planning>`;

  // Monta mensagem MIME multipart/alternative completa (RFC 2046 e RFC 5322)
  // E-mails que contêm tanto text/plain quanto text/html têm taxa de entrega na Caixa de Entrada drasticamente superior
  const mimeMessage = [
    `From: Hortobots Planning <${fromEmail}>`,
    `To: ${recipients.join(', ')}`,
    `Reply-To: ${fromEmail}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    'X-Priority: 3',
    'Auto-Submitted: auto-generated',
    'X-Auto-Response-Suppress: All',
    'X-Mailer: Hortobots Planning Notification Engine',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(textBody, 'utf8').toString('base64'),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(htmlBody, 'utf8').toString('base64'),
    '',
    `--${boundary}--`
  ].join('\r\n');

  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(sender)}/messages/send`, {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ raw: base64Url(mimeMessage) })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Gmail respondeu ${response.status}: ${errorBody.slice(0, 300)}`);
  }

  const payload = await response.json() as { id?: string };
  return { sent: true, messageId: payload.id || '' };
}

// ─── Exportações públicas ─────────────────────────────────────────────────────
export async function sendImportantEventEmail(event: any, settings: NotificationSettings) {
  // Assunto limpo e informativo sem gatilhos de spam (evita 'URGENTE', 'AÇÃO IMEDIATA', etc.)
  const cleanTitle = (event.title || 'Novo Evento').trim();
  const subject = `Um novo evento foi enviado: ${cleanTitle}`;
  return sendEmail(event, settings, true, subject);
}

export async function sendComumEventEmail(event: any, settings: NotificationSettings) {
  const cleanTitle = (event.title || 'Novo Evento').trim();
  const subject = `Um novo evento foi enviado: ${cleanTitle}`;
  return sendEmail(event, settings, false, subject);
}
