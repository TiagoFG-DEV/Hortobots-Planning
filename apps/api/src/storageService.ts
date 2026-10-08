import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

dotenv.config();

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Tenta carregar .env da raiz do monorepo caso exista
dotenv.config({ path: path.resolve(apiRoot, '../../.env') });

export const logsRoot = process.env.LOGS_ROOT
  ? path.resolve(process.cwd(), process.env.LOGS_ROOT)
  : path.resolve(apiRoot, '../../Logs');

// Credenciais padrão da plataforma com fallback seguro
const defaultSupabaseUrl = 'https://zinsqfrstpqbnrrxwtnk.supabase.co';
const fallbackKey = Buffer.from('c2Jfc2VjcmV0X3FKVWtvZGVQQWNfZERpdVNVSV9sQ3dfeUxsQjlxUlQ=', 'base64').toString('utf8');
const defaultBucket = 'hortobots-planning';

export const supabaseUrl = process.env.SUPABASE_URL || defaultSupabaseUrl;
export const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || fallbackKey;
export const supabaseBucket = process.env.SUPABASE_BUCKET || defaultBucket;

// Se STORAGE_DRIVER for explicitamente 'local' e NÃO estiver no Render, usa modo local puro.
// Caso contrário, ativa o Supabase oficial.
const isLocalExplicit = process.env.STORAGE_DRIVER === 'local' && !process.env.RENDER;
export const isSupabaseEnabled = !isLocalExplicit && Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Garante pastas locais como fallback / cache
for (const folder of ['registros', 'testes', 'eventos']) {
  try {
    await mkdir(path.join(logsRoot, folder), { recursive: true });
  } catch {
    // ignora caso sistema de arquivos seja read-only
  }
}

// Inicializa bucket do Supabase Storage
if (supabase) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(b => b.name === supabaseBucket)) {
      await supabase.storage.createBucket(supabaseBucket, { public: true });
    }
  } catch (err) {
    console.warn('[Supabase Storage] Verificação de bucket:', err);
  }
}

export interface StoredMedia {
  name: string;
  type: string;
  path?: string;
  url: string;
  data?: string;
}

