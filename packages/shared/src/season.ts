export type SeasonMission = {
  id: string;
  name: string;
  minimum: number;
  maximum: number;
  scoring: string[];
  shared?: boolean;
  losable?: boolean;
};

export type MissionRuleField = {
  id: string;
  label: string;
  type: 'boolean' | 'number' | 'select';
  pointsPerUnit?: number;
  max?: number;
  min?: number;
  options?: Array<{ label: string; value: number }>;
};

export type MissionScoringRule = {
  id: string;
  name: string;
  maximum: number;
  description: string;
  fields: MissionRuleField[];
  calculate: (values: Record<string, any>) => number;
};

export const BIOGLOW_SEASON = {
  id: 'fll-2026-2027-bioglow',
  competition: 'FIRST LEGO League Challenge',
  name: 'BIOGLOW',
  cycle: '2026/2027',
  maximumScore: 530,
  equipmentInspectionPoints: 20,
  precisionTokens: [
    { remaining: 0, points: 0 },
    { remaining: 1, points: 10 },
    { remaining: 2, points: 15 },
    { remaining: 3, points: 25 },
    { remaining: 4, points: 35 },
    { remaining: 5, points: 50 },
    { remaining: 6, points: 50 }
  ],
  missions: [
    { id: 'M01', name: 'Drone Survey', minimum: 20, maximum: 30, scoring: ['Drone fora do tapete: 20', 'Bônus LiDAR e marcador na área: +10'] },
    { id: 'M02', name: 'Exploding Seeds', minimum: 10, maximum: 30, scoring: ['Sementes fora do caule: 10 cada (máx 3 sementes)'] },
    { id: 'M03', name: 'Flip the Rock', minimum: 20, maximum: 30, scoring: ['Bandeira de pesquisa abaixada: 20', 'Rocha na posição inicial: +10'] },
    { id: 'M04', name: 'Lucky Leaves', minimum: 10, maximum: 30, scoring: ['Uma folha removida: 10', 'Segunda folha removida e esperança na posição: +20', 'Esperança fora do habitat ao final: 0 na missão'], losable: true },
    { id: 'M05', name: 'Reaching Roots', minimum: 10, maximum: 20, scoring: ['Raiz parcialmente estendida: 10', 'Ou completamente estendida: 20'] },
    { id: 'M06', name: 'Leafcutter Frenzy', minimum: 10, maximum: 40, scoring: ['Formiga tocando o ninho e fragmentos contidos: 10 por fragmento'] },
    { id: 'M07', name: 'Humongous Fungus', minimum: 20, maximum: 40, scoring: ['Micélio completamente estendido: 20', 'Conexão com a raiz adversária: +10 cada (máx 2 bonificações = +20)'], shared: true },
    { id: 'M08', name: 'Tangled', minimum: 30, maximum: 30, scoring: ['Trepadeira tocando o tapete: 30'] },
    { id: 'M09', name: 'Research Platform', minimum: 10, maximum: 30, scoring: ['Plataforma elevada: 10', 'Câmera acionada: 10', 'Semente fora da árvore: 10'] },
    { id: 'M10', name: 'Fragile Microhabitats', minimum: 10, maximum: 20, scoring: ['Habitat da aranha na posição inicial: 10', 'Habitat do caracol na posição inicial: 10'], losable: true },
    { id: 'M11', name: 'Window to the Past', minimum: 20, maximum: 20, scoring: ['Cobertura da raiz abaixada e tocando o tapete: 20'] },
    { id: 'M12', name: 'Forest Elder', minimum: 20, maximum: 30, scoring: ['Bengala elevada e tocando a árvore: 20', 'Amarra ao redor do poste: 10'] },
    { id: 'M13', name: 'Keystone Species', minimum: 30, maximum: 30, scoring: ['Espécie-chave na plataforma e árvores elevadas: 30'] },
    { id: 'M14', name: 'Seeds of Renewal', minimum: 5, maximum: 40, scoring: ['Sementes na estação: 5 cada', 'Cada semente tocando o tapete: +5'] },
    { id: 'M15', name: 'Biocentric Architecture', minimum: 10, maximum: 40, scoring: ['Cobertura, claraboia e compostagem: 10 cada', 'Bônus ambiental da doca: +10'] }
  ] satisfies SeasonMission[],
  officialRulebookUrl: 'https://firstinspires.blob.core.windows.net/fll/challenge/2026-27/fll-challenge-bioglow-rgr.pdf',
  officialUpdatesUrl: 'https://firstinspires.blob.core.windows.net/fll/challenge/2026-27/fll-challenge-bioglow-updates.pdf',
  verifiedAt: '2026-10-14'
} as const;

