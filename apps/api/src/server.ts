import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import accounts from './accounts.json' with { type: 'json' };
import { storageService, logsRoot, isSupabaseEnabled, supabase } from './storageService.js';
import { belongsToSesiHortobotsFll } from './teamContent.js';
import { collaborationService, type BannerRecord } from './collaborationService.js';
import { createBannerPptx, extractBannerFiles, synthesizeBanner, type BannerContent, type BannerFile } from './bannerService.js';
import { sendImportantEventEmail, sendComumEventEmail } from './notificationService.js';
import {
  canCreateFeedback,
  canConfirmEvent,
  canCreateEvent,
  canCreateTeamContent,
  canDeleteEvent,
  canEditEvent,
  canManageBanner,
  canManageNotificationSettings,
  canMutateTeamContent,
  type AccountRole,
  type AccountUser
} from '@hortobots/shared/permissions';

type Role = AccountRole;
type UserSession = AccountUser;

const sessions = new Map<string, UserSession>();
const adminSessions = new Set<string>();
const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = path.resolve(apiRoot, '../web/dist');
const accountsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'accounts.json');
const adminPasswordPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'admin-password.json');

const TOKEN_SECRET = process.env.SESSION_SECRET || 'hortobots-auth-secret-key-2026';

function createSignedToken(payload: { username: string; role: string; isAdmin?: boolean }): string {
  const data = Buffer.from(JSON.stringify({ ...payload, ts: Date.now() })).toString('base64url');
  const sig = createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySignedToken(token: string): { username: string; role: string; isAdmin?: boolean } | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expectedSig = createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

const app = express();

// Middlewares essenciais
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: '80mb' }));
app.use(express.urlencoded({ extended: true, limit: '80mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: { message: 'Muitas requisições. Aguarde um minuto.' } }
});
app.use('/api', limiter);

// Middleware de Autenticação
export interface AuthRequest extends Request {
  user?: UserSession;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = String(req.headers.authorization || '').replace('Bearer ', '').trim();
  let user = sessions.get(token);
  if (!user) {
    const decoded = verifySignedToken(token);
    if (decoded) {
      user = { username: decoded.username, role: decoded.role as Role };
      sessions.set(token, user);
    }
  }
  if (!user) {
    res.status(401).json({ error: { message: 'Faça login para continuar.' } });
    return;
  }
  req.user = user;
  next();
};

const adminAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = String(req.headers.authorization || '').replace('Bearer ', '').trim();
  
  // 1. Token na lista de sessões de administrador
  let isAdmin = adminSessions.has(token);

  // 2. Token assinado HMAC
  const decoded = verifySignedToken(token);
  if (decoded && (decoded.isAdmin || decoded.role === 'mentor' || decoded.role === 'admin')) {
    isAdmin = true;
  }

  // 3. Usuário autenticado como Mentor na sessão
  let user = sessions.get(token);
  if (!user && decoded) {
    user = { username: decoded.username, role: decoded.role as Role };
  }
  if (user && (user.role === 'mentor' || (user as any).role === 'admin')) {
    isAdmin = true;
  }

  if (!isAdmin) {
    res.status(401).json({ error: { message: 'Acesso administrativo negado.' } });
    return;
  }

  if (user) req.user = user;
  else if (decoded) req.user = { username: decoded.username, role: decoded.role as Role };

  next();
};

const sanitizeFilename = (v: string) =>
  v.normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-zA-Z0-9.-]/g, '-')
   .replace(/-+/g, '-')
   .slice(0, 60);

