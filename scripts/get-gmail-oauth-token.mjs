/**
 * Hortobots Planning — Script de autorização OAuth 2.0 para a Gmail API
 *
 * COMO USAR:
 *   1. No Google Cloud Console (https://console.cloud.google.com):
 *      a. Crie ou selecione um projeto.
 *      b. Vá em "APIs e serviços" > "Biblioteca" e ative "Gmail API".
 *      c. Vá em "APIs e serviços" > "Credenciais" > "Criar credenciais" > "ID do cliente OAuth 2.0".
 *      d. Tipo: "Aplicativo da Web" (ou "Desktop app" — ambos funcionam).
 *      e. Em "URIs de redirecionamento autorizados", adicione: http://localhost:4000/oauth2callback
 *      f. Salve. Anote: CLIENT_ID e CLIENT_SECRET.
 *
 *   2. Configure a tela de consentimento OAuth em "APIs e serviços" > "Tela de consentimento OAuth":
 *      - Tipo: "Externo" (mesmo que seja só você).
 *      - Adicione seu e-mail como "Usuário de teste".
 *
 *   3. Edite as variáveis CLIENT_ID e CLIENT_SECRET abaixo com os valores obtidos.
 *
 *   4. Execute: node scripts/get-gmail-oauth-token.mjs
 *
 *   5. O script abrirá uma URL no terminal. Abra-a no navegador, faça login com
 *      a conta Gmail que enviará os e-mails, autorize o acesso ao "Enviar e-mail".
 *      Você será redirecionado para http://localhost:4000/oauth2callback — o script
 *      capturará o código e exibirá o REFRESH_TOKEN no terminal.
 *
 *   6. Copie o REFRESH_TOKEN e adicione ao seu .env:
 *      GOOGLE_REFRESH_TOKEN=<valor-copiado>
 *      GOOGLE_CLIENT_ID=<seu-client-id>
 *      GOOGLE_CLIENT_SECRET=<seu-client-secret>
 *      GMAIL_SENDER=me
 *      GMAIL_FROM_EMAIL=<o-email-da-conta-que-você-autorizou>
 *      PUBLIC_APP_URL=https://seu-dominio.render.com
 */

import http from 'node:http';
import { createInterface } from 'node:readline';

// ─── EDITE AQUI ────────────────────────────────────────────────────────────────
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
// ────────────────────────────────────────────────────────────────────────────────

const REDIRECT_URI = 'http://localhost:4000/oauth2callback';
const SCOPE = 'https://www.googleapis.com/auth/gmail.send';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n[ERRO] Defina CLIENT_ID e CLIENT_SECRET no topo deste script ou nas variáveis de ambiente GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.\n');
  process.exit(1);
}

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log('\n======================================================');
console.log(' Hortobots Planning — Obter Refresh Token Gmail OAuth');
console.log('======================================================\n');
console.log('Abra a URL abaixo no navegador e authorize o acesso:\n');
console.log(authUrl);
console.log('\nAguardando callback em http://localhost:4000/oauth2callback ...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:4000');
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  if (!code) {
    res.writeHead(400);
    res.end('Código de autorização não encontrado na URL.');
    server.close();
    return;
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const data = await tokenRes.json();

    if (data.refresh_token) {
      console.log('\n======================================================');
      console.log(' SUCESSO! Copie os valores abaixo para o seu .env:');
      console.log('======================================================\n');
      console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
      console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
      console.log(`GOOGLE_REFRESH_TOKEN=${data.refresh_token}`);
      console.log(`GMAIL_SENDER=me`);
      console.log(`GMAIL_FROM_EMAIL=<o-email-da-conta-que-você-autorizou>`);
      console.log(`PUBLIC_APP_URL=https://seu-dominio.render.com\n`);

      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(`
        <html><body style="font-family:sans-serif;padding:2rem;background:#07140d;color:#a9ed86;">
          <h2>Autorização concluída!</h2>
          <p>Volte ao terminal para copiar o <strong>REFRESH_TOKEN</strong>.</p>
          <p>Pode fechar esta aba.</p>
        </body></html>
      `);
    } else {
      console.error('\n[ERRO] A resposta do Google não contém refresh_token:', JSON.stringify(data, null, 2));
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end('Erro ao obter refresh_token. Veja o terminal para detalhes.');
    }
  } catch (err) {
    console.error('\n[ERRO] Falha ao trocar o código pelo token:', err);
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Erro interno. Veja o terminal.');
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(4000, '127.0.0.1');
server.on('error', (err) => {
  console.error('\n[ERRO] Não foi possível iniciar o servidor na porta 4000:', err.message);
  console.log('Certifique-se de que a porta 4000 não está em uso e tente novamente.\n');
  process.exit(1);
});
