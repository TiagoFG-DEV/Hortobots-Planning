import {
  Circle,
  Document,
  G,
  Image,
  Line,
  Page,
  Polyline,
  StyleSheet,
  Svg,
  Text,
  View,
  pdf
} from '@react-pdf/renderer';
import {
  BIOGLOW_SEASON,
  calculateMissionAssertiveness,
  calculatePrecisionPoints,
  getMissionMaxScore
} from '@hortobots/shared';
import fllTeamLogo from './assets/originals/fll_team_logo.png';
import obrTeamLogo from './assets/originals/obr_team_logo.png';
import underTeamLogo from './assets/originals/underconstruction_logo.png';
import fllCompetitionLogo from './assets/originals/fll_logo.png';
import obrCompetitionLogo from './assets/originals/obr_logo.png';

type TeamKey = 'fll' | 'under' | 'obr';
type ActivityKind = 'record' | 'test';
type PreparedMedia = { name: string; source: string; video: boolean };
type AttemptMission = { missionId: string; name?: string; score: number; maxScore: number };
type Attempt = {
  time?: number;
  score?: number;
  failures?: number;
  observed?: number;
  inspectionBonus?: boolean;
  precisionTokensRemaining?: number;
  missions?: AttemptMission[];
};

type GenerateActivityPdfOptions = {
  item: Record<string, any>;
  kind: ActivityKind;
  team: TeamKey;
  resolveMediaUrl: (media: Record<string, any>) => string;
};

const TEAM = {
  fll: {
    label: 'SESI Hortobots',
    competition: 'FIRST LEGO League Challenge',
    primary: '#2b8d35',
    secondary: '#82b74b',
    ink: '#15351b',
    teamLogo: fllTeamLogo,
    competitionLogo: fllCompetitionLogo
  },
  under: {
    label: 'Under Construction',
    competition: 'FIRST LEGO League Challenge',
    primary: '#c4117d',
    secondary: '#6b2ca0',
    ink: '#32113a',
    teamLogo: underTeamLogo,
    competitionLogo: fllCompetitionLogo
  },
  obr: {
    label: 'Hortobots OBR',
    competition: 'Olimpíada Brasileira de Robótica',
    primary: '#b51e16',
    secondary: '#d2a83e',
    ink: '#32150f',
    teamLogo: obrTeamLogo,
    competitionLogo: obrCompetitionLogo
  }
} as const;

// Paleta com alto contraste sobre papel claro no PDF
const ROUND_PDF_COLORS = [
  '#0891b2', // Ciano escuro
  '#7c3aed', // Roxo
  '#d97706', // Âmbar escuro
  '#059669', // Esmeralda
  '#e11d48', // Carmim
  '#0284c7', // Azul royal
  '#ea580c', // Laranja
  '#c026d3', // Fúcsia
  '#65a30d', // Lima escuro
  '#4f46e5'  // Índigo
];

const AVG_PDF_COLOR = '#b45309';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#f7f3e9',
    color: '#20251f',
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    paddingTop: 92,
    paddingBottom: 52,
    paddingHorizontal: 42
  },
  topBand: { position: 'absolute', top: 0, left: 0, right: 0, height: 14 },
  bottomBand: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 9 },
  marginRule: { position: 'absolute', top: 84, bottom: 24, left: 30, width: 0.8, opacity: 0.22 },
  header: {
    position: 'absolute',
    top: 22,
    left: 42,
    right: 42,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.2,
    paddingBottom: 8
  },
  logo: { width: 49, height: 42, objectFit: 'contain' },
  competitionLogo: { width: 62, height: 42, objectFit: 'contain' },
  headerCopy: { flexGrow: 1, paddingHorizontal: 12 },
  headerTeam: { fontFamily: 'Helvetica-Bold', fontSize: 13, textTransform: 'uppercase' },
  headerCompetition: { color: '#596057', fontSize: 8, marginTop: 3 },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 42,
    right: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#6b7069',
    fontSize: 7.5
  },
  eyebrow: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 21,
    lineHeight: 1.15,
    marginBottom: 8
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14
  },
  metaPill: {
    color: '#ffffff',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5
  },
  metaText: { color: '#565d54', fontSize: 8.5 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginBottom: 8
  },
  body: { fontSize: 9.5, lineHeight: 1.5 },
  highlight: {
    borderLeftWidth: 4,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    backgroundColor: '#fffdfa'
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { borderWidth: 0.8, borderRadius: 9, paddingVertical: 3, paddingHorizontal: 7, fontSize: 7.5 },

  // Cards de resumo com largura explícita (evita colapso de flexBasis: 0 no Yoga)
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  statCard: {
    width: '23.5%',
    backgroundColor: '#ffffff',
    borderRadius: 5,
    borderWidth: 0.8,
    borderColor: '#d9ddd6',
    paddingVertical: 9,
    paddingHorizontal: 8
  },
  statLabel: {
    color: '#687066',
    fontSize: 6.8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  statValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    lineHeight: 1.15
  },
  statSub: {
    color: '#687066',
    fontSize: 6.8,
    marginTop: 2
  },

  // Caixa de gráfico formal
  chartCard: {
    backgroundColor: '#ffffff',
    borderWidth: 0.8,
    borderColor: '#d9ddd6',
    borderRadius: 5,
    padding: 10,
    marginBottom: 12
  },
  chartTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
    fontSize: 7.5
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },

  // Tabelas formais
  attemptsTable: {
    borderWidth: 0.8,
    borderColor: '#cfd3cc',
    borderRadius: 4,
    overflow: 'hidden'
  },
  attemptRow: {
    flexDirection: 'row',
    minHeight: 20,
    alignItems: 'center',
    borderBottomWidth: 0.6,
    borderBottomColor: '#dfe2dc',
    paddingVertical: 3
  },
  attemptHeader: { color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  attemptCell: { paddingHorizontal: 5, textAlign: 'center', fontSize: 7.5 },

  // Box de aproveitamento oficial
  performanceBox: {
    backgroundColor: '#ffffff',
    borderWidth: 0.8,
    borderColor: '#d9ddd6',
    borderRadius: 5,
    padding: 10,
    marginBottom: 12
  },
  performanceKicker: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2
  },
  performanceSeasonTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 6
  },
  performanceNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6
  },
  performanceScoreBig: { fontFamily: 'Helvetica-Bold', fontSize: 18 },
  performanceScoreSub: { fontSize: 8.5, color: '#565d54' },
  progressBarBg: {
    height: 7,
    backgroundColor: '#e2e7df',
    borderRadius: 3.5,
    overflow: 'hidden',
    marginBottom: 6
  },
  progressBarFill: { height: 7, borderRadius: 3.5 },
  performanceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.8,
    color: '#687066'
  },

  // Cartão individual de Round Teste
  roundCard: {
    backgroundColor: '#ffffff',
    borderWidth: 0.8,
    borderColor: '#d4d9d1',
    borderLeftWidth: 4,
    borderRadius: 5,
    padding: 10,
    marginBottom: 12
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.8,
    borderBottomColor: '#e5e8e2',
    paddingBottom: 6,
    marginBottom: 8
  },
  roundHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  roundBadge: {
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8
  },
  roundBadgeText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#ffffff'
  },
  roundScoreText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12
  },
  roundMetaText: {
    fontSize: 8,
    color: '#565d54'
  },
  roundMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  roundMetricBox: {
    width: '32%',
    backgroundColor: '#f7f8f5',
    borderRadius: 4,
    borderWidth: 0.6,
    borderColor: '#dfe3dc',
    paddingVertical: 5,
    paddingHorizontal: 7
  },
  roundMissionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 6
  },
  roundMissionCell: {
    width: '32.2%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9faf7',
    borderWidth: 0.5,
    borderColor: '#e2e6de',
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 5,
    marginBottom: 4
  },

  // Mídias
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mediaCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 5,
    borderWidth: 0.8,
    borderColor: '#d8dcd5',
    padding: 6
  },
  mediaImage: { width: '100%', height: 145, objectFit: 'cover', borderRadius: 3 },
  mediaCaption: { marginTop: 5, fontSize: 7.5, color: '#535a51' },
  videoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    color: '#ffffff',
    backgroundColor: '#161616',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5
  },
  emptyMedia: { color: '#777d75', fontStyle: 'italic' }
});

const asNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

const isRoundTest = (item: Record<string, any>, team: TeamKey): boolean => {
  if (item.testMode === 'round') return true;
  if (item.testMode === 'individual') return false;
  const mod = String(item.modality || '').toUpperCase();
  const isFll = mod === 'FLL' || team === 'fll' || team === 'under';
  if (!isFll) return false;
  const attempts = Array.isArray(item.attempts) ? item.attempts : [];
  return !item.mission && attempts.some((a: any) => Array.isArray(a?.missions) && a.missions.length > 1);
};

const cleanFileName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'atividade';

const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo de imagem.'));
  reader.readAsDataURL(blob);
});

const canvasCover = (name: string, accent: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const context = canvas.getContext('2d');
  if (!context) return '';
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#171717');
  gradient.addColorStop(1, accent);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.moveTo(415, 165);
  context.lineTo(415, 375);
  context.lineTo(610, 270);
  context.closePath();
  context.fill();
  context.font = '600 30px Arial';
  context.textAlign = 'center';
  context.fillText(name.slice(0, 46), canvas.width / 2, 475);
  return canvas.toDataURL('image/jpeg', 0.86);
};

const imageToJpeg = async (url: string): Promise<string> => {
  if (!url) throw new Error('Imagem sem endereço.');
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) throw new Error(`Falha ao carregar imagem (${response.status}).`);
  const blob = await response.blob();
  if (blob.type === 'image/png' || blob.type === 'image/jpeg') return blobToDataUrl(blob);
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponível.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.88);
};

const captureVideoFrame = (url: string, name: string, accent: string): Promise<string> => new Promise(resolve => {
  if (!url) {
    resolve(canvasCover(name, accent));
    return;
  }
  const video = document.createElement('video');
  const finishWithFallback = () => {
    video.removeAttribute('src');
    video.load();
    resolve(canvasCover(name, accent));
  };
  const timer = window.setTimeout(finishWithFallback, 9000);
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.onerror = () => {
    window.clearTimeout(timer);
    finishWithFallback();
  };
  video.onloadeddata = () => {
    try {
      video.currentTime = Math.min(Math.max(video.duration * 0.08, 0.1), 2);
    } catch {
      window.clearTimeout(timer);
      finishWithFallback();
    }
  };
  video.onseeked = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 960;
      canvas.height = 540;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas indisponível.');
      const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
      const width = video.videoWidth * scale;
      const height = video.videoHeight * scale;
      context.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      window.clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    } catch {
      window.clearTimeout(timer);
      finishWithFallback();
    }
  };
  video.src = url;
});

const prepareMedia = async (
  media: Record<string, any>[],
  resolveMediaUrl: (media: Record<string, any>) => string,
  accent: string
): Promise<PreparedMedia[]> => Promise.all(media.map(async entry => {
  const name = String(entry.name || 'Mídia');
  const sourceUrl = entry.data || resolveMediaUrl(entry);
  const video = String(entry.type || '').startsWith('video') || /\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(sourceUrl) || /\.(mp4|webm|mov|ogg|m4v)$/i.test(name);
  if (video) return { name, source: await captureVideoFrame(sourceUrl, name, accent), video: true };
  try {
    return { name, source: await imageToJpeg(sourceUrl), video: false };
  } catch {
    return { name, source: canvasCover(name, accent), video: false };
  }
}));