export const BIOGLOW_SCORING_RULES: Record<string, MissionScoringRule> = {
  M01: {
    id: 'M01',
    name: 'Drone Survey',
    maximum: 30,
    description: 'Drone fora do tapete e bônus do mapa LiDAR',
    fields: [
      { id: 'droneLifted', label: 'Drone fora do tapete (elevado/sustentado)', type: 'boolean' },
      { id: 'lidarBonus', label: 'Bônus: Mapa LiDAR invertido com marcador na área de pesquisa', type: 'boolean' }
    ],
    calculate: (v) => {
      let pts = 0;
      if (v.droneLifted) pts += 20;
      if (v.droneLifted && v.lidarBonus) pts += 10;
      return pts;
    }
  },
  M02: {
    id: 'M02',
    name: 'Exploding Seeds',
    maximum: 30,
    description: 'Sementes ejetadas fora do caule (máximo 3 sementes)',
    fields: [
      { id: 'seedsCount', label: 'Sementes fora do caule (10 pts cada, máx 3)', type: 'number', min: 0, max: 3, pointsPerUnit: 10 }
    ],
    calculate: (v) => {
      const count = Math.max(0, Math.min(3, Number(v.seedsCount) || 0));
      return count * 10;
    }
  },
  M03: {
    id: 'M03',
    name: 'Flip the Rock',
    maximum: 30,
    description: 'Bandeira de pesquisa e rocha na posição inicial',
    fields: [
      { id: 'flagDown', label: 'Bandeira de pesquisa abaixada', type: 'boolean' },
      { id: 'rockResetBonus', label: 'Bônus: Rocha voltada à posição inicial (sem rastros)', type: 'boolean' }
    ],
    calculate: (v) => {
      let pts = 0;
      if (v.flagDown) pts += 20;
      if (v.flagDown && v.rockResetBonus) pts += 10;
      return pts;
    }
  },
  M04: {
    id: 'M04',
    name: 'Lucky Leaves',
    maximum: 30,
    description: 'Remoção de folhas mantendo a esperança (katydid) no habitat',
    fields: [
      {
        id: 'leavesState',
        label: 'Estado das folhas removidas',
        type: 'select',
        options: [
          { label: 'Nenhuma folha removida (0 pts)', value: 0 },
          { label: 'Uma folha removida (10 pts)', value: 10 },
          { label: 'Duas folhas removidas e esperança na posição (30 pts)', value: 30 }
        ]
      },
      { id: 'katydidDisplaced', label: 'Penalidade: Esperança perturbada/fora do habitat (zera a missão)', type: 'boolean' }
    ],
    calculate: (v) => {
      if (v.katydidDisplaced) return 0;
      return Number(v.leavesState) || 0;
    }
  },
  M05: {
    id: 'M05',
    name: 'Reaching Roots',
    maximum: 20,
    description: 'Extensão das raízes na arena',
    fields: [
      {
        id: 'extensionState',
        label: 'Extensão da raiz',
        type: 'select',
        options: [
          { label: 'Não estendida (0 pts)', value: 0 },
          { label: 'Parcialmente estendida (10 pts)', value: 10 },
          { label: 'Completamente estendida (20 pts)', value: 20 }
        ]
      }
    ],
    calculate: (v) => Number(v.extensionState) || 0
  },
  M06: {
    id: 'M06',
    name: 'Leafcutter Frenzy',
    maximum: 40,
    description: 'Formiga no ninho e fragmentos contidos',
    fields: [
      { id: 'antTouchingNest', label: 'Formiga tocando a área do ninho', type: 'boolean' },
      { id: 'fragmentsCount', label: 'Fragmentos de folha contidos (10 pts cada)', type: 'number', min: 0, max: 4, pointsPerUnit: 10 }
    ],
    calculate: (v) => {
      if (!v.antTouchingNest) return 0;
      const count = Math.max(0, Math.min(4, Number(v.fragmentsCount) || 0));
      return count * 10;
    }
  },
  M07: {
    id: 'M07',
    name: 'Humongous Fungus',
    maximum: 40,
    description: 'Micélio estendido e conexões compartilhadas com a raiz adversária',
    fields: [
      { id: 'myceliumExtended', label: 'Micélio completamente estendido (20 pts)', type: 'boolean' },
      { id: 'sharedConnections', label: 'Bônus Compartilhado: Conexões com raiz adversária (+10 pts cada, máx 2)', type: 'number', min: 0, max: 2, pointsPerUnit: 10 }
    ],
    calculate: (v) => {
      let pts = 0;
      if (v.myceliumExtended) {
        pts += 20;
        const count = Math.max(0, Math.min(2, Number(v.sharedConnections) || 0));
        pts += count * 10;
      }
      return pts;
    }
  },
  M08: {
    id: 'M08',
    name: 'Tangled',
    maximum: 30,
    description: 'Trepadeira liberada tocando o tapete',
    fields: [
      { id: 'vineTouchingMat', label: 'Trepadeira caída tocando o tapete (30 pts)', type: 'boolean' }
    ],
    calculate: (v) => (v.vineTouchingMat ? 30 : 0)
  },
  M09: {
    id: 'M09',
    name: 'Research Platform',
    maximum: 30,
    description: 'Plataforma, câmera e dispersão de semente',
    fields: [
      { id: 'platformRaised', label: 'Plataforma elevada (10 pts)', type: 'boolean' },
      { id: 'cameraTriggered', label: 'Câmera de pesquisa acionada (10 pts)', type: 'boolean' },
      { id: 'seedDropped', label: 'Semente retirada da árvore (10 pts)', type: 'boolean' }
    ],
    calculate: (v) => {
      let pts = 0;
      if (v.platformRaised) pts += 10;
      if (v.cameraTriggered) pts += 10;
      if (v.seedDropped) pts += 10;
      return pts;
    }
  },
  M10: {
    id: 'M10',
    name: 'Fragile Microhabitats',
    maximum: 20,
    description: 'Preservação dos habitats da aranha e do caracol',
    fields: [
      { id: 'spiderHabitatSafe', label: 'Habitat da aranha na posição inicial (10 pts)', type: 'boolean' },
      { id: 'snailHabitatSafe', label: 'Habitat do caracol na posição inicial (10 pts)', type: 'boolean' }
    ],
    calculate: (v) => {
      let pts = 0;
      if (v.spiderHabitatSafe) pts += 10;
      if (v.snailHabitatSafe) pts += 10;
      return pts;
    }
  },
  M11: {
    id: 'M11',
    name: 'Window to the Past',
    maximum: 20,
    description: 'Cobertura da raiz abaixada tocando o tapete',
    fields: [
      { id: 'rootCoverLowered', label: 'Cobertura da raiz abaixada tocando o tapete (20 pts)', type: 'boolean' }
    ],
    calculate: (v) => (v.rootCoverLowered ? 20 : 0)
  },
  M12: {
    id: 'M12',
    name: 'Forest Elder',
    maximum: 30,
    description: 'Bengala elevada tocando a árvore e amarra no poste',
    fields: [
      { id: 'caneRaised', label: 'Bengala elevada tocando a árvore (20 pts)', type: 'boolean' },
      { id: 'tieAroundPost', label: 'Bônus: Amarra colocada ao redor do poste (+10 pts)', type: 'boolean' }
    ],
    calculate: (v) => {
      let pts = 0;
      if (v.caneRaised) pts += 20;
      if (v.caneRaised && v.tieAroundPost) pts += 10;
      return pts;
    }
  },
  M13: {
    id: 'M13',
    name: 'Keystone Species',
    maximum: 30,
    description: 'Espécie-chave na plataforma com árvores elevadas',
    fields: [
      { id: 'keystoneInPlace', label: 'Espécie-chave na plataforma com árvores elevadas (30 pts)', type: 'boolean' }
    ],
    calculate: (v) => (v.keystoneInPlace ? 30 : 0)
  },
  M14: {
    id: 'M14',
    name: 'Seeds of Renewal',
    maximum: 40,
    description: 'Sementes na estação de renovação e em contato com o tapete',
    fields: [
      { id: 'seedsInStation', label: 'Sementes na estação (5 pts cada)', type: 'number', min: 0, max: 4, pointsPerUnit: 5 },
      { id: 'seedsTouchingMat', label: 'Sementes tocando o tapete (+5 pts cada)', type: 'number', min: 0, max: 4, pointsPerUnit: 5 }
    ],
    calculate: (v) => {
      const inStation = Math.max(0, Math.min(4, Number(v.seedsInStation) || 0));
      const onMat = Math.max(0, Math.min(4, Number(v.seedsTouchingMat) || 0));
      return inStation * 5 + onMat * 5;
    }
  },
  M15: {
    id: 'M15',
    name: 'Biocentric Architecture',
    maximum: 40,
    description: 'Cobertura, claraboia, compostagem e bônus ambiental da doca',
    fields: [
      { id: 'roofInPlace', label: 'Cobertura instalada (10 pts)', type: 'boolean' },
      { id: 'skylightInPlace', label: 'Claraboia instalada (10 pts)', type: 'boolean' },
      { id: 'compostInPlace', label: 'Compostagem instalada (10 pts)', type: 'boolean' },
      { id: 'dockBonus', label: 'Bônus ambiental da doca (+10 pts)', type: 'boolean' }
    ],
    calculate: (v) => {
      let pts = 0;
      if (v.roofInPlace) pts += 10;
      if (v.skylightInPlace) pts += 10;
      if (v.compostInPlace) pts += 10;
      if (pts > 0 && v.dockBonus) pts += 10;
      return pts;
    }
  }
};