const teamDefinitions = {
  fll: { modality: 'FLL', storedName: 'Hortobots', label: 'SESI Hortobots FLL' },
  under: { modality: 'FLL', storedName: 'UnderConstruction', label: 'Under Construction FLL' },
  obr: { modality: 'OBR', storedName: 'Hortobots', label: 'Hortobots OBR' }
} as const;
const isTeamKey = (value: string): value is keyof typeof teamDefinitions => value in teamDefinitions;
const belongsToTeam = (item: any, teamKey: keyof typeof teamDefinitions) => {
  const definition = teamDefinitions[teamKey];
  if (String(item.modality || '').toUpperCase() !== definition.modality) return false;
  if (definition.modality === 'OBR') return true;
  const marker = `${item.team || ''} ${(item.tags || []).join(' ')}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return teamKey === 'under' ? marker.includes('underconstruction') : !marker.includes('underconstruction');
};

// ─── Helper: disparo de email de evento ──────────────────────────────────────
async function tryFireEventEmail(saved: any, isUrgent: boolean): Promise<string> {
  try {
    const settings = await collaborationService.getNotificationSettings();
    const notification = isUrgent
      ? await sendImportantEventEmail(saved, settings)
      : await sendComumEventEmail(saved, settings);
    return notification.sent ? 'ENVIADO' : `PENDENTE: ${notification.reason}`;
  } catch (error) {
    console.warn('[Gmail] Falha ao enviar e-mail de evento:', error instanceof Error ? error.message : error);
    return 'FALHOU: não foi possível concluir o envio pela API Gmail.';
  }
}

// ─── Helper: carregar/salvar senha admin ──────────────────────────────────────
async function getAdminPasswordHash(): Promise<{ hash: string; salt: string }> {
  try {
    const raw = await readFile(adminPasswordPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    // Senha padrão: Horto#Mentor26
    const salt = 'a7f3c2d1e8b9f4a6c0d5e2b1f8a9c3d7';
    const hash = scryptSync('Horto#Mentor26', salt, 64).toString('hex');
    return { hash, salt };
  }
}

// ─── Endpoint de Saúde ────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    storage: isSupabaseEnabled ? 'supabase' : 'local',
    logsRoot,
    timestamp: new Date().toISOString()
  });
});

// ─── Endpoint de Login ────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const account = (accounts as any[]).find(x => x.username === String(username).toLowerCase());
  if (!account) {
    res.status(401).json({ error: { message: 'Acesso inválido.' } });
    return;
  }

  const got = scryptSync(String(password), account.salt, 64);
  const expected = Buffer.from(account.hash, 'hex');
  if (!timingSafeEqual(got, expected)) {
    res.status(401).json({ error: { message: 'Acesso inválido.' } });
    return;
  }

  const token = createSignedToken({ username: account.username, role: account.role });
  sessions.set(token, { username: account.username, role: account.role as Role });
  res.json({ token, user: { username: account.username, role: account.role } });
});

// ─── Admin: Login ──────────────────────────────────────────────────────────────
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body || {};
  const { hash, salt } = await getAdminPasswordHash();
  let valid = false;
  try {
    const got = scryptSync(String(password), salt, 64);
    const expected = Buffer.from(hash, 'hex');
    valid = timingSafeEqual(got, expected);
  } catch {
    valid = false;
  }
  if (!valid) {
    res.status(401).json({ error: { message: 'Senha administrativa incorreta.' } });
    return;
  }
  const token = createSignedToken({ username: 'admin', role: 'admin', isAdmin: true });
  adminSessions.add(token);
  res.json({ token });
});

// ─── Admin: Logout ─────────────────────────────────────────────────────────────
app.post('/api/admin/logout', adminAuthMiddleware, (req: AuthRequest, res: Response) => {
  const token = String(req.headers.authorization || '').replace('Bearer ', '');
  adminSessions.delete(token);
  res.json({ ok: true });
});

// ─── Admin: Status do Banco ────────────────────────────────────────────────────
app.get('/api/admin/db-status', adminAuthMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const [eventos, registros, testes] = await Promise.all([
      storageService.listItems('eventos'),
      storageService.listItems('registros'),
      storageService.listItems('testes')
    ]);

    let storageBytes = 0;
    if (isSupabaseEnabled && supabase) {
      // Aproximação do uso de armazenamento no Supabase Storage
      const { data: files } = await supabase.storage.from('hortobots-planning').list('', { limit: 1000 });
      storageBytes = (files || []).reduce((acc, f) => acc + (f.metadata?.size || 0), 0);
    }

    res.json({
      storage: isSupabaseEnabled ? 'supabase' : 'local',
      counts: {
        eventos: eventos.length,
        registros: registros.length,
        testes: testes.length,
        total: eventos.length + registros.length + testes.length
      },
      storageBytes,
      storageMb: (storageBytes / 1024 / 1024).toFixed(2)
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao consultar status do banco.' } });
  }
});

// ─── Admin: Backup do Banco ────────────────────────────────────────────────────
app.get('/api/admin/backup', adminAuthMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const [eventos, registros, testes] = await Promise.all([
      storageService.listItems('eventos'),
      storageService.listItems('registros'),
      storageService.listItems('testes')
    ]);

    const settings = await collaborationService.getNotificationSettings();

    zip.file('backup/eventos.json', JSON.stringify(eventos, null, 2));
    zip.file('backup/registros.json', JSON.stringify(registros, null, 2));
    zip.file('backup/testes.json', JSON.stringify(testes, null, 2));
    zip.file('backup/configuracoes.json', JSON.stringify(settings, null, 2));
    zip.file('backup/meta.json', JSON.stringify({
      exportedAt: new Date().toISOString(),
      storage: isSupabaseEnabled ? 'supabase' : 'local',
      counts: { eventos: eventos.length, registros: registros.length, testes: testes.length }
    }, null, 2));

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const filename = `hortobots-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    res.setHeader('content-type', 'application/zip');
    res.setHeader('content-disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao gerar backup.' } });
  }
});