const ActivityHeader = ({ team, teamLogo, competitionLogo }: { team: TeamKey; teamLogo: string; competitionLogo: string }) => {
  const identity = TEAM[team];
  return <>
    <View fixed style={[styles.topBand, { backgroundColor: identity.primary }]} />
    <View fixed style={[styles.bottomBand, { backgroundColor: identity.secondary }]} />
    <View fixed style={[styles.marginRule, { backgroundColor: identity.primary }]} />
    <View fixed style={[styles.header, { borderBottomColor: identity.secondary }]}>
      <Image style={styles.logo} src={teamLogo} />
      <View style={styles.headerCopy}>
        <Text style={[styles.headerTeam, { color: identity.ink }]}>{identity.label}</Text>
        <Text style={styles.headerCompetition}>{identity.competition} · SESI 437 Hortolândia</Text>
      </View>
      <Image style={styles.competitionLogo} src={competitionLogo} />
    </View>
    <View fixed style={styles.footer}>
      <Text>Hortobots Planning · Relatório Técnico Oficial</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  </>;
};

const PerformanceChart = ({ attempts, team }: { attempts: Attempt[]; team: TeamKey }) => {
  if (!attempts.length) return null;
  const identity = TEAM[team];
  const values = attempts.map(attempt => team === 'obr' ? asNumber(attempt.observed ?? attempt.score) : asNumber(attempt.score));
  const times = attempts.map(attempt => asNumber(attempt.time));
  const maxValue = Math.max(1, ...values);
  const maxTime = Math.max(1, ...times);

  const svgW = 455;
  const svgH = 120;
  const left = 8;
  const top = 8;
  const width = svgW - 16;
  const height = svgH - 16;

  const x = (index: number) => attempts.length === 1 ? left + width / 2 : left + (index * width) / (attempts.length - 1);
  const pointLine = (list: number[], max: number) => list.map((value, index) => `${x(index).toFixed(1)},${(top + height - (value / max) * height).toFixed(1)}`).join(' ');

  return (
    <View style={styles.chartCard} wrap={false}>
      <Text style={[styles.chartTitle, { color: identity.ink }]}>Evolução Geral — Pontuação vs Tempo</Text>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: identity.primary }]} />
          <Text>{team === 'obr' ? 'Valor observado' : 'Pontuação'} (máx: {maxValue})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: identity.secondary }]} />
          <Text>Tempo (máx: {maxTime}s)</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 28, height: svgH, justifyContent: 'space-between', paddingVertical: 4, alignItems: 'flex-end', paddingRight: 4 }}>
          <Text style={{ fontSize: 6.5, color: '#64748b' }}>100%</Text>
          <Text style={{ fontSize: 6.5, color: '#64748b' }}>50%</Text>
          <Text style={{ fontSize: 6.5, color: '#64748b' }}>0%</Text>
        </View>
        <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          {[0, 1, 2, 3, 4].map(step => (
            <Line
              key={step}
              x1={left}
              y1={top + (height * step) / 4}
              x2={left + width}
              y2={top + (height * step) / 4}
              stroke={step === 4 ? '#94a3b8' : '#dce0da'}
              strokeWidth={step === 4 ? 1 : 0.7}
            />
          ))}
          <Line x1={left} y1={top} x2={left} y2={top + height} stroke="#7c837a" strokeWidth={1} />
          {attempts.length > 1 && (
            <>
              <Polyline points={pointLine(values, maxValue)} fill="none" stroke={identity.primary} strokeWidth={2.2} />
              <Polyline points={pointLine(times, maxTime)} fill="none" stroke={identity.secondary} strokeWidth={1.8} strokeDasharray="4 3" />
            </>
          )}
          {values.map((value, index) => (
            <Circle key={`v-${index}`} cx={x(index)} cy={top + height - (value / maxValue) * height} r={3} fill={identity.primary} />
          ))}
          {times.map((value, index) => (
            <Circle key={`t-${index}`} cx={x(index)} cy={top + height - (value / maxTime) * height} r={2.5} fill={identity.secondary} />
          ))}
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', paddingLeft: 28, justifyContent: attempts.length === 1 ? 'center' : 'space-between', marginTop: 3 }}>
        {attempts.map((_, i) => (
          <Text key={i} style={{ fontSize: 6.5, color: '#475569', fontFamily: 'Helvetica-Bold' }}>#{i + 1}</Text>
        ))}
      </View>
    </View>
  );
};

