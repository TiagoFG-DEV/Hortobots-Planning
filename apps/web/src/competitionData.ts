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
  {
    id: 'fll-challenge-bioglow-rubrics-color',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: 'FLL Challenge BIOGLOW - Rubricas de Avaliação (Colorido)',
    description: 'Rubricas oficiais completas de avaliação para as categorias Design do Robô, Projeto de Inovação e Core Values.',
    url_oficial: 'https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt45dc1a63e501317c/6a6afa45e5cfc84cfeba0b41/fll-challenge-bioglow-rubrics-color.pdf?locale=en-us',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'fll-challenge-bioglow-rubrics-gray',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: 'FLL Challenge BIOGLOW - Rubricas de Avaliação (Escala de Cinza)',
    description: 'Versão otimizada para impressão monocromática das rubricas de avaliação oficial da temporada.',
    url_oficial: 'https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt8748f36c38c979d0/6a6afa45aacc0d9ecb0b1dd7/fll-challenge-bioglow-rubrics-grayscale.pdf?locale=en-us',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'fll-future-rubric',
    competition: 'FLL',
    modality: 'Future',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: 'FLL Future Edition - Rubricas de Julgamento',
    description: 'Guia de julgamento e rubricas oficiais para categorias e faixas etárias complementares FLL Future.',
    url_oficial: 'https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt1b8554fe4725d8ab/6a69a0038e0e241a1a7177cd/fll-future-3-8-judging-rubric.pdf?locale=en-us',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'fll-explore-reviewing-doc',
    competition: 'FLL',
    modality: 'Explore',
    season_year: '2026/2027',
    doc_type: 'rubrica',
    title: 'FLL Explore BIOGLOW - Documentos de Revisão e Avaliação',
    description: 'Formulário oficial preenchível para sessão de revisão da temporada FLL Explore BIOGLOW.',
    url_oficial: 'https://assets.education.lego.com/v3/assets/blt293eea581807678a/blta679aa3b57f62751/6a6c6fd7e5cfc8e90cba13d6/fll-explore-bioglow-reviewing-documents-fillable.pdf?locale=en-us',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'fll-sp-regional-manual-2026',
    competition: 'FLL',
    modality: 'Challenge',
    season_year: '2026/2027',
    doc_type: 'regras',
    title: 'Torneio Regional SESI-SP de Robótica - Manual e Diretrizes Estado de São Paulo',
    description: 'Diretrizes oficiais, calendário das seletivas regionais do Estado de São Paulo e critérios de classificação para o Festival Nacional.',
    url_oficial: 'https://www.sesisp.org.br/educacao/torneio-de-robotica',
    is_current: true,
    is_fallback: false,
    region: 'SP'
  },
  {
    id: 'obr-resgate-estadual-sp-2026',
    competition: 'OBR',
    modality: 'Resgate',
    season_year: '2026',
    doc_type: 'regras',
    title: 'OBR Resgate - Manual de Regras e Instruções (Regional e Estadual SP)',
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
    title: 'OBR Resgate - Manual de Regras e Instruções (Etapa Nacional)',
    description: 'Manual de regras unificado e instruções para as finais nacionais da modalidade Resgate.',
    url_oficial: 'https://obr.robocup.org.br/wp-content/uploads/2026/10/OBR2026_NACIONAL_MANUAL-DE-REGRAS-E-INSTRUCOES_RESGATE.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'obr-artistica-estadual-sp-2026',
    competition: 'OBR',
    modality: 'Artística',
    season_year: '2026',
    doc_type: 'regras',
    title: 'OBR Robótica Artística - Manual de Regras (Regional / Estadual SP)',
    description: 'Diretrizes, categorias e regras para apresentação de Robótica Artística na etapa Regional e Estadual de São Paulo.',
    url_oficial: 'https://obr.robocup.org.br/wp-content/uploads/2026/03/2026-Manual-de-Regras-e-Instrucoes-Regional_Estadual-Robotica-Artistica.pptx.pdf',
    is_current: true,
    is_fallback: false,
    region: 'SP'
  },
  {
    id: 'obr-artistica-pontuacao-2026',
    competition: 'OBR',
    modality: 'Artística',
    season_year: '2026',
    doc_type: 'rubrica',
    title: 'OBR Robótica Artística - Tabela de Pontuação e Avaliação Nacional',
    description: 'Critérios de pontuação prática, avaliação de performance artística e rubricas da etapa nacional.',
    url_oficial: 'https://obr.robocup.org.br/wp-content/uploads/2026/10/Pontuacao-OBR-Pratica-Artisica-NACIONAL-2026_v2-1.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'obr-simulacao-estadual-sp-2026',
    competition: 'OBR',
    modality: 'Simulação',
    season_year: '2026',
    doc_type: 'regras',
    title: 'OBR Simulação - Manual de Regras (Estadual SP)',
    description: 'Manual completo e instruções do ambiente de simulação para a etapa estadual de São Paulo da OBR.',
    url_oficial: 'https://obr.robocup.org.br/wp-content/uploads/2026/10/OBR2026-Manual-de-Regras-e-Instrucoes-Estadual-Simulacao_compressed.pdf',
    is_current: true,
    is_fallback: false,
    region: 'SP'
  },
  {
    id: 'obr-simulacao-nacional-2026',
    competition: 'OBR',
    modality: 'Simulação',
    season_year: '2026',
    doc_type: 'regras',
    title: 'OBR Simulação - Manual de Regras (Nacional)',
    description: 'Regulamento e desafios avançados da etapa nacional de simulação OBR.',
    url_oficial: 'https://obr.robocup.org.br/wp-content/uploads/2026/10/OBR2026-Manual-de-Regras-e-Instrucoes-Nacional-Simulacao_compressed.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'obr-teorica-manual-estudos-2026',
    competition: 'OBR',
    modality: 'Teórica',
    season_year: '2026',
    doc_type: 'complementar',
    title: 'OBR Modalidade Teórica - Manual de Estudos',
    description: 'Material de estudos, ementas e orientações para as provas teóricas da OBR em todos os níveis.',
    url_oficial: 'https://obr.robocup.org.br/wp-content/uploads/2026/05/OBR2026_MT_Manual-de-Estudos.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'obr-teorica-manual-aplicacao-2026',
    competition: 'OBR',
    modality: 'Teórica',
    season_year: '2026',
    doc_type: 'complementar',
    title: 'OBR Modalidade Teórica - Manual de Aplicação',
    description: 'Instruções para escolas e aplicadores sobre realização e envio das avaliações teóricas.',
    url_oficial: 'https://obr.robocup.org.br/wp-content/uploads/2026/05/OBR2026_MT_Manual-de-Aplicacao.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  },
  {
    id: 'obr-teorica-manual-inscricao-2026',
    competition: 'OBR',
    modality: 'Teórica',
    season_year: '2026',
    doc_type: 'complementar',
    title: 'OBR Modalidade Teórica - Manual de Inscrição',
    description: 'Passo a passo para registro de estudantes e instituições no sistema Olimpo para a modalidade teórica.',
    url_oficial: 'https://obr.robocup.org.br/wp-content/uploads/2026/03/OBR2026_MT_Manual-de-Inscricao.pdf',
    is_current: true,
    is_fallback: false,
    region: 'NACIONAL'
  }
];

export const INITIAL_OFFICIAL_UPDATES: CompetitionUpdate[] = [
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
    source_url: 'https://education.lego.com/en-us/first-lego-league/season-materials/',
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