// ─── Admin: Esvaziar Banco ────────────────────────────────────────────────────
app.delete('/api/admin/db-clear', adminAuthMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    if (isSupabaseEnabled && supabase) {
      // Apaga todas as linhas das tabelas principais
      await supabase.from('events').delete().neq('id', '');
      await supabase.from('records').delete().neq('id', '');
      await supabase.from('tests').delete().neq('id', '');
      await supabase.from('feedbacks').delete().neq('id', '');
    }
    // Limpa também arquivos locais
    for (const kind of ['eventos', 'registros', 'testes'] as const) {
      try {
        const kindPath = path.join(logsRoot, kind);
        if (existsSync(kindPath)) {
          const entries = await readdir(kindPath, { withFileTypes: true });
          for (const entry of entries.filter(e => e.isDirectory())) {
            await rm(path.join(kindPath, entry.name), { recursive: true, force: true });
          }
        }
      } catch { /* ignora */ }
    }
    res.json({ ok: true, message: 'Banco de dados esvaziado com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao esvaziar banco de dados.' } });
  }
});

// ─── Admin: Alterar Senha de Perfil ──────────────────────────────────────────
app.put('/api/admin/change-password', adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  const { username, newPassword } = req.body || {};
  if (!username || !newPassword || String(newPassword).length < 6) {
    res.status(400).json({ error: { message: 'Informe o perfil e uma senha com ao menos 6 caracteres.' } });
    return;
  }
  try {
    const currentAccounts = JSON.parse(await readFile(accountsPath, 'utf8')) as any[];
    const idx = currentAccounts.findIndex(a => a.username === String(username).toLowerCase());
    if (idx === -1) {
      res.status(404).json({ error: { message: 'Perfil não encontrado.' } });
      return;
    }
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(String(newPassword), salt, 64).toString('hex');
    currentAccounts[idx] = { ...currentAccounts[idx], salt, hash };
    await writeFile(accountsPath, JSON.stringify(currentAccounts, null, 2), 'utf8');
    res.json({ ok: true, message: `Senha do perfil "${username}" atualizada com sucesso.` });
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao alterar senha.' } });
  }
});

// ─── Admin: Alterar Senha Administrativa ──────────────────────────────────────
app.put('/api/admin/change-admin-password', adminAuthMiddleware, async (req: AuthRequest, res: Response) => {
  const { newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 8) {
    res.status(400).json({ error: { message: 'A senha administrativa precisa ter ao menos 8 caracteres.' } });
    return;
  }
  try {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(String(newPassword), salt, 64).toString('hex');
    await writeFile(adminPasswordPath, JSON.stringify({ hash, salt }, null, 2), 'utf8');
    // Invalida todas as sessões admin existentes para forçar re-login
    adminSessions.clear();
    res.json({ ok: true, message: 'Senha administrativa alterada. Faça login novamente.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao alterar senha administrativa.' } });
  }
});

// ─── Admin: Listar perfis ──────────────────────────────────────────────────────
app.get('/api/admin/profiles', adminAuthMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const currentAccounts = JSON.parse(await readFile(accountsPath, 'utf8')) as any[];
    res.json(currentAccounts.map(a => ({ username: a.username, role: a.role })));
  } catch {
    res.status(500).json({ error: { message: 'Erro ao listar perfis.' } });
  }
});

// ─── Configurações de Notificações (Mentor ou Admin) ────────────────────────
// ATENÇÃO: estas rotas DEVEM ficar ANTES das rotas genéricas /api/:kind
app.get('/api/configuracoes/notificacoes', async (req: AuthRequest, res: Response) => {
  const token = String(req.headers.authorization || '').replace('Bearer ', '').trim();
  const decoded = verifySignedToken(token);
  const user = sessions.get(token) || (decoded ? { username: decoded.username, role: decoded.role as Role } : null);
  const isAdmin = adminSessions.has(token) || Boolean(decoded?.isAdmin) || user?.role === 'mentor' || (user as any)?.role === 'admin';
  if (!isAdmin && (!user || !canManageNotificationSettings(user))) {
    res.status(403).json({ error: { message: 'Somente o Mentor ou Administrador pode visualizar estes endereços.' } });
    return;
  }
  res.json(await collaborationService.getNotificationSettings());
});