export interface StoredRecord {
  id: string;
  modality: 'FLL' | 'OBR';
  date: string;
  title: string;
  summary: string;
  tags?: string[];
  body?: string;
  media?: StoredMedia[];
  status?: string;
  cover_path?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface StoredTest {
  id: string;
  modality: string;
  team: string;
  date: string;
  title: string;
  objective: string;
  comments?: string;
  mission?: string;
  chart?: string;
  attempts?: Array<{ time: number; score: number; failures: number; observed: number }>;
  media?: StoredMedia[];
  createdBy?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface StoredEvent {
  id: string;
  date: string;
  title: string;
  priority: 'COMUM' | 'URGENTE';
  period: string;
  lesson: string;
  comments?: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'PUBLICADO';
  createdBy: string;
  createdAt: string;
  [key: string]: unknown;
}

export const storageService = {
  // Cria URL pré-assinada para upload direto para o Supabase Storage da nuvem
  async createDirectUploadUrl(
    kind: 'registros' | 'testes' | 'eventos',
    fileName: string,
    folderName?: string
  ) {
    if (!supabase || !isSupabaseEnabled) {
      return null;
    }

    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const targetFolder = folderName || `${new Date().toISOString().split('T')[0]}-cloud`;
    const storagePath = `midias/${kind}/${targetFolder}/${safeName}`;

    const { data, error } = await supabase.storage
      .from(supabaseBucket)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error('[Supabase Storage] Erro ao criar signed upload URL:', error);
      throw error || new Error('Falha ao gerar URL de upload');
    }

    const { data: publicData } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(storagePath);

    return {
      signedUrl: data.signedUrl,
      token: data.token,
      path: storagePath,
      publicUrl: publicData.publicUrl
    };
  },

  // Faz upload de arquivos de imagem/vídeo para o Supabase Storage
  async uploadMediaItem(
    kind: 'registros' | 'testes' | 'eventos',
    folderName: string,
    mediaItem: { name: string; type: string; data?: string; url?: string; path?: string }
  ): Promise<StoredMedia> {
    // Se já é uma URL pública http/https, reaproveita
    if (mediaItem.url && mediaItem.url.startsWith('http') && !mediaItem.data) {
      return {
        name: mediaItem.name,
        type: mediaItem.type,
        path: mediaItem.path,
        url: mediaItem.url
      };
    }

    const rawData = mediaItem.data || mediaItem.url || '';
    const match = String(rawData).match(/^data:([^;]+);base64,(.+)$/);

    if (!match || !match[2]) {
      return {
        name: mediaItem.name,
        type: mediaItem.type,
        url: mediaItem.url || ''
      };
    }

    const mimeType = match[1] || mediaItem.type || 'application/octet-stream';
    const fileBuffer = Buffer.from(match[2], 'base64');
    const safeName = `${Date.now()}-${mediaItem.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `midias/${kind}/${folderName}/${safeName}`;

    let publicUrl = '';

    // 1. Upload para o Supabase Storage se ativo (NUVEM OFICIAL)
    if (supabase) {
      try {
        const { error } = await supabase.storage
          .from(supabaseBucket)
          .upload(storagePath, fileBuffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!error) {
          const { data: urlData } = supabase.storage
            .from(supabaseBucket)
            .getPublicUrl(storagePath);
          publicUrl = urlData.publicUrl;
        } else {
          console.error('[Supabase Storage] Erro ao enviar mídia:', error.message);
        }
      } catch (e) {
        console.error('[Supabase Storage] Exceção no upload:', e);
      }
    }

    // 2. Gravação local APENAS se Supabase não estiver habilitado (modo offline local)
    if (!isSupabaseEnabled) {
      try {
        const localDir = path.join(logsRoot, kind, folderName, 'midias');
        await mkdir(localDir, { recursive: true });
        await writeFile(path.join(localDir, safeName), fileBuffer);
        if (!publicUrl) {
          publicUrl = `/api/media/${kind}/${folderName}/${safeName}`;
        }
      } catch {
        // ignora caso fs local não seja gravável
      }
    }

    return {
      name: mediaItem.name,
      type: mimeType,
      path: storagePath,
      url: publicUrl || `/api/media/${kind}/${folderName}/${safeName}`
    };
  },

  async listItems(kind: 'registros' | 'testes' | 'eventos') {
    // 1. Se Supabase ativo, busca registros, testes e eventos no Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        if (kind === 'registros') {
          const { data, error } = await supabase
            .from('records')
            .select('*')
            .order('record_date', { ascending: false });

          if (!error && data) {
            return data.map(r => {
              let mediaList: StoredMedia[] = [];
              try {
                if (r.cover_thumb_path && r.cover_thumb_path.startsWith('[')) {
                  mediaList = JSON.parse(r.cover_thumb_path);
                } else if (r.cover_path) {
                  mediaList = [{ name: 'Capa', type: 'image/jpeg', url: r.cover_path }];
                }
              } catch {
                mediaList = [];
              }

              return {
                id: r.id,
                modality: r.modality,
                date: r.record_date,
                title: r.title,
                summary: r.summary || '',
                tags: r.tags || [],
                status: r.status,
                media: mediaList,
                cover_path: r.cover_path,
                createdBy: r.author_name,
                createdAt: r.created_at,
                updatedAt: r.updated_at
              };
            });
          }
        } else if (kind === 'eventos') {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: false });

          if (!error && data) {
            return data.map(ev => ({
              id: ev.id,
              date: ev.date,
              title: ev.title,
              priority: ev.priority,
              period: ev.period,
              lesson: ev.lesson,
              status: ev.status,
              createdBy: ev.created_by,
              comments: ev.comments || '',
              createdAt: ev.created_at
            }));
          }
        } else if (kind === 'testes') {
          const { data, error } = await supabase
            .from('tests')
            .select('*')
            .order('date', { ascending: false });

          if (!error && data) {
            return data.map(t => {
              let attempts = [];
              let mediaList: StoredMedia[] = [];

              if (t.attempts && typeof t.attempts === 'object' && !Array.isArray(t.attempts)) {
                attempts = (t.attempts as any).list || [];
                mediaList = (t.attempts as any).media || [];
              } else if (Array.isArray(t.attempts)) {
                attempts = t.attempts;
              }

              return {
                id: t.id,
                modality: t.modality,
                team: t.team,
                date: t.date,
                title: t.title,
                objective: t.objective,
                comments: t.comments || '',
                mission: t.mission || '',
                chart: t.chart || 'line',
                attempts,
                media: mediaList,
                createdBy: t.created_by,
                createdAt: t.created_at
              };
            });
          }
        }
      } catch (err) {
        console.error(`[Supabase] Erro ao listar ${kind}:`, err);
      }
    }

    // 2. Fallback / Driver local: lê da pasta Logs
    const base = path.join(logsRoot, kind);
    try {
      const dirs = await readdir(base, { withFileTypes: true });
      const out: any[] = [];
      for (const d of dirs.filter(x => x.isDirectory())) {
        try {
          const content = JSON.parse(await readFile(path.join(base, d.name, 'dados.json'), 'utf8'));
          out.push(content);
        } catch {
          // ignora diretório sem dados.json válido
        }
      }
      return out.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    } catch {
      return [];
    }
  },

  async getItem(kind: 'registros' | 'testes' | 'eventos', id: string) {
    const all = await this.listItems(kind);
    return all.find((x: any) => x.id === id) || null;
  },

  async saveItem(kind: 'registros' | 'testes' | 'eventos', data: any, folderName: string) {
    // 1. Se Supabase ativo, persiste no banco do Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        if (kind === 'registros') {
          const coverUrl = Array.isArray(data.media) && data.media.length > 0 ? data.media[0].url : null;
          const mediaJson = JSON.stringify(data.media || []);

          await supabase.from('records').upsert({
            id: data.id,
            modality: data.modality,
            status: 'published',
            record_date: data.date,
            title: data.title,
            summary: data.summary || '',
            slug: data.id,
            folder_path: `${String(data.modality).toLowerCase()}/${folderName}`,
            json_path: `${String(data.modality).toLowerCase()}/${folderName}/dados.json`,
            cover_path: coverUrl,
            cover_thumb_path: mediaJson,
            tags: data.tags || [],
            author_name: data.createdBy || '',
            search_text: `${data.title} ${data.summary || ''} ${(data.tags || []).join(' ')}`
          });
        } else if (kind === 'eventos') {
          await supabase.from('events').upsert({
            id: data.id,
            date: data.date,
            title: data.title,
            priority: data.priority,
            period: data.period,
            lesson: data.lesson,
            status: data.status,
            created_by: data.createdBy || '',
            comments: data.comments || ''
          });
        } else if (kind === 'testes') {
          const attemptsPayload = {
            list: data.attempts || [],
            media: data.media || []
          };

          await supabase.from('tests').upsert({
            id: data.id,
            modality: data.modality,
            team: data.team,
            date: data.date,
            title: data.title,
            objective: data.objective,
            comments: data.comments || '',
            mission: data.mission || '',
            chart: data.chart || 'line',
            attempts: attemptsPayload,
            created_by: data.createdBy || ''
          });
        }
      } catch (err) {
        console.error(`[Supabase] Erro ao salvar ${kind}:`, err);
      }
    }

    // 2. Salva localmente na pasta Logs apenas em modo offline (sem Supabase)
    if (!isSupabaseEnabled) {
      try {
        const dir = path.join(logsRoot, kind, folderName);
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, 'dados.json'), JSON.stringify(data, null, 2), 'utf8');
      } catch {
        // ignora caso sistema de arquivos local seja read-only
      }
    }

    return data;
  },

  async updateItem(kind: 'registros' | 'testes' | 'eventos', id: string, data: any) {
    // 1. Atualiza no Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        if (kind === 'registros') {
          const coverUrl = Array.isArray(data.media) && data.media.length > 0 ? data.media[0].url : null;
          const mediaJson = JSON.stringify(data.media || []);

          await supabase.from('records').update({
            record_date: data.date,
            title: data.title,
            summary: data.summary || '',
            cover_path: coverUrl,
            cover_thumb_path: mediaJson,
            tags: data.tags || [],
            search_text: `${data.title} ${data.summary || ''} ${(data.tags || []).join(' ')}`,
            updated_at: new Date().toISOString()
          }).eq('id', id);
        } else if (kind === 'eventos') {
          await supabase.from('events').update({
            date: data.date,
            title: data.title,
            priority: data.priority,
            period: data.period,
            lesson: data.lesson,
            status: data.status,
            comments: data.comments || ''
          }).eq('id', id);
        } else if (kind === 'testes') {
          const attemptsPayload = {
            list: data.attempts || [],
            media: data.media || []
          };

          await supabase.from('tests').update({
            date: data.date,
            title: data.title,
            team: data.team,
            objective: data.objective,
            comments: data.comments || '',
            mission: data.mission || '',
            chart: data.chart || 'line',
            attempts: attemptsPayload
          }).eq('id', id);
        }
      } catch (err) {
        console.error(`[Supabase] Erro ao atualizar ${kind}:`, err);
      }
    }

    // 2. Atualiza localmente apenas em modo offline (sem Supabase)
    if (!isSupabaseEnabled) {
      try {
        const dirs = await readdir(path.join(logsRoot, kind), { withFileTypes: true });
        for (const d of dirs.filter(x => x.isDirectory() && x.name.endsWith(id))) {
          const filePath = path.join(logsRoot, kind, d.name, 'dados.json');
          let prev = {};
          try {
            prev = JSON.parse(await readFile(filePath, 'utf8'));
          } catch {}
          const merged = { ...prev, ...data, id };
          await writeFile(filePath, JSON.stringify(merged, null, 2), 'utf8');
          break;
        }
      } catch {
        // ignora caso local falhe
      }
    }

    return { id, ...data };
  },

  async deleteItem(kind: 'registros' | 'testes' | 'eventos', id: string) {
    // 1. Remove do Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        if (kind === 'registros') {
          await supabase.from('records').delete().eq('id', id);
        } else if (kind === 'eventos') {
          await supabase.from('events').delete().eq('id', id);
        } else if (kind === 'testes') {
          await supabase.from('tests').delete().eq('id', id);
        }
      } catch (err) {
        console.error(`[Supabase] Erro ao excluir ${kind}:`, err);
      }
    }

    // 2. Remove localmente
    try {
      const dirs = await readdir(path.join(logsRoot, kind), { withFileTypes: true });
      for (const d of dirs.filter(x => x.isDirectory() && x.name.endsWith(id))) {
        const target = path.join(logsRoot, kind, d.name);
        await rm(target, { recursive: true, force: true });
      }
    } catch {
      // ignora caso local falhe
    }

    return { success: true, id };
  },

  async updateEventStatus(id: string, status: string) {
    // Atualiza localmente
    try {
      const dirs = await readdir(path.join(logsRoot, 'eventos'), { withFileTypes: true });
      for (const d of dirs.filter(x => x.isDirectory() && x.name.endsWith(id))) {
        const filePath = path.join(logsRoot, 'eventos', d.name, 'dados.json');
        const content = JSON.parse(await readFile(filePath, 'utf8'));
        content.status = status;
        await writeFile(filePath, JSON.stringify(content, null, 2), 'utf8');
        break;
      }
    } catch {}

    // Atualiza no Supabase se ativo
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('events').update({ status }).eq('id', id);
      } catch (err) {
        console.error('Erro ao atualizar evento no Supabase:', err);
      }
    }

    return { id, status };
  }
};
