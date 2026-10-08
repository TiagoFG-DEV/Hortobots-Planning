import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';

dotenv.config();

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const logsRoot = process.env.LOGS_ROOT ? path.resolve(process.cwd(), process.env.LOGS_ROOT) : path.resolve(apiRoot, '../../Logs');

export const isSupabaseEnabled = Boolean(
  process.env.STORAGE_DRIVER === 'supabase' &&
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : null;

// Inicializa pastas locais caso rode local
for (const folder of ['registros', 'testes', 'eventos']) {
  await mkdir(path.join(logsRoot, folder), { recursive: true });
}

export interface StoredRecord {
  id: string;
  modality: 'FLL' | 'OBR';
  date: string;
  title: string;
  summary: string;
  tags?: string[];
  body?: string;
  media?: Array<{ name: string; type: string; path?: string; url?: string; data?: string }>;
  createdBy?: string;
  createdAt?: string;
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
  media?: Array<{ name: string; type: string; url?: string; path?: string }>;
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
  async listItems(kind: 'registros' | 'testes' | 'eventos') {
    // 1. Se Supabase ativo, busca registros e eventos no Supabase
    if (isSupabaseEnabled && supabase) {
      if (kind === 'registros') {
        const { data, error } = await supabase
          .from('records')
          .select('*')
          .order('record_date', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(r => ({
            id: r.id,
            modality: r.modality,
            date: r.record_date,
            title: r.title,
            summary: r.summary,
            tags: r.tags || [],
            status: r.status,
            cover_path: r.cover_path,
            createdAt: r.created_at
          }));
        }
      } else if (kind === 'eventos') {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: false });
        if (!error && data) {
          return data;
        }
      } else if (kind === 'testes') {
        const { data, error } = await supabase
          .from('tests')
          .select('*')
          .order('date', { ascending: false });
        if (!error && data) {
          return data;
        }
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

  async saveItem(kind: 'registros' | 'testes' | 'eventos', data: any, folderName: string) {
    // Salva localmente na pasta Logs
    const dir = path.join(logsRoot, kind, folderName);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'dados.json'), JSON.stringify(data, null, 2), 'utf8');

    // Se Supabase ativo, persiste também no banco
    if (isSupabaseEnabled && supabase) {
      try {
        if (kind === 'registros') {
          await supabase.from('records').upsert({
            id: data.id,
            modality: data.modality,
            status: 'published',
            record_date: data.date,
            title: data.title,
            summary: data.summary || '',
            slug: data.id,
            folder_path: `${data.modality.toLowerCase()}/${folderName}`,
            json_path: `${data.modality.toLowerCase()}/${folderName}/dados.json`,
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
            created_by: data.createdBy,
            comments: data.comments || ''
          });
        } else if (kind === 'testes') {
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
            attempts: data.attempts || [],
            created_by: data.createdBy
          });
        }
      } catch (err) {
        console.error('Erro ao sincronizar com Supabase:', err);
      }
    }

    return data;
  },

  async updateEventStatus(id: string, status: string) {
    // Atualiza localmente
    const dirs = await readdir(path.join(logsRoot, 'eventos'), { withFileTypes: true });
    let updatedEvent: any = null;
    for (const d of dirs.filter(x => x.isDirectory() && x.name.endsWith(id))) {
      const filePath = path.join(logsRoot, 'eventos', d.name, 'dados.json');
      const content = JSON.parse(await readFile(filePath, 'utf8'));
      content.status = status;
      await writeFile(filePath, JSON.stringify(content, null, 2), 'utf8');
      updatedEvent = content;
      break;
    }

    // Atualiza no Supabase se ativo
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('events').update({ status }).eq('id', id);
      } catch (err) {
        console.error('Erro ao atualizar evento no Supabase:', err);
      }
    }

    return updatedEvent;
  }
};
