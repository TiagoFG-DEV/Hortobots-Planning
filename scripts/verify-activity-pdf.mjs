import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createServer } from 'vite';

const root = process.cwd();
const webRoot = path.join(root, 'apps', 'web');
const vite = await createServer({ root: webRoot, server: { middlewareMode: true }, appType: 'custom' });

try {
  const { ActivityDocument } = await vite.ssrLoadModule('/src/activityPdf.tsx');
  const dataUrl = async (file, mime = 'image/png') => `data:${mime};base64,${(await readFile(file)).toString('base64')}`;
  const outputDir = path.join(root, 'output', 'pdf');
  await mkdir(outputDir, { recursive: true });

  const obrTeam = await dataUrl(path.join(webRoot, 'src', 'assets', 'originals', 'obr_team_logo.png'));
  const fllTeam = await dataUrl(path.join(webRoot, 'src', 'assets', 'originals', 'fll_team_logo.png'));
  const obrCompetition = await dataUrl(path.join(webRoot, 'src', 'assets', 'originals', 'obr_competition_logo.png'));
  const fllCompetition = await dataUrl(path.join(webRoot, 'src', 'assets', 'originals', 'fll_competition_logo.png'));

  const record = {
    id: 'pdfrecord', date: '2026-10-10', title: 'Validação do sistema de navegação e sensores', modality: 'OBR', createdBy: 'obr',
    summary: 'A equipe realizou uma sequência completa de testes mecânicos e de programação. Foram analisadas a estabilidade da trajetória, a resposta dos sensores e a consistência do robô durante mudanças rápidas de direção.',
    body: 'Durante o primeiro ciclo, ajustamos a posição do sensor e repetimos a leitura sobre diferentes superfícies. Em seguida, comparamos as medições e modificamos a aceleração inicial. O comportamento final ficou mais previsível e a equipe definiu novas metas para o próximo encontro.',
    tags: ['team:obr', 'programação', 'sensores', 'mecânica', 'documentação']
  };
  const attempts = Array.from({ length: 15 }, (_, index) => ({
    time: 150 - index * 3,
    score: 145 + index * 12,
    failures: Math.max(0, 4 - Math.floor(index / 3))
  }));
  const test = {
    id: 'pdftest', date: '2026-10-10', title: 'Sequência de precisão da missão BIOGLOW', modality: 'FLL', createdBy: 'fll',
    objective: 'Avaliar a evolução da pontuação e do tempo em uma sequência de tentativas completas, identificando falhas recorrentes e oportunidades de melhoria na estratégia.',
    mission: 'M09 Research Platform', comments: 'A equipe apresentou evolução constante. A quinta tentativa obteve a maior pontuação e o menor número de falhas do conjunto.', attempts
  };
  const obrMedia = [{ name: 'Registro do protótipo', source: obrCompetition, video: false }];
  const fllMedia = [{ name: 'Campo de testes', source: fllCompetition, video: false }, { name: 'Tentativa completa.mp4', source: fllCompetition, video: true }];

  const recordBuffer = await renderToBuffer(React.createElement(ActivityDocument, { item: record, kind: 'record', team: 'obr', media: obrMedia, teamLogo: obrTeam, competitionLogo: obrCompetition }));
  const testBuffer = await renderToBuffer(React.createElement(ActivityDocument, { item: test, kind: 'test', team: 'fll', media: fllMedia, teamLogo: fllTeam, competitionLogo: fllCompetition }));
  await writeFile(path.join(outputDir, 'amostra-registro-obr.pdf'), recordBuffer);
  await writeFile(path.join(outputDir, 'amostra-teste-fll.pdf'), testBuffer);
} finally {
  await vite.close();
}