app.put('/api/configuracoes/notificacoes', async (req: AuthRequest, res: Response) => {
  const token = String(req.headers.authorization || '').replace('Bearer ', '').trim();
  const decoded = verifySignedToken(token);
  const user = sessions.get(token) || (decoded ? { username: decoded.username, role: decoded.role as Role } : null);
  const isAdmin = adminSessions.has(token) || Boolean(decoded?.isAdmin) || user?.role === 'mentor' || (user as any)?.role === 'admin';
  if (!isAdmin && (!user || !canManageNotificationSettings(user))) {
    res.status(403).json({ error: { message: 'Somente o Mentor ou Administrador pode alterar estes endereços.' } });
    return;
  }
  const value = {
    managementEmail: String(req.body?.managementEmail || '').trim(),
    coordinationEmail: String(req.body?.coordinationEmail || '').trim(),
    technicalEmail: String(req.body?.technicalEmail || '').trim()
  };
  if (Object.values(value).some(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    res.status(400).json({ error: { message: 'Informe os três e-mails em formato válido.' } });
    return;
  }
  const author = user?.username || 'admin';
  try {
    const saved = await collaborationService.saveNotificationSettings(value, author);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: { message: err?.message || 'Erro ao salvar configurações de notificação.' } });
  }
});

// ─── Feedbacks (DEVE ficar antes de /api/:kind) ──────────────────────────────
app.get('/api/feedbacks', async (req, res) => {
  const targetKind = req.query.targetKind ? String(req.query.targetKind) : undefined;
  const targetId = req.query.targetId ? String(req.query.targetId) : undefined;

  // Se ambos foram informados, retorna os feedbacks específicos do item
  if (targetKind && targetId) {
    if (!['registros', 'testes', 'eventos'].includes(targetKind) || !/^[a-zA-Z0-9_\-.]{1,100}$/.test(targetId)) {
      res.status(400).json({ error: { message: 'Destino do feedback inválido.' } });
      return;
    }
    const list = await collaborationService.listFeedback(targetKind as any, targetId);
    res.json(list);
    return;
  }

  // Se não foi especificado targetId, retorna lista geral de feedbacks enriquecida com os dados do registro/teste/evento
  const validKind = targetKind && ['registros', 'testes', 'eventos'].includes(targetKind)
    ? (targetKind as 'registros' | 'testes' | 'eventos')
    : undefined;

  const rawList = await collaborationService.listAllFeedbacks(validKind);

  // Busca acervo para associar títulos e datas
  try {
    const [records, tests, events] = await Promise.all([
      storageService.listItems('registros'),
      storageService.listItems('testes'),
      storageService.listItems('eventos')
    ]);

    const recordMap = new Map((records || []).map((r: any) => [String(r.id), r]));
    const testMap = new Map((tests || []).map((t: any) => [String(t.id), t]));
    const eventMap = new Map((events || []).map((e: any) => [String(e.id), e]));

    const orphanedFeedbackIds: string[] = [];
    const enriched: any[] = [];

    for (const item of rawList) {
      let targetTitle = '';
      let targetDate = '';
      let targetModality = '';
      let targetTeam = '';
      let exists = false;

      if (item.targetKind === 'registros') {
        const r = recordMap.get(item.targetId);
        if (r) {
          exists = true;
          targetTitle = r.title || `Registro #${item.targetId}`;
          targetDate = r.date || '';
          targetModality = r.modality || '';
        }
      } else if (item.targetKind === 'testes') {
        const t = testMap.get(item.targetId);
        if (t) {
          exists = true;
          targetTitle = t.title || `Teste #${item.targetId}`;
          targetDate = t.date || '';
          targetModality = t.modality || '';
          targetTeam = t.team || '';
        }
      } else if (item.targetKind === 'eventos') {
        const e = eventMap.get(item.targetId);
        if (e) {
          exists = true;
          targetTitle = e.title || `Evento #${item.targetId}`;
          targetDate = e.date || '';
        }
      }

      if (!exists) {
        // Item de origem (evento, teste ou registro) não existe mais: marca para expurgo
        orphanedFeedbackIds.push(item.id);
      } else {
        enriched.push({
          ...item,
          targetTitle,
          targetDate,
          targetModality,
          targetTeam
        });
      }
    }

    // Expurga silenciosamente do banco e nuvem quaisquer feedbacks órfãos encontrados
    if (orphanedFeedbackIds.length > 0) {
      Promise.all(orphanedFeedbackIds.map(id => collaborationService.deleteFeedback(id))).catch(() => {});
    }

    res.json(enriched);
  } catch (err) {
    res.json(rawList);
  }
});

