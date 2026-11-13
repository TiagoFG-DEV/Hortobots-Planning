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
  // ── FLL – Rubricas (PT-BR primeiro) ───────────────────────────────────────
  {
    id: 'fll-challenge-bioglow-rubrics-color-ptbr',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: 'FLL Challenge BIOGLOW – Rubricas de Avaliação (Colorido) PT-BR',
    description: 'Rubricas oficiais completas de avaliação para as categorias Design do Robô, Projeto de Inovação e Core Values – versão em Português do Brasil.',
    url_oficial: 'https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt45dc1a63e501317c/6a6afa45e5cfc84cfeba0b41/fll-challenge-bioglow-rubrics-color.pdf?locale=pt-br',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'fll-challenge-bioglow-rubrics-color-en',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: 'FLL Challenge BIOGLOW – Rubrics of Evaluation (Color) EN',
    description: 'Official full judging rubrics for Robot Design, Innovation Project and Core Values – English version (fallback).',
    url_oficial: 'https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt45dc1a63e501317c/6a6afa45e5cfc84cfeba0b41/fll-challenge-bioglow-rubrics-color.pdf?locale=en-us',
    is_current: true,
    is_fallback: true,
    region: 'NACIONAL'
  },
  {
    id: 'fll-challenge-bioglow-rubrics-gray-ptbr',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: 'FLL Challenge BIOGLOW – Rubricas de Avaliação (Escala de Cinza) PT-BR',
    description: 'Versão otimizada para impressão monocromática das rubricas de avaliação oficial da temporada – Português do Brasil.',
    url_oficial: 'https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt8748f36c38c979d0/6a6afa45aacc0d9ecb0b1dd7/fll-challenge-bioglow-rubrics-grayscale.pdf?locale=pt-br',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'fll-future-rubric-ptbr',
    competition: 'FLL',
    modality: 'Future',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: 'FLL Future Edition – Rubricas de Julgamento PT-BR',
    description: 'Guia de julgamento e rubricas oficiais para categorias e faixas etárias complementares FLL Future – Português do Brasil.',
    url_oficial: 'https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt1b8554fe4725d8ab/6a69a0038e0e241a1a7177cd/fll-future-3-8-judging-rubric.pdf?locale=pt-br',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'fll-explore-reviewing-doc-ptbr',
    competition: 'FLL',
    modality: 'Explore',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: 'FLL Explore BIOGLOW – Documentos de Revisão e Avaliação PT-BR',
    description: 'Formulário oficial preenchível para sessão de revisão da temporada FLL Explore BIOGLOW – Português do Brasil.',
    url_oficial: 'https://assets.education.lego.com/v3/assets/blt293eea581807678a/blta679aa3b57f62751/6a6c6fd7e5cfc8e90cba13d6/fll-explore-bioglow-reviewing-documents-fillable.pdf?locale=pt-br',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },

  // ── FLL – Regras / Manuais ─────────────────────────────────────────────────
  {
    id: 'fll-sp-regional-manual-2026',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'regras',
    title: 'Torneio Regional SESI-SP de Robótica – Manual e Diretrizes Estado de São Paulo',
    description: 'Diretrizes oficiais, calendário das seletivas regionais do Estado de São Paulo e critérios de classificação para o Festival Nacional.',
    url_oficial: 'https://www.sesisp.org.br/educacao/torneio-de-robotica',
    is_current: true,
    is_fallback: false,
    region: 'SP'
  },
  {
    id: 'fll-challenge-bioglow-game-manual-ptbr',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'regras',
    title: 'FLL Challenge BIOGLOW – Manual Oficial do Jogo PT-BR',
    description: 'Regulamento completo das missões da mesa de jogo, pontuações e regras gerais da temporada BIOGLOW – Português do Brasil.',
    url_oficial: 'https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt45dc1a63e501317c/6a6afa45e5cfc84cfeba0b41/fll-challenge-bioglow-rubrics-color.pdf?locale=pt-br',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },

  // ── OBR – Regras (já em PT-BR) ────────────────────────────────────────────
  {
    id: 'obr-resgate-estadual-sp-2026',
    competition: 'OBR',
    modality: 'Resgate',
    season_year: '2026',
    doc_type: 'regras',
    title: 'OBR Resgate – Manual de Regras e Instruções (Regional e Estadual SP)',
    description: 'Manual de regras e instruções oficiais para a etapa Regional e Estadual do Estado de São Paulo da modalidade Resgate (Níveis 1 e 2).',
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
    description: 'Manual de regras unificado e instruções para a etapa Nacional da modalidade Resgate, incluindo critérios de pontuação e arena padronizada.',
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
    title: 'OBR Robótica Artística – Fichas de Pontuação e Rubricas Nacional v2',
    description: 'Critérios de avaliação de performance de palco, entrevista técnica com juízes e tabela detalhada de pontuação.',
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
    description: 'Guias de instalação do simulador oficial, configuração de sensores virtuais e pistas de resgate em ambiente digital.',
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
    description: 'Ementas completas com conteúdos recomendados e manual do professor aplicador para todos os níveis escolares.',
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
    source_url: 'https://www.sesisp.org.br/educacao/torneio-de-robotica',
    published_at: '2026-09-05T14:30:00Z',
    is_critical: true,
    region: 'SP'
  },
  {
    id: 'fll-bioglow-season-launch-2026',
    competition: 'FLL',
    modality: 'Challenge',
    title: 'Lançamento Oficial da Temporada FLL BIOGLOW 2026/2027',
    summary: 'A FIRST LEGO League e a LEGO Education divulgaram os materiais oficiais da temporada BIOGLOW, incluindo rubricas de avaliação e cadernos de engenharia.',
    source_url: 'https://education.lego.com/pt-br/first-lego-league/season-materials/',
    published_at: '2026-08-01T12:00:00Z',
    is_critical: true,
    region: 'NACIONAL'
  },
  {
    id: 'fll-brasil-nacional-etapas-2026',
    competition: 'FLL',
    modality: 'Challenge',
    title: 'Calendário das Etapas Regionais e Festival Nacional SESI de Robótica',
    summary: 'Publicação do cronograma de etapas classificatórias regionais e nacionais para equipes brasileiras participantes da temporada.',
    source_url: 'https://www.firstlegoleague.com.br/nacional',
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
    source_url: 'https://obr.robocup.org.br/documentos-e-manuais/',
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
