import {
  Circle,
  Document,
  Image,
  Line,
  Page,
  Polyline,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  pdf
} from '@react-pdf/renderer';
import fllTeamLogo from './assets/originals/fll_team_logo.png';
import obrTeamLogo from './assets/originals/obr_team_logo.png';
import underTeamLogo from './assets/originals/underconstruction_logo.png';
import fllCompetitionLogo from './assets/originals/fll_logo.png';
import obrCompetitionLogo from './assets/originals/obr_logo.png';

type TeamKey = 'fll' | 'under' | 'obr';
type ActivityKind = 'record' | 'test';
type PreparedMedia = { name: string; source: string; video: boolean };
type Attempt = { time?: number; score?: number; failures?: number; observed?: number };

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
    secondary: '#b9df78',
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

const styles = StyleSheet.create({
  page: { backgroundColor: '#f7f3e9', color: '#20251f', fontFamily: 'Helvetica', fontSize: 9.5, paddingTop: 92, paddingBottom: 54, paddingHorizontal: 42 },
  topBand: { position: 'absolute', top: 0, left: 0, right: 0, height: 14 },
  bottomBand: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 9 },
  marginRule: { position: 'absolute', top: 84, bottom: 24, left: 30, width: 0.8, opacity: 0.22 },
  header: { position: 'absolute', top: 22, left: 42, right: 42, height: 56, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.2, paddingBottom: 8 },
  logo: { width: 49, height: 42, objectFit: 'contain' },
  competitionLogo: { width: 62, height: 42, objectFit: 'contain' },
  headerCopy: { flexGrow: 1, paddingHorizontal: 12 },
  headerTeam: { fontFamily: 'Helvetica-Bold', fontSize: 13, textTransform: 'uppercase' },
  headerCompetition: { color: '#596057', fontSize: 8, marginTop: 3 },
  footer: { position: 'absolute', bottom: 18, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', color: '#6b7069', fontSize: 7.5 },
  eyebrow: { fontFamily: 'Helvetica-Bold', fontSize: 8, letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 7 },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 24, lineHeight: 1.08, marginBottom: 9 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  metaPill: { color: '#ffffff', borderRadius: 10, paddingVertical: 4, paddingHorizontal: 8, fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  metaText: { color: '#565d54', fontSize: 8.5 },
  section: { marginBottom: 15 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 11.5, textTransform: 'uppercase', borderBottomWidth: 1, paddingBottom: 5, marginBottom: 8 },
  body: { fontSize: 10, lineHeight: 1.55 },
  highlight: { borderLeftWidth: 4, borderRadius: 4, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 15, backgroundColor: '#fffdfa' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { borderWidth: 0.8, borderRadius: 9, paddingVertical: 3, paddingHorizontal: 7, fontSize: 7.5 },
  stats: { flexDirection: 'row', gap: 7, marginBottom: 13 },
  stat: { flexGrow: 1, flexBasis: 0, backgroundColor: '#ffffff', borderRadius: 5, borderWidth: 0.8, borderColor: '#d9ddd6', padding: 8 },
  statLabel: { color: '#687066', fontSize: 6.8, textTransform: 'uppercase', marginBottom: 3 },
  statValue: { fontFamily: 'Helvetica-Bold', fontSize: 14 },
  chart: { backgroundColor: '#ffffff', borderWidth: 0.8, borderColor: '#d9ddd6', borderRadius: 5, padding: 10, marginBottom: 13 },
  chartLegend: { flexDirection: 'row', gap: 14, marginBottom: 7, fontSize: 7.5 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  attemptsTable: { borderWidth: 0.8, borderColor: '#cfd3cc', borderRadius: 4, overflow: 'hidden' },
  attemptRow: { flexDirection: 'row', minHeight: 24, alignItems: 'center', borderBottomWidth: 0.6, borderBottomColor: '#dfe2dc' },
  attemptHeader: { color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  attemptCell: { width: '20%', paddingHorizontal: 6, textAlign: 'center', fontSize: 7.8 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mediaCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 5, borderWidth: 0.8, borderColor: '#d8dcd5', padding: 6 },
  mediaImage: { width: '100%', height: 145, objectFit: 'cover', borderRadius: 3 },
  mediaCaption: { marginTop: 5, fontSize: 7.5, color: '#535a51' },
  videoBadge: { position: 'absolute', top: 12, right: 12, color: '#ffffff', backgroundColor: '#161616', paddingVertical: 3, paddingHorizontal: 6, borderRadius: 8, fontFamily: 'Helvetica-Bold', fontSize: 6.5 },
  emptyMedia: { color: '#777d75', fontStyle: 'italic' },
  performanceBox: { backgroundColor: '#ffffff', borderWidth: 0.8, borderColor: '#d9ddd6', borderRadius: 5, padding: 10, marginTop: 12, marginBottom: 13 },
  performanceKicker: { fontFamily: 'Helvetica-Bold', fontSize: 7.2, letterSpacing: 1.2, textTransform: 'uppercase', color: '#2b8d35', marginBottom: 2 },
  performanceSeasonTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10.5, color: '#15351b', marginBottom: 6 },
  performanceNumbers: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 6 },
  performanceScoreBig: { fontFamily: 'Helvetica-Bold', fontSize: 20, color: '#2b8d35' },
  performanceScoreSub: { fontSize: 8.5, color: '#565d54' },
  progressBarBg: { height: 7, backgroundColor: '#e2e7df', borderRadius: 3.5, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: 7, backgroundColor: '#2b8d35', borderRadius: 3.5 },
  performanceMetaRow: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.8, color: '#687066' }
});

const asNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

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
      <Text>Hortobots Planning · Documento oficial da equipe</Text>
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
  const left = 22;
  const top = 12;
  const width = 470;
  const height = 116;
  const x = (index: number) => attempts.length === 1 ? left + width / 2 : left + (index * width) / (attempts.length - 1);
  const pointLine = (list: number[], max: number) => list.map((value, index) => `${x(index)},${top + height - (value / max) * height}`).join(' ');
  return <View style={styles.chart} wrap={false}>
    <View style={styles.chartLegend}>
      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: identity.primary }]} /><Text>{team === 'obr' ? 'Valor observado' : 'Pontuação'}</Text></View>
      <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: identity.secondary }]} /><Text>Tempo</Text></View>
    </View>
    <Svg width="100%" height={145} viewBox="0 0 514 145">
      {[0, 1, 2, 3, 4].map(step => <Line key={step} x1={left} y1={top + (height * step) / 4} x2={left + width} y2={top + (height * step) / 4} stroke="#dce0da" strokeWidth={0.8} />)}
      <Line x1={left} y1={top} x2={left} y2={top + height} stroke="#7c837a" strokeWidth={1} />
      <Line x1={left} y1={top + height} x2={left + width} y2={top + height} stroke="#7c837a" strokeWidth={1} />
      <Polyline points={pointLine(values, maxValue)} fill="none" stroke={identity.primary} strokeWidth={2.5} />
      <Polyline points={pointLine(times, maxTime)} fill="none" stroke={identity.secondary} strokeWidth={2.2} />
      {values.map((value, index) => <Circle key={`value-${index}`} cx={x(index)} cy={top + height - (value / maxValue) * height} r={3.2} fill={identity.primary} />)}
      {times.map((value, index) => <Circle key={`time-${index}`} cx={x(index)} cy={top + height - (value / maxTime) * height} r={2.8} fill={identity.secondary} />)}
    </Svg>
  </View>;
};

