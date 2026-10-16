import path from 'node:path';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isSupabaseEnabled, logsRoot, supabase } from './storageService.js';

export type NotificationSettings = {
  managementEmail: string;
  coordinationEmail: string;
  technicalEmail: string;
};

export type Feedback = {
  id: string;
  targetKind: 'registros' | 'testes' | 'eventos';
  targetId: string;
  authorTag: 'DIREÇÃO' | 'COORDENAÇÃO' | 'TÉCNICO DE EQUIPE';
  message: string;
  createdBy: string;
  createdAt: string;
};

export type BannerRecord = {
  teamKey: 'fll' | 'under' | 'obr';
  modality: 'FLL' | 'OBR';
  widthCm: number;
  heightCm: number;
  problemQuestion: string;
  content: Record<string, unknown>;
  sources: Record<string, unknown>;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

const collaborationRoot = path.join(logsRoot, 'colaboracao');
const settingsPath = path.join(collaborationRoot, 'configuracoes.json');
const feedbackPath = path.join(collaborationRoot, 'feedbacks.json');
const bannersRoot = path.join(collaborationRoot, 'banners');

const ensureLocal = async () => {
  await mkdir(bannersRoot, { recursive: true });
};

const readJson = async <T>(file: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
};

export const collaborationService = {
  async getNotificationSettings(): Promise<NotificationSettings> {
    if (isSupabaseEnabled && supabase) {
      const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'event_notifications').maybeSingle();
      if (data?.setting_value) return data.setting_value as NotificationSettings;
    }
    return readJson(settingsPath, { managementEmail: '', coordinationEmail: '', technicalEmail: '' });
  },

  async saveNotificationSettings(value: NotificationSettings, updatedBy: string) {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('app_settings').upsert({
        setting_key: 'event_notifications',
        setting_value: value,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    } else {
      await ensureLocal();
      await writeFile(settingsPath, JSON.stringify(value, null, 2), 'utf8');
    }
    return value;
  },

  async listFeedback(targetKind: Feedback['targetKind'], targetId: string): Promise<Feedback[]> {
    if (isSupabaseEnabled && supabase) {
      try {
        const { data, error } = await supabase
          .from('feedbacks')
          .select('*')
          .eq('target_kind', targetKind)
          .eq('target_id', targetId)
          .order('created_at', { ascending: true });
        if (!error && data) {
          return data.map(row => ({
            id: row.id,
            targetKind: row.target_kind,
            targetId: row.target_id,
            authorTag: row.author_tag === 'TÉCNICO' ? 'TÉCNICO DE EQUIPE' : row.author_tag,
            message: row.message,
            createdBy: row.created_by,
            createdAt: row.created_at
          }));
        }
      } catch (err) {
        console.warn('[Supabase] Erro ao listar feedbacks específicos, usando fallback:', err);
      }
    }
    const items = await readJson<Feedback[]>(feedbackPath, []);
    return items.filter(item => item.targetKind === targetKind && item.targetId === targetId);
  },

  async listAllFeedbacks(targetKind?: Feedback['targetKind']): Promise<Feedback[]> {
    if (isSupabaseEnabled && supabase) {
      try {
        let query = supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
        if (targetKind) {
          query = query.eq('target_kind', targetKind);
        }
        const { data, error } = await query;
        if (!error && data) {
          const dbItems = data.map(row => ({
            id: row.id,
            targetKind: row.target_kind as Feedback['targetKind'],
            targetId: row.target_id,
            authorTag: (row.author_tag === 'TÉCNICO' ? 'TÉCNICO DE EQUIPE' : row.author_tag) as Feedback['authorTag'],
            message: row.message,
            createdBy: row.created_by,
            createdAt: row.created_at
          }));
          return dbItems;
        }
      } catch (err) {
        console.warn('[Supabase] Erro ao listar todos os feedbacks, usando fallback:', err);
      }
    }
    const items = await readJson<Feedback[]>(feedbackPath, []);
    const filtered = targetKind ? items.filter(item => item.targetKind === targetKind) : items;
    return filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  async createFeedback(item: Feedback): Promise<Feedback> {
    let savedInDb = false;
    if (isSupabaseEnabled && supabase) {
      try {
        // Tenta salvar com a tag original; se falhar por constraint de 'TÉCNICO', tenta com fallback
        const payload = {
          id: item.id,
          target_kind: item.targetKind,
          target_id: item.targetId,
          author_tag: item.authorTag === 'TÉCNICO DE EQUIPE' ? 'TÉCNICO' : item.authorTag,
          message: item.message,
          created_by: item.createdBy,
          created_at: item.createdAt
        };
        const { error } = await supabase.from('feedbacks').insert(payload);
        if (!error) {
          savedInDb = true;
        } else {
          console.warn('[Supabase] Falha ao inserir feedback:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase] Exceção ao gravar feedback no banco:', err);
      }
    }

    // Salva cópia local como redundância/garantia
    try {
      await ensureLocal();
      const items = await readJson<Feedback[]>(feedbackPath, []);
      // Evita duplicidade se o mesmo ID já existir
      if (!items.some(x => x.id === item.id)) {
        items.push(item);
        await writeFile(feedbackPath, JSON.stringify(items, null, 2), 'utf8');
      }
    } catch (err) {
      if (!savedInDb) throw err;
    }

    return item;
  },

  async getBanner(teamKey: BannerRecord['teamKey']): Promise<BannerRecord | null> {
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.from('banners').select('*').eq('team_key', teamKey).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        teamKey: data.team_key,
        modality: data.modality,
        widthCm: Number(data.width_cm),
        heightCm: Number(data.height_cm),
        problemQuestion: data.problem_question,
        content: data.content,
        sources: data.sources || {},
        version: data.version,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }
    await ensureLocal();
    return readJson<BannerRecord | null>(path.join(bannersRoot, `${teamKey}.json`), null);
  },

  async saveBanner(item: BannerRecord): Promise<BannerRecord> {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('banners').upsert({
        team_key: item.teamKey,
        modality: item.modality,
        width_cm: item.widthCm,
        height_cm: item.heightCm,
        problem_question: item.problemQuestion,
        content: item.content,
        sources: item.sources,
        version: item.version,
        created_by: item.createdBy,
        created_at: item.createdAt,
        updated_at: item.updatedAt
      });
      if (error) throw error;
    } else {
      await ensureLocal();
      await writeFile(path.join(bannersRoot, `${item.teamKey}.json`), JSON.stringify(item, null, 2), 'utf8');
    }
    return item;
  },

  async deleteBanner(teamKey: BannerRecord['teamKey']) {
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from('banners').delete().eq('team_key', teamKey);
      if (error) throw error;
    } else {
      const file = path.join(bannersRoot, `${teamKey}.json`);
      if (existsSync(file)) await rm(file, { force: true });
    }
  }
};
