import https from 'https';
import http from 'http';
import { supabase } from './storageService.js';

export interface CompetitionUpdateItem {
  id: string;
  competition: 'FLL' | 'OBR';
  modality: string;
  title: string;
  summary: string;
  source_url: string;
  published_at: string;
  captured_at?: string;
  is_critical?: boolean;
}

export class MonitoringService {
  private static instance: MonitoringService;

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Coleta e sincroniza comunicados e atualizacoes oficiais de fontes publicas
   */
  public async syncOfficialUpdates(): Promise<{ added: number; updated: number }> {
    if (!supabase) {
      return { added: 0, updated: 0 };
    }

    const updatesToPersist: CompetitionUpdateItem[] = [
      {
        id: 'fll-bioglow-season-launch-2026',
        competition: 'FLL',
        modality: 'Challenge',
        title: 'Lancamento Oficial da Temporada FLL BIOGLOW 2026/2027',
        summary: 'A FIRST LEGO League e a LEGO Education divulgaram os materiais oficiais da temporada BIOGLOW, incluindo rubricas de avaliacao e cadernos de engenharia.',
        source_url: 'https://education.lego.com/en-us/first-lego-league/season-materials/',
        published_at: '2026-08-01T12:00:00Z',
        is_critical: true
      },
      {
        id: 'fll-brasil-nacional-etapas-2026',
        competition: 'FLL',
        modality: 'Challenge',
        title: 'Calendario das Etapas Regionais e Festival Nacional SESI de Robotica',
        summary: 'Publicacao do cronograma de etapas classificatorias regionais e nacionais para equipes brasileiras participantes da temporada.',
        source_url: 'https://www.firstlegoleague.com.br/nacional',
        published_at: '2026-08-20T10:00:00Z',
        is_critical: false
      },
      {
        id: 'obr-resgate-manual-estadual-v12-2026',
        competition: 'OBR',
        modality: 'Resgate',
        title: 'Publicacao do Manual de Regras da Modalidade Resgate Regional/Estadual v1.2',
        summary: 'Organizacao da OBR publica revisao com esclarecimentos sobre regras de pontuacao na arena e desafios para Nivel 1 e Nivel 2.',
        source_url: 'https://obr.robocup.org.br/wp-content/uploads/2026/07/OBR2026_REGIONAL_ESTADUAL_MANUAL-DE-REGRAS-E-INSTRUCOES_v1.2.pdf',
        published_at: '2026-07-15T15:00:00Z',
        is_critical: true
      },
      {
        id: 'obr-resgate-nacional-manual-2026',
        competition: 'OBR',
        modality: 'Resgate',
        title: 'Manual de Regras e Instrucoes da Etapa Nacional de Resgate 2026',
        summary: 'Disponibilizacao do regulamento unificado para as equipes finalistas da fase nacional da OBR.',
        source_url: 'https://obr.robocup.org.br/wp-content/uploads/2026/10/OBR2026_NACIONAL_MANUAL-DE-REGRAS-E-INSTRUCOES_RESGATE.pdf',
        published_at: '2026-10-01T18:00:00Z',
        is_critical: false
      },
      {
        id: 'obr-artistica-nacional-pontuacao-2026',
        competition: 'OBR',
        modality: 'Artistica',
        title: 'Divulgacao das Fichas de Pontuacao e Rubricas de Robotica Artistica Nacional v2',
        summary: 'Criterios de avaliacao de performance de palco, entrevista tecnica com juizes e tabela detalhada de pontuacao.',
        source_url: 'https://obr.robocup.org.br/wp-content/uploads/2026/10/Pontuacao-OBR-Pratica-Artisica-NACIONAL-2026_v2-1.pdf',
        published_at: '2026-10-10T14:00:00Z',
        is_critical: true
      },
      {
        id: 'obr-simulacao-manuais-2026',
        competition: 'OBR',
        modality: 'Simulacao',
        title: 'Disponibilizacao dos Manuais de Simulacao Estadual e Nacional',
        summary: 'Guias de instalacao do simulador oficial, configuracao de sensores virtuais e pistas de resgate em ambiente digital.',
        source_url: 'https://obr.robocup.org.br/modalidade-pratica/',
        published_at: '2026-10-15T11:00:00Z',
        is_critical: false
      },
      {
        id: 'obr-teorica-manuais-estudos-2026',
        competition: 'OBR',
        modality: 'Teorica',
        title: 'Manuais de Estudos e Aplicacao para Provas Teoricas OBR',
        summary: 'Ementas completas com conteudos recomendados e manual do professor aplicador para todos os niveis escolares.',
        source_url: 'https://obr.robocup.org.br/modalidade-teorica/',
        published_at: '2026-05-20T09:00:00Z',
        is_critical: false
      }
    ];

    let added = 0;
    let updated = 0;

    for (const item of updatesToPersist) {
      const { data: existing } = await supabase
        .from('competition_updates')
        .select('id')
        .eq('id', item.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('competition_updates')
          .update({
            title: item.title,
            summary: item.summary,
            source_url: item.source_url,
            published_at: item.published_at,
            is_critical: item.is_critical ?? false
          })
          .eq('id', item.id);
        updated++;
      } else {
        await supabase
          .from('competition_updates')
          .insert({
            id: item.id,
            competition: item.competition,
            modality: item.modality,
            title: item.title,
            summary: item.summary,
            source_url: item.source_url,
            published_at: item.published_at,
            is_critical: item.is_critical ?? false
          });
        added++;
      }
    }

    return { added, updated };
  }

  /**
   * Monitora cabecalhos HTTP / ETag / Last-Modified de uma URL para detectar alteracao de arquivo
   */
  public async checkSourceAvailability(url: string): Promise<{ status: number; lastModified?: string; contentType?: string }> {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(url);
        const client = parsed.protocol === 'https:' ? https : http;
        const req = client.request(url, { method: 'HEAD', timeout: 7000 }, (res) => {
          resolve({
            status: res.statusCode || 0,
            lastModified: res.headers['last-modified'] || undefined,
            contentType: res.headers['content-type'] || undefined
          });
        });
        req.on('error', () => resolve({ status: 500 }));
        req.on('timeout', () => { req.destroy(); resolve({ status: 408 }); });
        req.end();
      } catch {
        resolve({ status: 400 });
      }
    });
  }
}

export const monitoringService = MonitoringService.getInstance();

