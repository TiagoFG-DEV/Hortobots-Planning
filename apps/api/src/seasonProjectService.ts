import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isSupabaseEnabled, logsRoot, supabase, supabaseBucket } from './storageService.js';

export type SeasonMediaKind = 'image' | 'video' | 'pdf';

export interface SeasonAttachment {
  id: string;
  name: string;
  kind: SeasonMediaKind;
  mime: string;
  url: string;
  path?: string;
  uploadedAt: string;
}

export interface SeasonArticleSection {
  id: string;
  title: string;
  category: 'projeto' | 'conscientizacao' | 'jatai' | 'metodologia' | 'resultados';
  status: 'completo' | 'em_aberto';
  body: string;
  openNote?: string;
  updatedAt: string;
  attachments: SeasonAttachment[];
}

export interface SeasonProjectTest {
  id: string;
  date: string;
  time?: string;
  appearanceTimes?: string;
  title: string;
  description: string;
  weather: string;
  temperatureC: number | null;
  humidityPct: number | null;
  windKmh: number | null;
  buzzerActive: boolean | null;
  frequencyHz: number | null;
  beeAppearances: number | null;
  beeAppearancesBuzzerOn?: number | null;
  beeAppearancesBuzzerOff?: number | null;
  notes: string;
  attachments: SeasonAttachment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonProjectData {
  version: number;
  updatedAt: string;
  updatedBy: string;
  article: {
    title: string;
    subtitle: string;
    summary: string;
    sections: SeasonArticleSection[];
  };
  tests: SeasonProjectTest[];
}

const projectRoot = path.join(logsRoot, 'colaboracao');
const projectFilePath = path.join(projectRoot, 'projeto_temporada.json');
export const projectMediaRoot = path.join(projectRoot, 'projeto-temporada-midias');
const CLOUD_JSON_PATH = 'system/season_project.json';
const SETTINGS_KEY = 'season_project_bioglow';

export function createDefaultSeasonProject(): SeasonProjectData {
  const now = new Date().toISOString();
  return {
    version: 1,
    updatedAt: now,
    updatedBy: 'sistema',
    article: {
      title: 'The Beezy Box (TBB) — Projeto da Temporada BIOGLOW 2026/2027',
      subtitle: 'SESI Hortobots FLL · Polinização Acústica, Abelhas Jataí e Biodiversidade',
      summary:
        'Artigo científico vivo do projeto de inovação da equipe SESI Hortobots FLL na temporada FIRST LEGO League Challenge BIOGLOW 2026/2027. O dispositivo The Beezy Box combina um buzzer de frequência inspirada no voo das abelhas com câmera e visão computacional para observar a aproximação e visitação de abelhas jataí.',
      sections: [
        {
          id: 'sec-projeto',
          title: '1. O Projeto: The Beezy Box (TBB)',
          category: 'projeto',
          status: 'em_aberto',
          body:
            'O projeto investiga como preservar e fortalecer espécies de abelhas para a manutenção da biodiversidade e da polinização. Inspirado em pesquisas científicas da Universidade de Tel Aviv — que demonstraram que certas flores percebem vibrações sonoras de polinizadores e aumentam a concentração de açúcar do néctar —, o protótipo utiliza um buzzer para reproduzir frequências semelhantes ao zumbido das abelhas e uma câmera com IA para registrar e contar visitações.\n\n[Em aberto: detalhar aqui o circuito final da placa, especificações do buzzer, modelo da câmera/IA e fotos de antes e depois das iterações do protótipo.]',
          openNote: 'Aguardando preenchimento pela equipe com especificações da placa, fotos de iteração e fontes da pesquisa.',
          updatedAt: now,
          attachments: []
        },
        {
          id: 'sec-conscientizacao',
          title: '2. Conscientização: O que fazer se encontrar abelhas em casa?',
          category: 'conscientizacao',
          status: 'completo',
          body:
            'As abelhas são essenciais para a polinização de plantas silvestres e culturas agrícolas, sustentando a biodiversidade e a produção de alimentos. A redução de habitats, uso inadequado de agrotóxicos e desinformação colocam diversas espécies em risco.\n\nSe houver um enxame ou colmeia em casa ou próximo à escola:\n• Não tente exterminar, queimar ou aplicar venenos e inseticidas — além de prejudicar o meio ambiente, muitas espécies nativas são protegidas por lei.\n• Mantenha distância segura e evite ruídos ou vibrações próximas ao ninho.\n• Para abelhas com ferrão (Apis mellifera) em área de risco, acione o Corpo de Bombeiros (193), a Defesa Civil ou um apicultor/resgatista credenciado da região.\n• Para abelhas sem ferrão (como a jataí), procure um meliponicultor autorizado para orientações de manejo ou transferência segura apenas quando houver risco real à colônia.',
          updatedAt: now,
          attachments: []
        },
        {
          id: 'sec-jatai',
          title: '3. Foco Científico: Abelha Jataí (Tetragonisca angustula)',
          category: 'jatai',
          status: 'em_aberto',
          body:
            'A abelha jataí (Tetragonisca angustula) é uma abelha nativa brasileira sem ferrão, dócil, de pequeno porte e de grande importância ecológica na polinização de flores nativas e urbanas. Por sua relevância ambiental e segurança para observação em campo, os testes do The Beezy Box têm foco na visitação das jataís.\n\n[Em aberto: adicionar observações de campo da equipe, localização dos pontos de observação e referências bibliográficas utilizadas.]',
          openNote: 'A equipe pode complementar com observações locais das colônias monitoradas e referências.',
          updatedAt: now,
          attachments: []
        },
        {
          id: 'sec-metodologia',
          title: '4. Metodologia e Parâmetros dos Testes da Placa',
          category: 'metodologia',
          status: 'em_aberto',
          body:
            'Para validar a eficiência do The Beezy Box em campo, os testes devem comparar o comportamento e a frequência de aparecimento das abelhas jataí com e sem o estímulo sonoro do buzzer, registrando sempre as condições ambientais de cada sessão: condição do clima, temperatura (°C), umidade relativa (%), velocidade do vento (km/h) e contagem de aparições/visitas.\n\n[Em aberto: definir duração padrão de cada coleta, distância da caixa até as flores/colmeia e protocolo de registro na planilha de aparecimento de abelhas.]',
          openNote: 'Protocolo exato de coleta e planilhas de campo serão anexados pela equipe na aba de Testes Científicos.',
          updatedAt: now,
          attachments: []
        }
      ]
    },
    tests: []
  };
}

async function ensureLocalDirs() {
  await mkdir(projectRoot, { recursive: true });
  await mkdir(projectMediaRoot, { recursive: true });
}

export const seasonProjectService = {
  async get(): Promise<SeasonProjectData> {
    if (isSupabaseEnabled && supabase) {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', SETTINGS_KEY)
          .maybeSingle();
        if (!error && data?.setting_value) {
          return data.setting_value as SeasonProjectData;
        }
      } catch (err) {
        console.warn('[SeasonProject] Falha ao ler app_settings:', err);
      }

      try {
        const { data, error } = await supabase.storage.from(supabaseBucket).download(CLOUD_JSON_PATH);
        if (!error && data) {
          const text = await data.text();
          return JSON.parse(text) as SeasonProjectData;
        }
      } catch {
        // ainda não criado no bucket
      }
    }

    try {
      if (existsSync(projectFilePath)) {
        const raw = await readFile(projectFilePath, 'utf8');
        return JSON.parse(raw) as SeasonProjectData;
      }
    } catch {
      // fallback para padrão
    }

    return createDefaultSeasonProject();
  },