export const calculatePrecisionPoints = (remainingTokens: number): number => {
  const token = BIOGLOW_SEASON.precisionTokens.find(t => t.remaining === remainingTokens);
  if (token) return token.points;
  if (remainingTokens >= 6) return 50;
  if (remainingTokens <= 0) return 0;
  return 0;
};

export const OBR_2026_SCORING = {
  id: 'obr-2026-resgate',
  competition: 'Olimpíada Brasileira de Robótica',
  name: 'Robótica de Resgate',
  cycle: '2026',
  maximumScore: null,
  maximumScoreReason: 'A pontuação máxima varia conforme a composição da arena, mantendo-se equivalente entre arenas do mesmo nível e fase.',
  officialRulesUrl: 'https://obr.robocup.org.br/wp-content/uploads/2026/07/OBR2026_REGIONAL_ESTADUAL_MANUAL-DE-REGRAS-E-INSTRUCOES_v1.2.pdf',
  verifiedAt: '2026-10-14'
} as const;

export const performancePercent = (score: number, maximum: number) =>
  maximum > 0 ? Math.max(0, Math.min(100, (score / maximum) * 100)) : 0;

export type AttemptMission = {
  missionId: string;
  name?: string;
  score: number;
  maxScore: number;
  answers?: Record<string, any>;
};

export const getSeasonMission = (missionId: string): SeasonMission | undefined =>
  BIOGLOW_SEASON.missions.find(m => m.id.toUpperCase() === missionId.toUpperCase());

export const getMissionMaxScore = (missionId: string): number => {
  const mission = getSeasonMission(missionId);
  return mission ? mission.maximum : 0;
};

export const calculateMissionAssertiveness = (score: number, maxScore: number): number => {
  if (maxScore <= 0) return 0;
  return Math.max(0, Math.min(100, (score / maxScore) * 100));
};