const MediaSection = ({ media, team }: { media: PreparedMedia[]; team: TeamKey }) => <View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: TEAM[team].ink, borderBottomColor: TEAM[team].secondary }]} minPresenceAhead={165}>Imagens e vídeos</Text>
  {media.length ? <View style={styles.mediaGrid}>
    {media.map((entry, index) => <View key={`${entry.name}-${index}`} style={styles.mediaCard} wrap={false}>
      <Image style={styles.mediaImage} src={entry.source} />
      {entry.video && <Text style={styles.videoBadge}>CAPA DO VÍDEO</Text>}
      <Text style={styles.mediaCaption}>{entry.name}</Text>
    </View>)}
  </View> : <Text style={styles.emptyMedia}>Nenhuma mídia anexada a esta atividade.</Text>}
</View>;

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
  const scores = attempts.map(attempt => team === 'obr' ? asNumber(attempt.observed ?? attempt.score) : asNumber(attempt.score));
  const times = attempts.map(attempt => asNumber(attempt.time));
  const failures = attempts.map(attempt => asNumber(attempt.failures));
  const attemptChunks = attempts.length > 8 ? [attempts.slice(0, 8), attempts.slice(8)] : [attempts];
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const tags = (Array.isArray(item.tags) ? item.tags : []).filter((tag: unknown) => typeof tag === 'string' && !String(tag).startsWith('team:'));
  return <Document title={String(item.title || 'Atividade')} author={identity.label} subject={kind === 'record' ? 'Registro do diário de bordo' : 'Teste e simulação'} creator="Hortobots Planning">
    <Page size="A4" orientation="portrait" wrap style={styles.page}>
      <ActivityHeader team={team} teamLogo={teamLogo} competitionLogo={competitionLogo} />
      <Text style={[styles.eyebrow, { color: identity.primary }]}>{kind === 'record' ? 'Registro do diário de bordo' : 'Teste e simulação'}</Text>
      <Text style={[styles.title, { color: identity.ink }]}>{String(item.title || (kind === 'record' ? 'Registro' : 'Teste'))}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.metaPill, { backgroundColor: identity.primary }]}>{identity.label}</Text>
        <Text style={styles.metaText}>Data: {String(item.date || 'Não informada')}</Text>
        {item.createdBy && <Text style={styles.metaText}>Responsável: {String(item.createdBy)}</Text>}
      </View>

      {kind === 'record' ? <>
        <View style={[styles.highlight, { borderLeftColor: identity.primary }]}>
          <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>Resumo</Text>
          <Text style={styles.body}>{String(item.summary || 'Nenhum resumo informado.')}</Text>
        </View>
        {item.body && <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>Relato completo</Text>
          <Text style={styles.body}>{String(item.body)}</Text>
        </View>}
        {tags.length > 0 && <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>Tags</Text>
          <View style={styles.tags}>{tags.map((tag: string) => <Text key={tag} style={[styles.tag, { color: identity.ink, borderColor: identity.secondary }]}>{tag}</Text>)}</View>
        </View>}
      </> : <>
        <View style={[styles.highlight, { borderLeftColor: identity.primary }]}>
          <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>Objetivo</Text>
          <Text style={styles.body}>{String(item.objective || 'Nenhum objetivo informado.')}</Text>
          {item.mission && <Text style={[styles.body, { marginTop: 7 }]}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Missão: </Text>{String(item.mission)}</Text>}
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>Resumo de desempenho</Text>
          <View style={styles.stats} wrap={false}>
            <View style={styles.stat}><Text style={styles.statLabel}>Tentativas</Text><Text style={[styles.statValue, { color: identity.primary }]}>{attempts.length}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>{team === 'obr' ? 'Valor médio' : 'Pontuação média'}</Text><Text style={[styles.statValue, { color: identity.primary }]}>{average(scores).toFixed(1)}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>Tempo médio</Text><Text style={[styles.statValue, { color: identity.primary }]}>{average(times).toFixed(1)}s</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>Falhas totais</Text><Text style={[styles.statValue, { color: identity.primary }]}>{failures.reduce((sum, value) => sum + value, 0)}</Text></View>
          </View>
          <PerformanceChart attempts={attempts} team={team} />
          {attemptChunks.map((chunk, chunkIndex) => <View key={chunkIndex} style={[styles.attemptsTable, chunkIndex > 0 ? { marginTop: 8 } : {}]} wrap={false} break={chunkIndex > 0}>
              <View style={[styles.attemptRow, styles.attemptHeader, { backgroundColor: identity.primary }]}>
                <Text style={styles.attemptCell}>Tentativa</Text><Text style={styles.attemptCell}>Tempo</Text><Text style={styles.attemptCell}>{team === 'obr' ? 'Observado' : 'Pontuação'}</Text><Text style={styles.attemptCell}>Falhas</Text><Text style={styles.attemptCell}>Resultado</Text>
              </View>
              {chunk.map((attempt, index) => {
                const absoluteIndex = chunkIndex * 8 + index;
                return <View key={absoluteIndex} style={[styles.attemptRow, { backgroundColor: absoluteIndex % 2 ? '#f1f3ee' : '#ffffff' }]}>
                  <Text style={styles.attemptCell}>{absoluteIndex + 1}</Text><Text style={styles.attemptCell}>{asNumber(attempt.time)} s</Text><Text style={styles.attemptCell}>{team === 'obr' ? asNumber(attempt.observed ?? attempt.score) : asNumber(attempt.score)}</Text><Text style={styles.attemptCell}>{asNumber(attempt.failures)}</Text><Text style={styles.attemptCell}>{asNumber(attempt.failures) === 0 ? 'Sem falhas' : 'Revisar'}</Text>
                </View>;
              })}
            </View>)}
          {(team === 'fll' || team === 'under' || String(item.modality || '').toUpperCase() === 'FLL') && (() => {
            const configuredMaximum = Number(item.maxScore) > 0 ? Number(item.maxScore) : 530;
            const best = scores.length ? Math.max(...scores) : 0;
            const bestPercent = configuredMaximum > 0 ? Math.min(100, Math.max(0, (best / configuredMaximum) * 100)) : 0;
            const averageScore = average(scores);
            const averagePercent = configuredMaximum > 0 ? Math.min(100, Math.max(0, (averageScore / configuredMaximum) * 100)) : 0;
            const potentialRemaining = Math.max(0, configuredMaximum - best);

            return (
              <View style={styles.performanceBox} wrap={false}>
                <Text style={styles.performanceKicker}>APROVEITAMENTO OFICIAL</Text>
                <Text style={styles.performanceSeasonTitle}>BIOGLOW 2026/2027</Text>
                <View style={styles.performanceNumbers}>
                  <Text style={styles.performanceScoreBig}>{bestPercent.toFixed(1)}%</Text>
                  <Text style={styles.performanceScoreSub}>melhor resultado: {best} de {configuredMaximum} pontos</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.max(1, bestPercent).toFixed(1)}%` }]} />
                </View>
                <View style={styles.performanceMetaRow}>
                  <Text>Média: {averageScore.toFixed(1)} pts ({averagePercent.toFixed(1)}%)</Text>
                  <Text>Potencial restante: {potentialRemaining} pts</Text>
                </View>
              </View>
            );
          })()}
        </View>
        {item.comments && <View style={styles.section} minPresenceAhead={80}>
          <Text style={[styles.sectionTitle, { color: identity.ink, borderBottomColor: identity.secondary }]}>Comentários</Text>
          <Text style={styles.body}>{String(item.comments)}</Text>
        </View>}
      </>}
      <MediaSection media={media} team={team} />
    </Page>
  </Document>;
};

export async function generateActivityPdf({ item, kind, team, resolveMediaUrl }: GenerateActivityPdfOptions) {
  const identity = TEAM[team];
  const [teamLogo, competitionLogo, media] = await Promise.all([
    imageToJpeg(identity.teamLogo),
    imageToJpeg(identity.competitionLogo),
    prepareMedia(Array.isArray(item.media) ? item.media : [], resolveMediaUrl, identity.primary)
  ]);
  const blob = await pdf(<ActivityDocument item={item} kind={kind} team={team} media={media} teamLogo={teamLogo} competitionLogo={competitionLogo} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${kind === 'record' ? 'registro' : 'teste'}-${cleanFileName(String(item.title || item.id || 'atividade'))}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
