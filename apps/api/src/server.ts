import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import accounts from './accounts.json' with { type: 'json' };
import { storageService, logsRoot, isSupabaseEnabled } from './storageService.js';
import { belongsToSesiHortobotsFll } from './teamContent.js';
import { collaborationService, type BannerRecord } from './collaborationService.js';
import { createBannerPptx, extractBannerFiles, synthesizeBanner, type BannerContent, type BannerFile } from './bannerService.js';
import { sendImportantEventEmail } from './notificationService.js';
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
const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = path.resolve(apiRoot, '../web/dist');

const app = express();

// Middlewares essenciais
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({
  contentSecurityPolicy: false // Permite servir o front e recursos integrados sem bloqueio estrito em dev/prod
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
  const token = String(req.headers.authorization || '').replace('Bearer ', '');
  const user = sessions.get(token);
  if (!user) {
    res.status(401).json({ error: { message: 'Faça login para continuar.' } });
    return;
  }
  req.user = user;
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

// Endpoint de Saúde
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    storage: isSupabaseEnabled ? 'supabase' : 'local',
    logsRoot,
    timestamp: new Date().toISOString()
  });
});

// Endpoint de Login
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

  const token = randomBytes(32).toString('hex');
  sessions.set(token, { username: account.username, role: account.role as Role });
  res.json({ token, user: { username: account.username, role: account.role } });
});

// Stable public contract used by the independently deployed BIOGLOW portal.
// It deliberately exposes only the SESI Hortobots FLL archive.
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

// Same-origin relay for the team's public RSS sources. This is intentionally
// restricted to the allowlist above, so it cannot become an open proxy.
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

// Endpoint de Listagem (registros, testes, eventos)
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

// Endpoint para buscar item individual por ID
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

// Endpoint de Criação (com upload de mídias para Supabase Storage)
app.post('/api/:kind', authMiddleware, async (req: AuthRequest, res: Response) => {
  const kind = String(req.params.kind) as 'registros' | 'testes' | 'eventos';
  const body = req.body || {};
  const user = req.user!;
  const modality = String(body.modality || 'FLL').toUpperCase();

  if (!['registros', 'testes', 'eventos'].includes(kind)) {
    res.status(404).json({ error: { message: 'Recurso não encontrado.' } });
    return;
  }

  // Regra de Permissão
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

  // Processa uploads de mídias (imagens / vídeos) para Supabase Storage ou local
  const mediaList = [];
  for (const file of body.media || []) {
    const uploaded = await storageService.uploadMediaItem(kind, folderName, file);
    mediaList.push(uploaded);
  }

  // Eventos começam como PENDENTE quando urgentes ou lançados por mentor, exigindo confirmação da Gestão
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
    if (kind === 'eventos' && (Boolean(body.important) || body.priority === 'URGENTE')) {
      try {
        const settings = await collaborationService.getNotificationSettings();
        const notification = await sendImportantEventEmail(saved, settings);
        const notificationStatus = notification.sent ? 'ENVIADO' : `PENDENTE: ${notification.reason}`;
        saved = await storageService.updateItem('eventos', id, { ...saved, notificationStatus });
      } catch (error) {
        console.warn('[Gmail] Falha ao enviar evento importante:', error instanceof Error ? error.message : error);
        const notificationStatus = 'FALHOU: não foi possível concluir o envio pela API Gmail.';
        saved = await storageService.updateItem('eventos', id, { ...saved, notificationStatus });
      }
    }
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao salvar no armazenamento.' } });
  }
});

// Endpoint de Atualização / Edição
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
    const updated = await storageService.updateItem(kind, id, updateData);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao atualizar dados.' } });
  }
});

// Endpoint de Exclusão / Remoção
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
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Erro ao excluir item.' } });
  }
});

// Endpoint para obter URL de upload direto para nuvem (Supabase Storage)
// Permite que navegadores enviem vídeos e fotos diretamente para a nuvem sem sobrecarregar a API
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

// Endpoint de Confirmação de Evento (Gestão autoriza)
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

