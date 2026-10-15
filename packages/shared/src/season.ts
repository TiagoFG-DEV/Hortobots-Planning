export type SeasonMission = {
  id: string;
  name: string;
  minimum: number;
  maximum: number;
  scoring: string[];
  shared?: boolean;
  losable?: boolean;
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
    { id: 'M02', name: 'Exploding Seeds', minimum: 10, maximum: 40, scoring: ['Sementes fora do caule: 10 cada'] },
    { id: 'M03', name: 'Flip the Rock', minimum: 20, maximum: 30, scoring: ['Bandeira de pesquisa abaixada: 20', 'Rocha na posição inicial: +10'] },
    { id: 'M04', name: 'Lucky Leaves', minimum: 10, maximum: 30, scoring: ['Uma folha removida: 10', 'Segunda folha removida e esperança na posição: +20', 'Esperança fora do habitat ao final: 0 na missão'], losable: true },
    { id: 'M05', name: 'Reaching Roots', minimum: 10, maximum: 20, scoring: ['Raiz parcialmente estendida: 10', 'Ou completamente estendida: 20'] },
    { id: 'M06', name: 'Leafcutter Frenzy', minimum: 10, maximum: 40, scoring: ['Formiga tocando o ninho e fragmentos contidos: 10 por fragmento'] },
    { id: 'M07', name: 'Humongous Fungus', minimum: 20, maximum: 30, scoring: ['Micélio completamente estendido: 20', 'Conexão com a raiz adversária: +10 (duas bonificações são possíveis no conjunto das duas equipes)'], shared: true },
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