  async save(payload: SeasonProjectData, updatedBy: string): Promise<SeasonProjectData> {
    const next: SeasonProjectData = {
      ...payload,
      version: Number(payload.version || 1),
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    if (isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase.from('app_settings').upsert(
          {
            setting_key: SETTINGS_KEY,
            setting_value: next,
            updated_by: updatedBy,
            updated_at: next.updatedAt
          },
          { onConflict: 'setting_key' }
        );
        if (error) {
          console.warn('[SeasonProject] Aviso ao gravar em app_settings:', error.message);
        }
      } catch (err) {
        console.warn('[SeasonProject] Exceção ao gravar em app_settings:', err);
      }

      try {
        const buffer = Buffer.from(JSON.stringify(next, null, 2), 'utf8');
        await supabase.storage.from(supabaseBucket).upload(CLOUD_JSON_PATH, buffer, {
          upsert: true,
          contentType: 'application/json'
        });
      } catch (err) {
        console.warn('[SeasonProject] Aviso ao gravar no bucket:', err);
      }
    }

    await ensureLocalDirs();
    await writeFile(projectFilePath, JSON.stringify(next, null, 2), 'utf8');
    return next;
  },

  async saveMedia(
    name: string,
    mime: string,
    base64Data: string
  ): Promise<SeasonAttachment> {
    const cleanName = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60) || 'anexo';
    const fileId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const storedFilename = `${fileId}-${cleanName}`;

    const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] || '' : base64Data;
    const buffer = Buffer.from(rawBase64, 'base64');

    const kind: SeasonMediaKind = mime.startsWith('video/')
      ? 'video'
      : mime === 'application/pdf' || cleanName.toLowerCase().endsWith('.pdf')
      ? 'pdf'
      : 'image';

    if (isSupabaseEnabled && supabase) {
      const storagePath = `projeto-temporada/${storedFilename}`;
      const { error } = await supabase.storage.from(supabaseBucket).upload(storagePath, buffer, {
        upsert: true,
        contentType: mime || 'application/octet-stream'
      });
      if (!error) {
        const { data: pub } = supabase.storage.from(supabaseBucket).getPublicUrl(storagePath);
        return {
          id: fileId,
          name,
          kind,
          mime,
          url: pub.publicUrl,
          path: storagePath,
          uploadedAt: new Date().toISOString()
        };
      }
    }

    await ensureLocalDirs();
    const localPath = path.join(projectMediaRoot, storedFilename);
    await writeFile(localPath, buffer);

    return {
      id: fileId,
      name,
      kind,
      mime,
      url: `/api/projeto-temporada/media/${storedFilename}`,
      path: storedFilename,
      uploadedAt: new Date().toISOString()
    };
  }
};