app.get('/api/configuracoes/notificacoes', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!canManageNotificationSettings(req.user!)) {
    res.status(403).json({ error: { message: 'Somente o Mentor pode visualizar estes endereços.' } });
    return;
  }
  res.json(await collaborationService.getNotificationSettings());
});

app.put('/api/configuracoes/notificacoes', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!canManageNotificationSettings(req.user!)) {
    res.status(403).json({ error: { message: 'Somente o Mentor pode alterar estes endereços.' } });
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
  res.json(await collaborationService.saveNotificationSettings(value, req.user!.username));
});

app.get('/api/feedbacks', async (req, res) => {
  const targetKind = String(req.query.targetKind || '') as 'registros' | 'testes' | 'eventos';
  const targetId = String(req.query.targetId || '');
  if (!['registros', 'testes', 'eventos'].includes(targetKind) || !/^[a-f0-9]{8}$/.test(targetId)) {
    res.status(400).json({ error: { message: 'Destino do feedback inválido.' } });
    return;
  }
  res.json(await collaborationService.listFeedback(targetKind, targetId));
});

app.post('/api/feedbacks', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!canCreateFeedback(req.user!)) {
    res.status(403).json({ error: { message: 'Somente a Gestão pode publicar feedbacks.' } });
    return;
  }
  const targetKind = String(req.body?.targetKind || '') as 'registros' | 'testes' | 'eventos';
  const targetId = String(req.body?.targetId || '');
  const authorTag = String(req.body?.authorTag || '') as 'DIREÇÃO' | 'COORDENAÇÃO' | 'TÉCNICO';
  const message = String(req.body?.message || '').trim();
  if (!['registros', 'testes', 'eventos'].includes(targetKind) || !/^[a-f0-9]{8}$/.test(targetId) || !['DIREÇÃO', 'COORDENAÇÃO', 'TÉCNICO'].includes(authorTag) || !message || message.length > 2000) {
    res.status(400).json({ error: { message: 'Preencha a tag e uma mensagem de até 2.000 caracteres.' } });
    return;
  }
  const target = await storageService.getItem(targetKind, targetId);
  if (!target) {
    res.status(404).json({ error: { message: 'O item comentado não foi encontrado.' } });
    return;
  }
  res.json(await collaborationService.createFeedback({
    id: randomBytes(4).toString('hex'), targetKind, targetId, authorTag, message,
    createdBy: req.user!.username, createdAt: new Date().toISOString()
  }));
});

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

// Servir arquivos de mídia dos registros/testes salvos em Logs/
// GET /api/media/:kind/:folder/:file
app.get('/api/media/:kind/:folder/:file', (req: Request, res: Response): void => {
  const kind = String(req.params['kind'] ?? '');
  const folder = String(req.params['folder'] ?? '');
  const file = String(req.params['file'] ?? '');

  const allowed = ['registros', 'testes', 'eventos'];
  if (!allowed.includes(kind) || !folder || !file) {
    res.status(404).json({ error: { message: 'Recurso de mídia não encontrado.' } });
    return;
  }

  // Sanitiza para evitar path traversal
  const safeFolder = path.basename(folder);
  const safeFile = path.basename(file);
  const filePath = path.join(logsRoot, kind, safeFolder, 'midias', safeFile);

  if (!existsSync(filePath)) {
    res.status(404).json({ error: { message: 'Arquivo de mídia não encontrado.' } });
    return;
  }

  res.sendFile(filePath);
});

// Servir Frontend estático compilado (Web)
app.use(express.static(webRoot));

// Fallback SPA para rotas não-API
app.use((req: Request, res: Response) => {
  if (req.url.startsWith('/api/')) {
    res.status(404).json({ error: { message: 'Rota de API não encontrada.' } });
    return;
  }
  res.sendFile(path.join(webRoot, 'index.html'));
});

// Tratador de erros global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ error: { message: 'Não foi possível concluir esta ação no servidor.' } });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Hortobots Express Server] Rodando na porta ${PORT}`);
  console.log(`Modo de Armazenamento: ${isSupabaseEnabled ? 'SUPABASE NUVEM' : 'LOCAL (Logs/)'}`);
});