// Gráfico de Assertividade por Missão (M01..M15) sem <Text> dentro do <Svg>
const PdfAssertivenessChart = ({
  missionIds,
  seriesList,
  avgSeries,
  height = 115,
  svgWidth = 445
}: {
  missionIds: string[];
  seriesList: Array<{ color: string; pts: Array<{ pct: number }> }>;
  avgSeries?: Array<{ pct: number }>;
  height?: number;
  svgWidth?: number;
}) => {
  const padL = 8;
  const padR = 8;
  const padT = 8;
  const padB = 8;
  const plotW = svgWidth - padL - padR;
  const plotH = height - padT - padB;
  const n = missionIds.length;
  const xOf = (i: number) => padL + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const yOf = (pct: number) => padT + plotH - (Math.max(0, Math.min(100, pct)) / 100) * plotH;

  return (
    <View wrap={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 26, height, justifyContent: 'space-between', paddingVertical: 4, alignItems: 'flex-end', paddingRight: 4 }}>
          <Text style={{ fontSize: 6.2, color: '#15803d', fontFamily: 'Helvetica-Bold' }}>100%</Text>
          <Text style={{ fontSize: 6.2, color: '#64748b' }}>50%</Text>
          <Text style={{ fontSize: 6.2, color: '#64748b' }}>0%</Text>
        </View>
        <Svg width={svgWidth} height={height} viewBox={`0 0 ${svgWidth} ${height}`}>
          {[0, 25, 50, 75, 100].map(tick => (
            <Line
              key={tick}
              x1={padL}
              y1={yOf(tick)}
              x2={svgWidth - padR}
              y2={yOf(tick)}
              stroke={tick === 0 ? '#64748b' : '#cbd5e1'}
              strokeWidth={tick === 0 ? 1 : 0.6}
              strokeDasharray={tick === 0 ? undefined : '3 2'}
            />
          ))}
          <Line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#64748b" strokeWidth={1} />

          {seriesList.map((s, si) => {
            const poly = s.pts.map((p, i) => `${xOf(i).toFixed(1)},${yOf(p.pct).toFixed(1)}`).join(' ');
            return (
              <G key={si}>
                {s.pts.length > 1 && (
                  <Polyline points={poly} fill="none" stroke={s.color} strokeWidth={seriesList.length > 1 ? 1.7 : 2.2} />
                )}
                {s.pts.map((p, pi) => (
                  <Circle key={`${si}-${pi}`} cx={xOf(pi)} cy={yOf(p.pct)} r={seriesList.length > 1 ? 2.2 : 2.8} fill={s.color} />
                ))}
              </G>
            );
          })}

          {avgSeries && avgSeries.length > 1 && (
            <>
              <Polyline
                points={avgSeries.map((p, i) => `${xOf(i).toFixed(1)},${yOf(p.pct).toFixed(1)}`).join(' ')}
                fill="none"
                stroke={AVG_PDF_COLOR}
                strokeWidth={2.2}
                strokeDasharray="4 3"
              />
              {avgSeries.map((p, i) => (
                <Circle key={`avg-${i}`} cx={xOf(i)} cy={yOf(p.pct)} r={2.6} fill={AVG_PDF_COLOR} />
              ))}
            </>
          )}
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', paddingLeft: 26, justifyContent: n === 1 ? 'center' : 'space-between', marginTop: 3 }}>
        {missionIds.map(mId => (
          <Text key={mId} style={{ fontSize: 6.2, color: '#334155', fontFamily: 'Helvetica-Bold', width: `${100 / Math.max(1, n)}%`, textAlign: 'center' }}>
            {mId}
          </Text>
        ))}
      </View>
    </View>
  );
};

const MediaSection = ({ media, team }: { media: PreparedMedia[]; team: TeamKey }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: TEAM[team].ink, borderBottomColor: TEAM[team].secondary }]} minPresenceAhead={165}>
      Registros Fotográficos e Vídeos
    </Text>
    {media.length ? (
      <View style={styles.mediaGrid}>
        {media.map((entry, index) => (
          <View key={`${entry.name}-${index}`} style={styles.mediaCard} wrap={false}>
            <Image style={styles.mediaImage} src={entry.source} />
            {entry.video && <Text style={styles.videoBadge}>CAPA DO VÍDEO</Text>}
            <Text style={styles.mediaCaption}>{entry.name}</Text>
          </View>
        ))}
      </View>
    ) : (
      <Text style={styles.emptyMedia}>Nenhuma mídia anexada a esta atividade.</Text>
    )}
  </View>
);

