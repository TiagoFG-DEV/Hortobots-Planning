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

type Role = 'management' | 'mentor' | 'obr' | 'fll';
interface UserSession {
  username: string;
  role: Role;
}

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

const canWrite = (user: UserSession, modality: string) =>
  user.role === 'mentor' ||
  (user.role === 'fll' && modality === 'FLL') ||
  (user.role === 'obr' && modality === 'OBR');

const sanitizeFilename = (v: string) =>
  v.normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-zA-Z0-9.-]/g, '-')
   .replace(/-+/g, '-')
   .slice(0, 60);

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
  if (kind === 'eventos' && user.role !== 'mentor' && user.role !== 'management') {
    res.status(403).json({ error: { message: 'Somente Mentor ou Gestão pode cadastrar eventos.' } });
    return;
  }

  if (kind !== 'eventos' && !canWrite(user, modality)) {
    res.status(403).json({ error: { message: 'Este perfil possui acesso apenas para visualização.' } });
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
    const saved = await storageService.saveItem(kind, recordData, folderName);
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

  if (kind === 'eventos' && user.role !== 'mentor' && user.role !== 'management') {
    res.status(403).json({ error: { message: 'Somente Mentor ou Gestão pode editar eventos.' } });
    return;
  }

  if (kind !== 'eventos' && !canWrite(user, modality)) {
    res.status(403).json({ error: { message: 'Sem permissão para editar.' } });
    return;
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

  // Mentor e Gestão podem excluir; equipes podem excluir registros de suas modalidades
  if (user.role === 'mentor' || user.role === 'management' || user.role === 'fll' || user.role === 'obr') {
    try {
      const result = await storageService.deleteItem(kind, id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: { message: 'Erro ao excluir item.' } });
    }
    return;
  }

  res.status(403).json({ error: { message: 'Sem permissão para exclusão.' } });
});

// Endpoint de Confirmação de Evento (Gestão autoriza)
app.patch('/api/eventos/:id/confirmar', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'management') {
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
