export interface CompetitionDoc {
  id: string;
  competition: 'FLL' | 'OBR';
  modality: string;
  season_year: string;
  doc_type: 'rubrica' | 'regras' | 'complementar';
  title: string;
  description: string;
  url_oficial: string;
  file_path?: string;
  is_current: boolean;
  is_fallback: boolean;
  region?: 'SP' | 'NACIONAL' | 'INTERNACIONAL';
  updated_at?: string;
}

export interface CompetitionUpdate {
  id: string;
  competition: 'FLL' | 'OBR';
  modality: string;
  title: string;
  summary: string;
  source_url: string;
  published_at: string;
  captured_at?: string;
  is_critical?: boolean;
  region?: 'SP' | 'NACIONAL' | 'INTERNACIONAL';
}

export const INITIAL_OFFICIAL_DOCUMENTS: CompetitionDoc[] = [
  // ── FLL – Rúbricas e Avaliação em Português Brasileiro (SESI Brasil) ───────
  {
    id: 'fll-bioglow-rubricas-oficiais-ptbr',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: 'FLL Challenge BIOGLOW – Rúbricas Oficiais de Avaliação (SESI Brasil)',
    description: 'Rúbricas completas oficiais em português brasileiro para Design do Robô, Projeto de Inovação e Core Values – Temporada BIOGLOW.',
    url_oficial: 'https://cni.portaldaindustria.com.br/documents/492877/4724595/02+R%C3%BAbricas.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'fll-bioglow-fluxograma-ptbr',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: 'FLL Challenge BIOGLOW – Fluxograma da Seção de Avaliação',
    description: 'Fluxograma oficial em português brasileiro dos tempos e dinâmica da sessão de avaliação com a banca de juízes.',
    url_oficial: 'https://cni.portaldaindustria.com.br/documents/492877/4724595/03+Fluxograma+da+se%C3%A7%C3%A3o+de+avalia%C3%A7%C3%A3o.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },

  // ── FLL – Regras e Manuais em Português Brasileiro (SESI Brasil) ───────────
  {
    id: 'fll-bioglow-livro-regras-desafio-ptbr',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'regras',
    title: 'FLL Challenge BIOGLOW – Livro de Regras do Desafio do Robô',
    description: 'Manual oficial em português com as missões da mesa, regras de navegação, lançamentos e pontuação da temporada BIOGLOW.',
    url_oficial: 'https://cni.portaldaindustria.com.br/documents/492877/4724595/04+Livro+de+regras+do+desafio+do+rob%C3%B4.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'fll-bioglow-regras-participacao-ptbr',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'regras',
    title: 'FLL Challenge BIOGLOW – Regras Oficiais de Participação',
    description: 'Regulamento de participação, formação de equipes e diretrizes dos torneios regionais e festival nacional do SESI.',
    url_oficial: 'https://cni.portaldaindustria.com.br/documents/492877/4724595/01+Regras+de+participa%C3%A7%C3%A3o.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'fll-sp-regional-diretrizes-ptbr',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'regras',
    title: 'Torneio Regional SESI-SP de Robótica – Diretrizes Estado de São Paulo',
    description: 'Diretrizes oficiais, calendário das seletivas regionais do Estado de São Paulo e critérios de classificação.',
    url_oficial: 'https://cni.portaldaindustria.com.br/documents/492877/4724595/01+Regras+de+participa%C3%A7%C3%A3o.pdf',
    is_current: true,
    is_fallback: false,
    region: 'SP'
  },
  {
    id: 'fll-bioglow-catalogo-pecas-ptbr',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'complementar',
    title: 'FLL Challenge BIOGLOW – Catálogo Oficial de Peças do Desafio',
    description: 'Catálogo de conferência de peças, elementos de missão da mesa e montagem dos conjuntos da temporada BIOGLOW.',
    url_oficial: 'https://cni.portaldaindustria.com.br/documents/492877/4724642/01+Cat%C3%A1logo+de+pe%C3%A7as.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },

  // ── OBR – Regras e Fichas de Avaliação (Originais em Português) ────────────
  {
    id: 'obr-resgate-estadual-sp-2026',
    competition: 'OBR',
    modality: 'Resgate',
    season_year: '2026',
    doc_type: 'regras',
    title: 'OBR Resgate – Manual de Regras e Instruções (Regional e Estadual SP)',
    description: 'Manual de regras oficiais para a etapa Regional e Estadual de São Paulo na modalidade Resgate (Níveis 1 e 2).',
    url_oficial: 'https://obr.robocup.org.br/wp-content/uploads/2026/07/OBR2026_REGIONAL_ESTADUAL_MANUAL-DE-REGRAS-E-INSTRUCOES_v1.2.pdf',
    is_current: true,
    is_fallback: false,
    region: 'SP'
  },
  {
    id: 'obr-resgate-nacional-2026',
    competition: 'OBR',
    modality: 'Resgate',
    season_year: '2026',
    doc_type: 'regras',
    title: 'OBR Resgate – Manual de Regras e Instruções (Etapa Nacional)',
    description: 'Manual oficial da fase Nacional de Resgate com pontuação padronizada, desafios e critérios de desempate.',
    url_oficial: 'https://obr.robocup.org.br/wp-content/uploads/2026/10/OBR2026_NACIONAL_MANUAL-DE-REGRAS-E-INSTRUCOES_RESGATE.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'obr-artistica-pontuacao-2026',
    competition: 'OBR',
    modality: 'Artística',
    season_year: '2026',
    doc_type: 'rubrica',
    title: 'OBR Robótica Artística – Fichas de Avaliação e Pontuação Nacional v2',
    description: 'Critérios e rubricas de avaliação de performance artística, montagem técnica e entrevista com jurados.',
    url_oficial: 'https://obr.robocup.org.br/wp-content/uploads/2026/10/Pontuacao-OBR-Pratica-Artisica-NACIONAL-2026_v2-1.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'obr-simulacao-manual-2026',
    competition: 'OBR',
    modality: 'Simulação',
    season_year: '2026',
    doc_type: 'complementar',
    title: 'OBR Simulação – Manuais de Instalação e Pistas (Estadual e Nacional)',
    description: 'Instruções para download e configuração do ambiente oficial de simulação virtual de resgate.',
    url_oficial: 'https://obr.robocup.org.br/modalidade-pratica/',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'obr-teorica-manual-2026',
    competition: 'OBR',
    modality: 'Teórica',
    season_year: '2026',
    doc_type: 'complementar',
    title: 'OBR Teórica – Manuais de Estudos e Aplicação de Provas',
    description: 'Ementas curriculares e manual para aplicação das provas da modalidade Teórica da Olimpíada.',
    url_oficial: 'https://obr.robocup.org.br/modalidade-teorica/',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  }
];

export const INITIAL_OFFICIAL_UPDATES: CompetitionUpdate[] = [
  // ── FLL ─────────────────────────────────────────────────────────────────
  {
    id: 'fll-sp-etapa-regional-cronograma-2026',
    competition: 'FLL',
    modality: 'Challenge',
    title: 'Publicação do Cronograma Oficial das Etapas Regionais SESI-SP',
    summary: 'A coordenação de robótica do SESI São Paulo divulgou as datas, polos regionais de competição e diretrizes para as equipes de São Paulo na temporada BIOGLOW.',
    source_url: 'https://cni.portaldaindustria.com.br/documents/492877/4724595/01+Regras+de+participa%C3%A7%C3%A3o.pdf',
    published_at: '2026-09-05T14:30:00Z',
    is_critical: true,
    region: 'SP'
  },
  {
    id: 'fll-bioglow-season-launch-2026',
    competition: 'FLL',
    modality: 'Challenge',
    title: 'Lançamento Oficial da Temporada FLL BIOGLOW 2026/2027',
    summary: 'O SESI Nacional publicou o pacote oficial de documentos da temporada BIOGLOW no Brasil, incluindo as Rúbricas de Avaliação e o Livro de Regras do Desafio do Robô em português.',
    source_url: 'https://cni.portaldaindustria.com.br/documents/492877/4724595/02+R%C3%BAbricas.pdf',
    published_at: '2026-08-01T12:00:00Z',
    is_critical: true,
    region: 'NACIONAL'
  },
  {
    id: 'fll-brasil-nacional-etapas-2026',
    competition: 'FLL',
    modality: 'Challenge',
    title: 'Calendário das Etapas Regionais e Festival Nacional SESI de Robótica',
    summary: 'Publicação do cronograma de etapas classificatórias regionais e festival nacional para equipes brasileiras participantes da temporada.',
    source_url: 'https://www.firstlegoleague.com.br',
    published_at: '2026-08-20T10:00:00Z',
    is_critical: false,
    region: 'NACIONAL'
  },

  // ── OBR ─────────────────────────────────────────────────────────────────
  {
    id: 'obr-sp-estadual-resgate-2026',
    competition: 'OBR',
    modality: 'Resgate',
    title: 'Definição da Sede e Datas da Etapa Estadual de São Paulo OBR 2026',
    summary: 'Comitê organizador da OBR São Paulo confirmou o local, logística de montagem de pistas e cronograma da fase estadual paulista.',
    source_url: 'https://obr.robocup.org.br/wp-content/uploads/2026/07/OBR2026_REGIONAL_ESTADUAL_MANUAL-DE-REGRAS-E-INSTRUCOES_v1.2.pdf',
    published_at: '2026-08-10T11:00:00Z',
    is_critical: true,
    region: 'SP'
  },
  {
    id: 'obr-resgate-manual-estadual-v12-2026',
    competition: 'OBR',
    modality: 'Resgate',
    title: 'Publicação do Manual de Regras da Modalidade Resgate Regional/Estadual v1.2',
    summary: 'Organização da OBR publica revisão com esclarecimentos sobre regras de pontuação na arena e desafios para Nível 1 e Nível 2.',
    source_url: 'https://obr.robocup.org.br/wp-content/uploads/2026/07/OBR2026_REGIONAL_ESTADUAL_MANUAL-DE-REGRAS-E-INSTRUCOES_v1.2.pdf',
    published_at: '2026-07-15T15:00:00Z',
    is_critical: true,
    region: 'NACIONAL'
  },
  {
    id: 'obr-resgate-nacional-manual-2026',
    competition: 'OBR',
    modality: 'Resgate',
    title: 'Manual de Regras e Instruções da Etapa Nacional de Resgate 2026',
    summary: 'Disponibilização do regulamento unificado para as equipes finalistas da fase nacional da OBR.',
    source_url: 'https://obr.robocup.org.br/wp-content/uploads/2026/10/OBR2026_NACIONAL_MANUAL-DE-REGRAS-E-INSTRUCOES_RESGATE.pdf',
    published_at: '2026-10-01T18:00:00Z',
    is_critical: false,
    region: 'NACIONAL'
  },
  {
    id: 'obr-artistica-nacional-pontuacao-2026',
    competition: 'OBR',
    modality: 'Artística',
    title: 'Divulgação das Fichas de Pontuação e Rubricas de Robótica Artística Nacional v2',
    summary: 'Critérios de avaliação de performance de palco, entrevista técnica com juízes e tabela detalhada de pontuação.',
    source_url: 'https://obr.robocup.org.br/wp-content/uploads/2026/10/Pontuacao-OBR-Pratica-Artisica-NACIONAL-2026_v2-1.pdf',
    published_at: '2026-10-10T14:00:00Z',
    is_critical: true,
    region: 'NACIONAL'
  },
  {
    id: 'obr-simulacao-manuais-2026',
    competition: 'OBR',
    modality: 'Simulação',
    title: 'Disponibilização dos Manuais de Simulação Estadual e Nacional',
    summary: 'Guias de instalação do simulador oficial, configuração de sensores virtuais e pistas de resgate em ambiente digital.',
    source_url: 'https://obr.robocup.org.br/modalidade-pratica/',
    published_at: '2026-10-15T11:00:00Z',
    is_critical: false,
    region: 'NACIONAL'
  },
  {
    id: 'obr-teorica-manuais-estudos-2026',
    competition: 'OBR',
    modality: 'Teórica',
    title: 'Manuais de Estudos e Aplicação para Provas Teóricas OBR',
    summary: 'Ementas completas com conteúdos recomendados e manual do professor aplicador para todos os níveis escolares.',
    source_url: 'https://obr.robocup.org.br/modalidade-teorica/',
    published_at: '2026-05-20T09:00:00Z',
    is_critical: false,
    region: 'NACIONAL'
  }
];