export const ActivityDocument = ({ item, kind, team, media, teamLogo, competitionLogo }: {
  item: Record<string, any>;
  kind: ActivityKind;
  team: TeamKey;
  media: PreparedMedia[];
  teamLogo: string;
  competitionLogo: string;
}) => {
  const identity = TEAM[team];
  const attempts: Attempt[] = Array.isArray(item.attempts) ? item.attempts : [];
  const isRoundMode = kind === 'test' && isRoundTest(item, team);
  const isFll = team === 'fll' || team === 'under' || String(item.modality || '').toUpperCase() === 'FLL';
  const scores = attempts.map(attempt => team === 'obr' ? asNumber(attempt.observed ?? attempt.score) : asNumber(attempt.score));
  const times = attempts.map(attempt => asNumber(attempt.time));
  const failures = attempts.map(attempt => asNumber(attempt.failures));
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const tags = (Array.isArray(item.tags) ? item.tags : []).filter((tag: unknown) => typeof tag === 'string' && !String(tag).startsWith('team:'));

  // Dados consolidados de missões para testes com missões registradas
  const hasMissions = attempts.some(a => Array.isArray(a.missions) && a.missions.length > 0);
  const missionIds = isRoundMode && isFll
    ? BIOGLOW_SEASON.missions.map(m => m.id)
    : Array.from(new Set(attempts.flatMap(a => (a.missions || []).map(m => m.missionId.toUpperCase()))))
        .sort((a, b) => (parseInt(a.replace(/\D/g, ''), 10) || 0) - (parseInt(b.replace(/\D/g, ''), 10) || 0));

  const missionSummary = missionIds.map(mId => {
    const officialMax = isFll ? getMissionMaxScore(mId) : 0;
    let totalScore = 0;
    let savedMax = 0;
    let count = 0;
    attempts.forEach(a => {
      const found = (a.missions || []).find(m => m.missionId.toUpperCase() === mId);
      if (found) {
        totalScore += asNumber(found.score);
        savedMax = found.maxScore || savedMax;
        count++;
      } else if (isRoundMode) {
        count++;
      }
    });
    const maxScore = officialMax || savedMax || 1;
    const avgScore = count > 0 ? totalScore / count : 0;
    const avgPct = calculateMissionAssertiveness(avgScore, maxScore);
    return { mId, avgScore, maxScore, avgPct: Math.round(avgPct), count };
  });

  const roundSeries = attempts.map((att, attIdx) => {
    const color = ROUND_PDF_COLORS[attIdx % ROUND_PDF_COLORS.length] ?? '#0891b2';
    const missionMap = new Map((att.missions || []).map(m => [m.missionId.toUpperCase(), m]));
    const pts = missionIds.map(mId => {
      const found = missionMap.get(mId);
      const max = (isFll ? getMissionMaxScore(mId) : 0) || found?.maxScore || 1;
      const score = found ? asNumber(found.score) : 0;
      const pct = Math.round(calculateMissionAssertiveness(score, max));
      return { mId, score, max, pct };
    });
    const avgPct = pts.length > 0 ? Math.round(pts.reduce((s, p) => s + p.pct, 0) / pts.length) : 0;
    return { attIdx, color, pts, totalScore: asNumber(att.score), avgPct };
  });

  const tokenCounts = attempts.map(a => a.precisionTokensRemaining ?? 6);
  const avgTokens = tokenCounts.length ? tokenCounts.reduce((s, v) => s + v, 0) / tokenCounts.length : 6;
  const tokenPoints = tokenCounts.map(t => calculatePrecisionPoints(t));
  const avgTokenPoints = tokenPoints.length ? tokenPoints.reduce((s: number, v) => s + v, 0) / tokenPoints.length : 50;
  const avgTokenPct = Math.round((avgTokenPoints / 50) * 100);
  const configuredMaximum = Number(item.maxScore) > 0 ? Number(item.maxScore) : BIOGLOW_SEASON.maximumScore;

  // Indicadores globais de assertividade (equivalentes aos cards do modo de leitura)
  const allMissionPts = roundSeries.flatMap(s => s.pts);
  const overallAssertivenessPct = allMissionPts.length > 0
    ? allMissionPts.reduce((sum, p) => sum + p.pct, 0) / allMissionPts.length
    : 0;
  const missionStatsList = missionSummary.map(m => {
    const pts = roundSeries.map(s => s.pts.find(p => p.mId === m.mId)?.pct ?? 0);
    const bestPct = pts.length > 0 ? Math.max(...pts) : 0;
    return { ...m, bestPct };
  });
  const missionsWithData = missionStatsList.filter(m => m.count > 0);
  const bestMissionStat = missionsWithData.length > 0
    ? [...missionsWithData].sort((a, b) => b.avgPct - a.avgPct)[0]
    : null;
  const lowestMissionStat = missionsWithData.length > 0
    ? [...missionsWithData].sort((a, b) => a.avgPct - b.avgPct)[0]
    : null;

  return (
    <Document
      title={String(item.title || 'Atividade')}
      author={identity.label}
      subject={kind === 'record' ? 'Registro do diário de bordo' : 'Relatório de Teste e Simulação'}
      creator="Hortobots Planning"
    >
      <Page size="A4" orientation="portrait" wrap style={styles.page}>
        <ActivityHeader team={team} teamLogo={teamLogo} competitionLogo={competitionLogo} />

        <Text style={[styles.eyebrow, { color: identity.primary }]}>
          {kind === 'record'
            ? 'Registro do Diário de Bordo'
            : isRoundMode
              ? 'Relatório Técnico · Simulação de Round Completo'
              : 'Relatório Técnico · Teste e Simulação'}
        </Text>
        <Text style={[styles.title, { color: identity.ink }]}>
          {String(item.title || (kind === 'record' ? 'Registro' : 'Teste'))}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaPill, { backgroundColor: identity.primary }]}>{identity.label}</Text>
          <Text style={styles.metaText}>Data: {String(item.date || 'Não informada')}</Text>
          {item.createdBy && <Text style={styles.metaText}>· Responsável: {String(item.createdBy)}</Text>}
          {kind === 'test' && (
            <Text style={styles.metaText}>
              · Modalidade: {isFll ? 'FLL (BIOGLOW)' : 'OBR'} · {isRoundMode ? 'Round Teste' : 'Missão Individual'}
            </Text>
          )}
        </View>

        {kind === 'record' ? (
          <>
            <View style={[styles.highlight, { borderLeftColor: identity.primary }]}>
              <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>Resumo</Text>
              <Text style={styles.body}>{String(item.summary || 'Nenhum resumo informado.')}</Text>
            </View>
            {item.body && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>Relato Completo</Text>
                <Text style={styles.body}>{String(item.body)}</Text>
              </View>
            )}
            {tags.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>Tags</Text>
                <View style={styles.tags}>
                  {tags.map((tag: string) => (
                    <Text key={tag} style={[styles.tag, { color: identity.ink, borderColor: identity.secondary }]}>{tag}</Text>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {/* ── PÁGINA 1: OBJETIVO, INDICADORES E EVOLUÇÃO GERAL ── */}
            <View style={[styles.highlight, { borderLeftColor: identity.primary }]}>
              <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>Objetivo do Teste</Text>
              <Text style={styles.body}>{String(item.objective || 'Nenhum objetivo informado.')}</Text>
              {item.mission && (
                <Text style={[styles.body, { marginTop: 5 }]}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>Missão Avaliada: </Text>
                  {String(item.mission)}
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>
                Indicadores Gerais de Desempenho
              </Text>

              <View style={styles.statsRow} wrap={false}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>{isRoundMode ? 'Rounds' : 'Tentativas'}</Text>
                  <Text style={[styles.statValue, { color: identity.primary }]}>{attempts.length}</Text>
                  <Text style={styles.statSub}>executados</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>{team === 'obr' ? 'Valor Médio' : 'Média Geral'}</Text>
                  <Text style={[styles.statValue, { color: identity.primary }]}>{average(scores).toFixed(1)}</Text>
                  <Text style={styles.statSub}>{isFll ? `de ${configuredMaximum} pts` : 'pontos'}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Melhor Marca</Text>
                  <Text style={[styles.statValue, { color: identity.primary }]}>
                    {scores.length ? Math.max(...scores) : 0}
                  </Text>
                  <Text style={styles.statSub}>pico registrado</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>{isRoundMode ? 'Tempo Médio' : 'Falhas Totais'}</Text>
                  <Text style={[styles.statValue, { color: identity.primary }]}>
                    {isRoundMode ? `${average(times).toFixed(1)}s` : failures.reduce((s, v) => s + v, 0)}
                  </Text>
                  <Text style={styles.statSub}>
                    {isRoundMode ? 'por round' : `tempo médio: ${average(times).toFixed(1)}s`}
                  </Text>
                </View>
              </View>

              {isFll && (() => {
                const best = scores.length ? Math.max(...scores) : 0;
                const bestPercent = configuredMaximum > 0 ? Math.min(100, Math.max(0, (best / configuredMaximum) * 100)) : 0;
                const averageScore = average(scores);
                const averagePercent = configuredMaximum > 0 ? Math.min(100, Math.max(0, (averageScore / configuredMaximum) * 100)) : 0;
                const potentialRemaining = Math.max(0, configuredMaximum - best);

                return (
                  <View style={styles.performanceBox} wrap={false}>
                    <Text style={[styles.performanceKicker, { color: identity.primary }]}>APROVEITAMENTO OFICIAL</Text>
                    <Text style={[styles.performanceSeasonTitle, { color: identity.ink }]}>Temporada BIOGLOW 2026/2027</Text>
                    <View style={styles.performanceNumbers}>
                      <Text style={[styles.performanceScoreBig, { color: identity.primary }]}>{bestPercent.toFixed(1)}%</Text>
                      <Text style={styles.performanceScoreSub}>melhor resultado: {best} de {configuredMaximum} pontos</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${Math.max(1, bestPercent).toFixed(1)}%`, backgroundColor: identity.primary }]} />
                    </View>
                    <View style={styles.performanceMetaRow}>
                      <Text>Média: {averageScore.toFixed(1)} pts ({averagePercent.toFixed(1)}%)</Text>
                      <Text>Potencial restante: {potentialRemaining} pts</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Tabela Resumo dos Rounds / Tentativas */}
              <View style={[styles.attemptsTable, { marginBottom: 12 }]} wrap={false}>
                <View style={[styles.attemptRow, styles.attemptHeader, { backgroundColor: identity.primary }]}>
                  <Text style={[styles.attemptCell, { width: '20%' }]}>{isRoundMode ? 'Round Teste' : 'Tentativa'}</Text>
                  <Text style={[styles.attemptCell, { width: '16%' }]}>Tempo</Text>
                  <Text style={[styles.attemptCell, { width: '20%' }]}>{team === 'obr' ? 'Observado' : 'Pontuação'}</Text>
                  <Text style={[styles.attemptCell, { width: '22%' }]}>{isRoundMode ? 'Discos Rest.' : 'Falhas'}</Text>
                  <Text style={[styles.attemptCell, { width: '22%' }]}>{isRoundMode ? 'Inspeção' : 'Status'}</Text>
                </View>
                {attempts.map((attempt, idx) => (
                  <View key={idx} style={[styles.attemptRow, { backgroundColor: idx % 2 ? '#f1f3ee' : '#ffffff' }]}>
                    <Text style={[styles.attemptCell, { width: '20%', fontFamily: 'Helvetica-Bold' }]}>
                      {isRoundMode ? `Round ${idx + 1}` : `Tentativa ${idx + 1}`}
                    </Text>
                    <Text style={[styles.attemptCell, { width: '16%' }]}>{asNumber(attempt.time)} s</Text>
                    <Text style={[styles.attemptCell, { width: '20%', fontFamily: 'Helvetica-Bold' }]}>
                      {team === 'obr' ? asNumber(attempt.observed ?? attempt.score) : asNumber(attempt.score)} pts
                    </Text>
                    <Text style={[styles.attemptCell, { width: '22%' }]}>
                      {isRoundMode ? `${attempt.precisionTokensRemaining ?? 6} (+${tokenPoints[idx]}p)` : asNumber(attempt.failures)}
                    </Text>
                    <Text style={[styles.attemptCell, { width: '22%' }]}>
                      {isRoundMode
                        ? (attempt.inspectionBonus ? '+20 pts' : '0 pts')
                        : (asNumber(attempt.failures) === 0 ? 'Sem falhas' : 'Revisar')}
                    </Text>
                  </View>
                ))}
              </View>

              {!isRoundMode && <PerformanceChart attempts={attempts} team={team} />}
            </View>

            {/* ── PÁGINA 2: MÉDIAS CONSOLIDADAS POR MISSÃO + GRÁFICO DE MÉDIA ── */}
            {hasMissions && (
              <View style={styles.section} break>
                <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>
                  Médias Consolidadas por Missão ({isRoundMode ? 'M01 a M15' : 'Missões Avaliadas'})
                </Text>

                {/* Cards de Indicadores de Assertividade (mesmos do modo leitura) */}
                <View style={styles.statsRow} wrap={false}>
                  <View style={[styles.statCard, { width: isRoundMode ? '23.5%' : '32%' }]}>
                    <Text style={styles.statLabel}>Assertividade Média</Text>
                    <Text style={[styles.statValue, { color: '#0891b2' }]}>
                      {overallAssertivenessPct.toFixed(1)}%
                    </Text>
                    <Text style={styles.statSub}>
                      média entre as {missionIds.length} missões
                    </Text>
                  </View>

                  {bestMissionStat && (
                    <View style={[styles.statCard, { width: isRoundMode ? '23.5%' : '32%' }]}>
                      <Text style={styles.statLabel}>Melhor Missão</Text>
                      <Text style={[styles.statValue, { color: '#15803d', fontSize: 12.5 }]}>
                        {bestMissionStat.mId} ({bestMissionStat.avgPct}%)
                      </Text>
                      <Text style={styles.statSub}>pico: {bestMissionStat.bestPct}%</Text>
                    </View>
                  )}

                  {lowestMissionStat && (
                    <View style={[styles.statCard, { width: isRoundMode ? '23.5%' : '32%' }]}>
                      <Text style={styles.statLabel}>Oportunidade de Treino</Text>
                      <Text style={[styles.statValue, { color: '#b45309', fontSize: 12.5 }]}>
                        {lowestMissionStat.mId} ({lowestMissionStat.avgPct}%)
                      </Text>
                      <Text style={styles.statSub}>menor índice registrado</Text>
                    </View>
                  )}

                  {isRoundMode && (
                    <View style={[styles.statCard, { width: '23.5%' }]}>
                      <Text style={styles.statLabel}>Média Discos Precisão</Text>
                      <Text style={[styles.statValue, { color: '#0284c7', fontSize: 12.5 }]}>
                        {avgTokenPoints.toFixed(1)}p ({avgTokenPct}%)
                      </Text>
                      <Text style={styles.statSub}>
                        {avgTokens.toFixed(1)} de 6 discos restantes
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.attemptsTable, { marginBottom: 12 }]} wrap={false}>
                  <View style={[styles.attemptRow, styles.attemptHeader, { backgroundColor: identity.primary }]}>
                    <Text style={[styles.attemptCell, { width: '25%' }]}>Missão / Item</Text>
                    <Text style={[styles.attemptCell, { width: '25%' }]}>Pontuação Média</Text>
                    <Text style={[styles.attemptCell, { width: '25%' }]}>Pontuação Máx.</Text>
                    <Text style={[styles.attemptCell, { width: '25%' }]}>Assertividade Média</Text>
                  </View>
                  {missionSummary.map((m, mIdx) => (
                    <View key={m.mId} style={[styles.attemptRow, { backgroundColor: mIdx % 2 ? '#f1f3ee' : '#ffffff' }]}>
                      <Text style={[styles.attemptCell, { width: '25%', fontFamily: 'Helvetica-Bold' }]}>{m.mId}</Text>
                      <Text style={[styles.attemptCell, { width: '25%' }]}>{m.avgScore.toFixed(1)} pts</Text>
                      <Text style={[styles.attemptCell, { width: '25%' }]}>{m.maxScore} pts</Text>
                      <Text style={[styles.attemptCell, { width: '25%', fontFamily: 'Helvetica-Bold', color: m.avgPct >= 100 ? '#15803d' : m.avgPct >= 50 ? '#1d4ed8' : '#b45309' }]}>
                        {m.avgPct}%
                      </Text>
                    </View>
                  ))}
                  {isRoundMode && (
                    <View style={[styles.attemptRow, { backgroundColor: '#eef2ea' }]}>
                      <Text style={[styles.attemptCell, { width: '25%', fontFamily: 'Helvetica-Bold' }]}>Discos de Precisão</Text>
                      <Text style={[styles.attemptCell, { width: '25%' }]}>{avgTokenPoints.toFixed(1)} pts ({avgTokens.toFixed(1)} rest.)</Text>
                      <Text style={[styles.attemptCell, { width: '25%' }]}>50 pts</Text>
                      <Text style={[styles.attemptCell, { width: '25%', fontFamily: 'Helvetica-Bold', color: avgTokenPct >= 100 ? '#15803d' : avgTokenPct >= 50 ? '#1d4ed8' : '#b45309' }]}>
                        {avgTokenPct}%
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.chartCard} wrap={false}>
                  <Text style={[styles.chartTitle, { color: AVG_PDF_COLOR }]}>
                    Curva de Média Geral por Missão
                  </Text>
                  <PdfAssertivenessChart
                    missionIds={missionIds}
                    seriesList={[]}
                    avgSeries={missionSummary.map(m => ({ pct: m.avgPct }))}
                    height={125}
                    svgWidth={445}
                  />
                </View>
              </View>
            )}

            {/* ── PÁGINAS 3+: DETALHAMENTO INDIVIDUAL INTERCALADO POR ROUND ── */}
            {hasMissions && isRoundMode && (
              <>
                {attempts.map((att, attIdx) => {
                  const s = roundSeries[attIdx]!;
                  const roundColor = s.color;
                  const precisionPts = tokenPoints[attIdx] ?? 50;
                  const inspPts = att.inspectionBonus ? BIOGLOW_SEASON.equipmentInspectionPoints : 0;
                  const missionsScore = Math.max(0, asNumber(att.score) - precisionPts - inspPts);
                  const shouldBreakPage = attIdx % 2 === 0;

                  return (
                    <View
                      key={attIdx}
                      break={shouldBreakPage}
                      wrap={false}
                      style={[styles.roundCard, { borderLeftColor: roundColor }]}
                    >
                      <View style={styles.roundHeader}>
                        <View style={styles.roundHeaderLeft}>
                          <View style={[styles.roundBadge, { backgroundColor: roundColor }]}>
                            <Text style={styles.roundBadgeText}>ROUND TESTE {attIdx + 1}</Text>
                          </View>
                          <Text style={[styles.roundScoreText, { color: roundColor }]}>
                            {asNumber(att.score)} / {configuredMaximum} pts
                          </Text>
                        </View>
                        <Text style={styles.roundMetaText}>
                          Tempo: {asNumber(att.time)} s · Assertividade média: {s.avgPct}%
                        </Text>
                      </View>

                      <View style={styles.roundMetricsRow}>
                        <View style={styles.roundMetricBox}>
                          <Text style={styles.statLabel}>Missões (M01–M15)</Text>
                          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10.5, color: roundColor }}>
                            {missionsScore} pts
                          </Text>
                        </View>
                        <View style={styles.roundMetricBox}>
                          <Text style={styles.statLabel}>Discos de Precisão</Text>
                          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10.5, color: roundColor }}>
                            {att.precisionTokensRemaining ?? 6} rest. (+{precisionPts} pts)
                          </Text>
                        </View>
                        <View style={styles.roundMetricBox}>
                          <Text style={styles.statLabel}>Inspeção de Equip.</Text>
                          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10.5, color: roundColor }}>
                            {att.inspectionBonus ? `+${inspPts} pts` : '0 pts'}
                          </Text>
                        </View>
                      </View>

                      <PdfAssertivenessChart
                        missionIds={missionIds}
                        seriesList={[{ color: roundColor, pts: s.pts }]}
                        height={96}
                        svgWidth={435}
                      />

                      <View style={styles.roundMissionGrid}>
                        {s.pts.map(p => (
                          <View key={p.mId} style={styles.roundMissionCell}>
                            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#1e293b' }}>{p.mId}</Text>
                            <Text style={{ fontSize: 6.8, color: '#475569' }}>{p.score}/{p.max}p</Text>
                            <Text style={{
                              fontFamily: 'Helvetica-Bold',
                              fontSize: 7,
                              color: p.pct >= 100 ? '#15803d' : p.pct >= 50 ? '#1d4ed8' : p.pct > 0 ? '#b45309' : '#94a3b8'
                            }}>
                              {p.pct}%
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}

                {/* ── ÚLTIMA SEÇÃO DE GRÁFICOS: VISÃO GERAL SOBREPOSTA ── */}
                <View style={styles.section} break>
                  <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>
                    Visão Geral — Todos os Rounds Sobrepostos
                  </Text>
                  <View style={styles.chartCard} wrap={false}>
                    <Text style={[styles.chartTitle, { color: identity.ink }]}>
                      Comparativo Direto entre os {attempts.length} Rounds Teste (M01 a M15)
                    </Text>
                    <View style={styles.chartLegend}>
                      {roundSeries.map(s => (
                        <View key={s.attIdx} style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                          <Text style={{ color: s.color, fontFamily: 'Helvetica-Bold' }}>
                            R{s.attIdx + 1}:
                          </Text>
                          <Text>{s.totalScore} pts ({s.avgPct}%)</Text>
                        </View>
                      ))}
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: AVG_PDF_COLOR }]} />
                        <Text style={{ color: AVG_PDF_COLOR, fontFamily: 'Helvetica-Bold' }}>Média Geral</Text>
                      </View>
                    </View>
                    <PdfAssertivenessChart
                      missionIds={missionIds}
                      seriesList={roundSeries.map(s => ({ color: s.color, pts: s.pts }))}
                      avgSeries={missionSummary.map(m => ({ pct: m.avgPct }))}
                      height={165}
                      svgWidth={445}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Para testes não-round com missões individuais registradas */}
            {hasMissions && !isRoundMode && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>
                  Detalhamento por Tentativa
                </Text>
                <View style={styles.attemptsTable}>
                  <View style={[styles.attemptRow, styles.attemptHeader, { backgroundColor: identity.secondary }]}>
                    <Text style={[styles.attemptCell, { width: '20%' }]}>Tentativa</Text>
                    <Text style={[styles.attemptCell, { width: '20%' }]}>Missão</Text>
                    <Text style={[styles.attemptCell, { width: '20%' }]}>Pontuação</Text>
                    <Text style={[styles.attemptCell, { width: '20%' }]}>Máximo</Text>
                    <Text style={[styles.attemptCell, { width: '20%' }]}>Assertividade</Text>
                  </View>
                  {attempts.flatMap((att, attIdx) => (att.missions || []).map((m, mIdx) => {
                    const max = (isFll ? getMissionMaxScore(m.missionId) : 0) || m.maxScore || 1;
                    const scoreVal = asNumber(m.score);
                    const pct = Math.round(calculateMissionAssertiveness(scoreVal, max));
                    return (
                      <View key={`${attIdx}-${m.missionId}`} style={[styles.attemptRow, { backgroundColor: (attIdx + mIdx) % 2 ? '#f1f3ee' : '#ffffff' }]}>
                        <Text style={[styles.attemptCell, { width: '20%' }]}>Tentativa {attIdx + 1}</Text>
                        <Text style={[styles.attemptCell, { width: '20%', fontFamily: 'Helvetica-Bold' }]}>{m.missionId}</Text>
                        <Text style={[styles.attemptCell, { width: '20%' }]}>{scoreVal} pts</Text>
                        <Text style={[styles.attemptCell, { width: '20%' }]}>{max} pts</Text>
                        <Text style={[styles.attemptCell, { width: '20%', fontFamily: 'Helvetica-Bold', color: pct >= 100 ? '#15803d' : pct >= 50 ? '#1d4ed8' : '#b45309' }]}>
                          {pct}%
                        </Text>
                      </View>
                    );
                  }))}
                </View>
              </View>
            )}

            {item.comments && (
              <View style={styles.section} minPresenceAhead={80}>
                <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>
                  Comentários e Observações Técnicas
                </Text>
                <Text style={styles.body}>{String(item.comments)}</Text>
              </View>
            )}
          </>
        )}

        <MediaSection media={media} team={team} />
      </Page>
    </Document>
  );
};

export async function generateActivityPdf({ item, kind, team, resolveMediaUrl }: GenerateActivityPdfOptions) {
  const identity = TEAM[team];
  const [teamLogo, competitionLogo, media] = await Promise.all([
    imageToJpeg(identity.teamLogo),
    imageToJpeg(identity.competitionLogo),
    prepareMedia(Array.isArray(item.media) ? item.media : [], resolveMediaUrl, identity.primary)
  ]);
  const blob = await pdf(
    <ActivityDocument
      item={item}
      kind={kind}
      team={team}
      media={media}
      teamLogo={teamLogo}
      competitionLogo={competitionLogo}
    />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${kind === 'record' ? 'registro' : 'teste'}-${cleanFileName(String(item.title || item.id || 'atividade'))}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
