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
  const underTeam = await dataUrl(path.join(webRoot, 'src', 'assets', 'originals', 'underconstruction_logo.png'));
  const obrCompetition = await dataUrl(path.join(webRoot, 'src', 'assets', 'originals', 'obr_logo.png'));
  const fllCompetition = await dataUrl(path.join(webRoot, 'src', 'assets', 'originals', 'fll_logo.png'));
  const fllBook = await dataUrl(path.join(webRoot, 'src', 'assets', 'originals', 'fll_book.png'));
  const obrBook = await dataUrl(path.join(webRoot, 'src', 'assets', 'originals', 'obr_book.png'));
  const underBook = await dataUrl(path.join(webRoot, 'src', 'assets', 'originals', 'underconstruction_book.png'));

  const examples = [
    {
      team: 'fll', filename: 'exemplo-registro-sesi-hortobots.pdf', teamLogo: fllTeam, competitionLogo: fllCompetition, book: fllBook,
      item: { id: 'sesi-hortobots', date: '2026-10-10', title: 'Planejamento da estratégia BIOGLOW', modality: 'FLL', createdBy: 'aluno-fll', summary: 'A equipe organizou a sequência de missões, avaliou os encaixes dos acessórios e definiu prioridades para os próximos ciclos de treino.', body: 'O encontro começou com a revisão das missões e a divisão das responsabilidades. Em seguida, foram comparadas rotas, tempos de troca e alternativas para reduzir movimentos desnecessários. As decisões foram registradas para orientar a próxima rodada de testes.', tags: ['team:fll', 'estratégia', 'programação', 'documentação'] }
    },
    {
      team: 'under', filename: 'exemplo-registro-under-construction.pdf', teamLogo: underTeam, competitionLogo: fllCompetition, book: underBook,
      item: { id: 'under-construction', date: '2026-10-10', title: 'Prototipagem do mecanismo modular', modality: 'FLL', createdBy: 'aluno-fll', summary: 'O grupo desenvolveu e comparou duas versões de um mecanismo modular para melhorar a precisão durante as missões da temporada.', body: 'Foram avaliados rigidez, facilidade de montagem, massa e repetibilidade. A segunda versão apresentou troca mais rápida e menor folga. O time documentou as medidas e separou os próximos ajustes para validação em campo.', tags: ['team:under', 'protótipo', 'mecânica', 'criatividade'] }
    },
    {
      team: 'obr', filename: 'exemplo-registro-hortobots-obr.pdf', teamLogo: obrTeam, competitionLogo: obrCompetition, book: obrBook,
      item: { id: 'hortobots-obr', date: '2026-10-10', title: 'Calibração do sensor e navegação', modality: 'OBR', createdBy: 'aluno-obr', summary: 'A equipe calibrou o sensor de refletância e comparou os valores observados em diferentes condições de iluminação e velocidade.', body: 'Após registrar a leitura de referência, o grupo ajustou o limiar do algoritmo e repetiu o percurso. A nova configuração reduziu oscilações nas curvas e tornou a resposta do robô mais previsível.', tags: ['team:obr', 'sensores', 'programação', 'navegação'] }
    }
  ];

  for (const example of examples) {
    const media = [{ name: 'Caderno da equipe', source: example.book, video: false }];
    const buffer = await renderToBuffer(React.createElement(ActivityDocument, { item: example.item, kind: 'record', team: example.team, media, teamLogo: example.teamLogo, competitionLogo: example.competitionLogo }));
    await writeFile(path.join(outputDir, example.filename), buffer);
  }
} finally {
  await vite.close();
}