app.post('/api/feedbacks', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!canCreateFeedback(req.user!)) {
    res.status(403).json({ error: { message: 'Somente a Gestão pode publicar feedbacks.' } });
    return;
  }
  const targetKind = String(req.body?.targetKind || '') as 'registros' | 'testes' | 'eventos';
  const targetId = String(req.body?.targetId || '').trim();
  let authorTag = String(req.body?.authorTag || '').trim() as 'DIREÇÃO' | 'COORDENAÇÃO' | 'TÉCNICO DE EQUIPE';
  if (authorTag === ('TÉCNICO' as any)) authorTag = 'TÉCNICO DE EQUIPE';
  const message = String(req.body?.message || '').trim();

  if (!['registros', 'testes', 'eventos'].includes(targetKind) || !/^[a-zA-Z0-9_\-.]{1,100}$/.test(targetId) || !['DIREÇÃO', 'COORDENAÇÃO', 'TÉCNICO DE EQUIPE'].includes(authorTag) || !message || message.length > 2000) {
    res.status(400).json({ error: { message: 'Preencha a tag e uma mensagem de até 2.000 caracteres.' } });
    return;
  }

  // Tenta verificar se o item existe (sem travar caso o cache local ainda não tenha sincronizado)
  const target = await storageService.getItem(targetKind, targetId);
  const feedbackId = randomBytes(4).toString('hex');

  const created = await collaborationService.createFeedback({
    id: feedbackId,
    targetKind,
    targetId,
    authorTag,
    message,
    createdBy: req.user!.username,
    createdAt: new Date().toISOString()
  });

  res.json({
    ...created,
    targetTitle: target?.title || '',
    targetDate: target?.date || ''
  });
});

app.delete('/api/feedbacks/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'management' && req.user?.role !== 'mentor') {
    res.status(403).json({ error: { message: 'Somente a conta da Gestão ou Mentor pode excluir comentários.' } });
    return;
  }
  const id = String(req.params.id || '').trim();
  if (!id) {
    res.status(400).json({ error: { message: 'ID do comentário inválido.' } });
    return;
  }
  await collaborationService.deleteFeedback(id);
  res.json({ ok: true, id });
});

// ─── Banners (DEVE ficar antes de /api/:kind) ────────────────────────────────
app.get('/api/banners/:teamKey', async (req, res) => {
  const teamKey = String(req.params.teamKey);
  if (!isTeamKey(teamKey)) {
    res.status(404).json({ error: { message: 'Equipe não encontrada.' } });
    return;
  }
  const banner = await collaborationService.getBanner(teamKey);
  if (!banner) {
    res.status(404).json({ error: { message: 'Banner ainda não criado.' } });
    return;
  }
  res.json(banner);
});

const saveBanner = async (req: AuthRequest, res: Response, update: boolean) => {
  const teamKey = String(req.params.teamKey);
  if (!isTeamKey(teamKey)) {
    res.status(404).json({ error: { message: 'Equipe não encontrada.' } });
    return;
  }
  const definition = teamDefinitions[teamKey];
  if (!canManageBanner(req.user!, definition.modality)) {
    res.status(403).json({ error: { message: 'Este perfil não pode alterar o banner desta equipe.' } });
    return;
  }
  const previous = await collaborationService.getBanner(teamKey);
  if (!update && previous) {
    res.status(409).json({ error: { message: 'O banner já existe. Use Atualizar Banner.' } });
    return;
  }
  if (update && !previous) {
    res.status(404).json({ error: { message: 'Crie o banner antes de atualizá-lo.' } });
    return;
  }
  const problemQuestion = String(req.body?.problemQuestion || previous?.problemQuestion || '').trim();
  const widthCm = Number(req.body?.widthCm || previous?.widthCm || 90);
  const heightCm = Number(req.body?.heightCm || previous?.heightCm || 120);
  if (problemQuestion.length < 10 || !Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm < 20 || heightCm < 20 || widthCm > 142 || heightCm > 142) {
    res.status(400).json({ error: { message: 'Informe a pergunta-problema e dimensões entre 20 e 142 cm.' } });
    return;
  }
  const [records, tests, researchDocs, designDocs] = await Promise.all([
    storageService.listItems('registros'),
    storageService.listItems('testes'),
    extractBannerFiles((req.body?.researchFiles || []) as BannerFile[]),
    extractBannerFiles((req.body?.designFiles || []) as BannerFile[])
  ]);
  const teamRecords = records.filter(item => belongsToTeam(item, teamKey)).slice(0, 20);
  const teamTests = tests.filter(item => belongsToTeam(item, teamKey)).slice(0, 20);
  const research = `${teamRecords.map(item => `${item.title}: ${item.summary || ''} ${(item.tags || []).join(', ')}`).join('\n')}\n${researchDocs}`;
  const robot = `${teamTests.map(item => `${item.title}: ${item.objective || ''}; ${item.comments || ''}; ${item.mission || ''}`).join('\n')}\n${designDocs}`;
  const generated = await synthesizeBanner({
    teamName: definition.label,
    problem: problemQuestion,
    research,
    robot,
    previous: previous?.content as BannerContent | undefined
  });
  const now = new Date().toISOString();
  const record: BannerRecord = {
    teamKey,
    modality: definition.modality,
    widthCm,
    heightCm,
    problemQuestion,
    content: generated.content,
    sources: {
      records: teamRecords.map(item => item.id),
      tests: teamTests.map(item => item.id),
      researchFiles: (req.body?.researchFiles || []).map((file: BannerFile) => file.name),
      designFiles: (req.body?.designFiles || []).map((file: BannerFile) => file.name),
      generatedBy: generated.generatedBy
    },
    version: previous ? previous.version + 1 : 1,
    createdBy: previous?.createdBy || req.user!.username,
    createdAt: previous?.createdAt || now,
    updatedAt: now
  };
  res.json(await collaborationService.saveBanner(record));
};

app.post('/api/banners/:teamKey', authMiddleware, async (req: AuthRequest, res: Response) => {
  await saveBanner(req, res, false);
});
app.put('/api/banners/:teamKey', authMiddleware, async (req: AuthRequest, res: Response) => {
  await saveBanner(req, res, true);
});

app.delete('/api/banners/:teamKey', authMiddleware, async (req: AuthRequest, res: Response) => {
  const teamKey = String(req.params.teamKey);
  if (!isTeamKey(teamKey) || !canManageBanner(req.user!, teamDefinitions[teamKey].modality)) {
    res.status(403).json({ error: { message: 'Sem permissão para excluir este banner.' } });
    return;
  }
  await collaborationService.deleteBanner(teamKey);
  res.json({ success: true });
});

app.get('/api/banners/:teamKey/canva', async (req, res) => {
  const teamKey = String(req.params.teamKey);
  if (!isTeamKey(teamKey)) {
    res.status(404).end();
    return;
  }
  const banner = await collaborationService.getBanner(teamKey);
  if (!banner) {
    res.status(404).json({ error: { message: 'Banner ainda não criado.' } });
    return;
  }
  const file = await createBannerPptx({ ...banner, content: banner.content as BannerContent });
  res.setHeader('content-type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  res.setHeader('content-disposition', `attachment; filename="banner-${teamKey}-v${banner.version}.pptx"`);
  res.send(file);
});

// ─── Stable public contract: BIOGLOW portal ───────────────────────────────────
app.get('/api/public/teams/sesi-hortobots-fll', async (_req, res) => {
  try {
    const [records, tests] = await Promise.all([
      storageService.listItems('registros'),
      storageService.listItems('testes')
    ]);
    res.json({
      version: 1,
      team: 'SESI Hortobots (FLL)',
      records: records.filter(belongsToSesiHortobotsFll),
      tests: tests.filter(belongsToSesiHortobotsFll)
    });
  } catch {
    res.status(500).json({ error: { message: 'Não foi possível consultar o acervo público da equipe.' } });
  }
});

const biologyFeeds = {
  nature: 'https://www.sciencedaily.com/rss/plants_animals.xml',
  biology: 'https://www.sciencedaily.com/rss/plants_animals/biology.xml',
  research: 'https://phys.org/rss-feed/biology-news/'
} as const;
const biologyFeedCache = new Map<string, { body: string; contentType: string; expiresAt: number }>();

app.get('/api/public/biology-feed/:feed', async (req, res) => {
  const feed = req.params.feed as keyof typeof biologyFeeds;
  const source = biologyFeeds[feed];
  if (!source) {
    res.status(404).json({ error: { message: 'Feed de biologia não encontrado.' } });
    return;
  }

  const cached = biologyFeedCache.get(feed);
  if (cached && cached.expiresAt > Date.now()) {
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.type(cached.contentType).send(cached.body);
    return;
  }

  try {
    const response = await fetch(source, {
      signal: AbortSignal.timeout(12_000),
      headers: { 'User-Agent': 'HortobotsPlanning/1.0 (+https://github.com/TiagoFG-DEV/Hortobots-Planning)' }
    });
    if (!response.ok) throw new Error(`Feed respondeu ${response.status}`);
    const body = await response.text();
    const contentType = response.headers.get('content-type') || 'application/xml; charset=utf-8';
    biologyFeedCache.set(feed, { body, contentType, expiresAt: Date.now() + 10 * 60 * 1000 });
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.type(contentType).send(body);
  } catch {
    if (cached) {
      res.set('Warning', '110 - "Resposta de feed desatualizada"');
      res.type(cached.contentType).send(cached.body);
      return;
    }
    res.status(502).json({ error: { message: 'Não foi possível consultar este feed agora.' } });
  }
});

// ─── Endpoint de Listagem genérico (registros, testes, eventos) ───────────────
app.get('/api/:kind', async (req, res) => {
  const kind = req.params.kind as 'registros' | 'testes' | 'eventos';
  if (!['registros', 'testes', 'eventos'].includes(kind)) {
    res.status(404).json({ error: { message: 'Recurso não encontrado.' } });
    return;
  }

  try {
    const items = await storageService.listItems(kind);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao buscar itens.' } });
  }
});

// ─── Endpoint individual por ID ───────────────────────────────────────────────
app.get('/api/:kind/:id', async (req: Request, res: Response) => {
  const kind = String(req.params.kind) as 'registros' | 'testes' | 'eventos';
  const id = String(req.params.id);
  if (!['registros', 'testes', 'eventos'].includes(kind)) {
    res.status(404).json({ error: { message: 'Recurso não encontrado.' } });
    return;
  }
  try {
    const item = await storageService.getItem(kind, id);
    if (!item) {
      res.status(404).json({ error: { message: 'Item não encontrado.' } });
      return;
    }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao buscar item.' } });
  }
});

// ─── Endpoint de Criação ──────────────────────────────────────────────────────
app.post('/api/:kind', authMiddleware, async (req: AuthRequest, res: Response) => {
  const kind = String(req.params.kind) as 'registros' | 'testes' | 'eventos';
  const body = req.body || {};
  const user = req.user!;
  const modality = String(body.modality || 'FLL').toUpperCase();

  if (!['registros', 'testes', 'eventos'].includes(kind)) {
    res.status(404).json({ error: { message: 'Recurso não encontrado.' } });
    return;
  }

  if (kind === 'eventos' && !canCreateEvent(user)) {
    res.status(403).json({ error: { message: 'Somente Mentor ou Gestão pode cadastrar eventos.' } });
    return;
  }

  if (kind !== 'eventos' && !canCreateTeamContent(user, modality)) {
    res.status(403).json({ error: { message: 'Somente a conta de aluno responsável por este caderno pode criar registros ou testes.' } });
    return;
  }

  const id = randomBytes(4).toString('hex');
  const dateStr = body.date || new Date().toISOString().split('T')[0];
  const folderName = `${dateStr}-${id}`;

  const mediaList = [];
  for (const file of body.media || []) {
    const uploaded = await storageService.uploadMediaItem(kind, folderName, file);
    mediaList.push(uploaded);
  }

  let status = 'PUBLICADO';
  if (kind === 'eventos') {
    status = body.priority === 'URGENTE' || user.role === 'mentor' ? 'PENDENTE' : 'CONFIRMADO';
  }

  const recordData = {
    ...body,
    id,
    media: mediaList,
    status,
    createdBy: user.username,
    createdAt: new Date().toISOString()
  };

  try {
    let saved = await storageService.saveItem(kind, recordData, folderName);

    // Disparo automático de e-mail para qualquer evento novo
    if (kind === 'eventos') {
      const isUrgent = body.priority === 'URGENTE' || Boolean(body.important);
      const notificationStatus = await tryFireEventEmail(saved, isUrgent);
      saved = await storageService.updateItem('eventos', id, { ...saved, notificationStatus });
    }

    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao salvar no armazenamento.' } });
  }
});

// ─── Endpoint de Atualização ──────────────────────────────────────────────────
app.put('/api/:kind/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const kind = String(req.params.kind) as 'registros' | 'testes' | 'eventos';
  const id = String(req.params.id);
  const body = req.body || {};
  const user = req.user!;
  const modality = String(body.modality || 'FLL').toUpperCase();

  if (!['registros', 'testes', 'eventos'].includes(kind)) {
    res.status(404).json({ error: { message: 'Recurso não encontrado.' } });
    return;
  }

  const existing = await storageService.getItem(kind, id);
  if (!existing) {
    res.status(404).json({ error: { message: 'Item não encontrado.' } });
    return;
  }

  if (kind === 'eventos') {
    if (!canEditEvent(user)) {
      res.status(403).json({ error: { message: 'Somente o Mentor pode editar eventos.' } });
      return;
    }
  } else {
    if (!canMutateTeamContent(user, existing)) {
      res.status(403).json({ error: { message: 'Somente o aluno responsável por este caderno pode editar registros ou testes.' } });
      return;
    }
    if (modality !== String(existing.modality || '').toUpperCase()) {
      res.status(403).json({ error: { message: 'Não é permitido transferir conteúdo entre modalidades.' } });
      return;
    }
  }

  const dateStr = body.date || new Date().toISOString().split('T')[0];
  const folderName = `${dateStr}-${id}`;

  const mediaList = [];
  for (const file of body.media || []) {
    const uploaded = await storageService.uploadMediaItem(kind, folderName, file);
    mediaList.push(uploaded);
  }

  const updateData = {
    ...body,
    media: mediaList
  };

  try {
    let updated = await storageService.updateItem(kind, id, updateData);

    // Disparo automático de e-mail na edição de evento
    if (kind === 'eventos') {
      const isUrgent = (body.priority || existing.priority) === 'URGENTE' || Boolean(body.important || existing.important);
      const notificationStatus = await tryFireEventEmail({ ...existing, ...updated }, isUrgent);
      updated = await storageService.updateItem('eventos', id, { ...updated, notificationStatus });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao atualizar dados.' } });
  }
});

// ─── Endpoint de Exclusão ─────────────────────────────────────────────────────
app.delete('/api/:kind/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const kind = String(req.params.kind) as 'registros' | 'testes' | 'eventos';
  const id = String(req.params.id);
  const user = req.user!;

  if (!['registros', 'testes', 'eventos'].includes(kind)) {
    res.status(404).json({ error: { message: 'Recurso não encontrado.' } });
    return;
  }

  const existing = await storageService.getItem(kind, id);
  if (!existing) {
    res.status(404).json({ error: { message: 'Item não encontrado.' } });
    return;
  }

  const allowed = kind === 'eventos'
    ? canDeleteEvent(user)
    : canMutateTeamContent(user, existing);
  if (!allowed) {
    res.status(403).json({ error: { message: kind === 'eventos' ? 'Somente o Mentor pode excluir eventos.' : 'Somente o aluno responsável por este caderno pode excluir registros ou testes.' } });
    return;
  }

  try {
    const result = await storageService.deleteItem(kind, id);
    // Exclui em cascata todos os feedbacks vinculados a este registro, teste ou evento
    await collaborationService.deleteFeedbacksByTarget(kind, id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao excluir item.' } });
  }
});

// ─── Upload direto para nuvem ─────────────────────────────────────────────────
app.post('/api/storage/upload-url', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { filename, kind = 'registros', folderName, modality = '' } = req.body || {};
  const user = req.user!;
  if (!filename) {
    res.status(400).json({ error: { message: 'Nome do arquivo obrigatório.' } });
    return;
  }
  if (!['registros', 'testes'].includes(String(kind)) || !canCreateTeamContent(user, String(modality))) {
    res.status(403).json({ error: { message: 'Sem permissão para enviar mídias para este caderno.' } });
    return;
  }

  try {
    const uploadData = await storageService.createDirectUploadUrl(
      kind as any,
      String(filename),
      folderName ? String(folderName) : undefined
    );

    if (!uploadData) {
      res.json({ direct: false });
      return;
    }

    res.json({
      direct: true,
      ...uploadData
    });
  } catch (err: any) {
    console.error('Erro ao gerar URL de upload direto:', err);
    res.status(500).json({ error: { message: 'Não foi possível gerar a autorização de upload na nuvem.' } });
  }
});

// ─── Confirmação / Recusa de Evento ──────────────────────────────────────────
app.patch('/api/eventos/:id/confirmar', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!canConfirmEvent(user)) {
    res.status(403).json({ error: { message: 'Apenas a Gestão pode autorizar eventos.' } });
    return;
  }

  const id = String(req.params.id || '');
  try {
    const updated = await storageService.updateEventStatus(id, 'CONFIRMADO');
    if (!updated) {
      res.status(404).json({ error: { message: 'Evento não encontrado.' } });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao atualizar evento.' } });
  }
});

app.patch('/api/eventos/:id/recusar', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (!canConfirmEvent(user)) {
    res.status(403).json({ error: { message: 'Apenas a Gestão pode recusar eventos.' } });
    return;
  }
  const updated = await storageService.updateEventStatus(String(req.params.id || ''), 'RECUSADO');
  res.json(updated);
});

// ─── Servir mídias locais ─────────────────────────────────────────────────────
app.get('/api/media/:kind/:folder/:file', (req: Request, res: Response): void => {
  const kind = String(req.params['kind'] ?? '');
  const folder = String(req.params['folder'] ?? '');
  const file = String(req.params['file'] ?? '');

  const allowed = ['registros', 'testes', 'eventos'];
  if (!allowed.includes(kind) || !folder || !file) {
    res.status(404).json({ error: { message: 'Recurso de mídia não encontrado.' } });
    return;
  }

  const safeFolder = path.basename(folder);
  const safeFile = path.basename(file);
  const filePath = path.join(logsRoot, kind, safeFolder, 'midias', safeFile);

  if (!existsSync(filePath)) {
    res.status(404).json({ error: { message: 'Arquivo de mídia não encontrado.' } });
    return;
  }

  res.sendFile(filePath);
});

// ─── Frontend estático ────────────────────────────────────────────────────────
app.use(express.static(webRoot));

app.use((req: Request, res: Response) => {
  if (req.url.startsWith('/api/')) {
    res.status(404).json({ error: { message: 'Rota de API não encontrada.' } });
    return;
  }
  res.sendFile(path.join(webRoot, 'index.html'));
});

// ─── Tratador de erros global ─────────────────────────────────────────────────
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ error: { message: 'Não foi possível concluir esta ação no servidor.' } });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Hortobots Express Server] Rodando na porta ${PORT}`);
  console.log(`Modo de Armazenamento: ${isSupabaseEnabled ? 'SUPABASE NUVEM' : 'LOCAL (Logs/)'}`);
});
