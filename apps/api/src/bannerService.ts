import JSZip from 'jszip';
import { PDFParse } from 'pdf-parse';
import PptxGenJS from 'pptxgenjs';

export type BannerFile = { name: string; type?: string; data: string };

export type BannerContent = {
  kicker: string;
  title: string;
  subtitle: string;
  problem: string;
  research: string[];
  innovation: string[];
  learning: string[];
  robotDesign: string[];
  footer: string;
};

const plain = (value: unknown) => String(value || '').replace(/\s+/g, ' ').trim();
const compactText = (value: string, max = 12_000) => plain(value).slice(0, max);

const decodeXml = (value: string) => value
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

const xmlText = (value: string) => decodeXml(value.replace(/<[^>]+>/g, ''));

async function extractDocx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const document = zip.file('word/document.xml');
  if (!document) throw new Error('Documento Word sem conteúdo principal.');
  const xml = await document.async('string');
  return xmlText(xml
    .replace(/<w:tab\b[^>]*\/>/g, '\t')
    .replace(/<w:br\b[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n'));
}

async function extractXlsx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const sharedXml = await zip.file('xl/sharedStrings.xml')?.async('string');
  const shared = sharedXml
    ? [...sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(match =>
        decodeXml([...(match[1] ?? '').matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(text => text[1] ?? '').join('')))
    : [];
  const sheetNames = Object.keys(zip.files).filter(name => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name)).sort();
  const rows: string[] = [];
  for (const name of sheetNames) {
    const sheetXml = await zip.file(name)?.async('string');
    if (!sheetXml) continue;
    for (const row of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const values = [...(row[1] ?? '').matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)].map(cell => {
        const type = /\bt="([^"]+)"/.exec(cell[1] ?? '')?.[1];
        const inline = /<is\b[^>]*>([\s\S]*?)<\/is>/.exec(cell[2] ?? '')?.[1];
        if (inline) return xmlText(inline);
        const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(cell[2] ?? '')?.[1] || '';
        return type === 's' ? shared[Number(raw)] || '' : decodeXml(raw);
      }).filter(Boolean);
      if (values.length) rows.push(values.join(' | '));
    }
  }
  return rows.join('\n');
}

const decodeFile = (file: BannerFile) => {
  const match = file.data.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match?.[2]) throw new Error(`Arquivo inválido: ${file.name}`);
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.byteLength > 8 * 1024 * 1024) throw new Error(`O arquivo ${file.name} excede 8 MB.`);
  return { buffer, mime: match[1] || file.type || '' };
};

export async function extractBannerFiles(files: BannerFile[] = []) {
  const extracted: string[] = [];
  for (const file of files.slice(0, 8)) {
    const { buffer, mime } = decodeFile(file);
    const extension = file.name.toLowerCase().split('.').pop() || '';
    try {
      if (extension === 'docx' || mime.includes('wordprocessingml')) {
        extracted.push(`${file.name}: ${compactText(await extractDocx(buffer), 5000)}`);
      } else if (['xlsx', 'xlsm'].includes(extension) || mime.includes('spreadsheet')) {
        extracted.push(`${file.name}: ${compactText(await extractXlsx(buffer), 5000)}`);
      } else if (extension === 'pdf' || mime === 'application/pdf') {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy();
        extracted.push(`${file.name}: ${compactText(result.text, 5000)}`);
      } else if (['txt', 'md', 'csv'].includes(extension) || mime.startsWith('text/')) {
        extracted.push(`${file.name}: ${compactText(buffer.toString('utf8'), 5000)}`);
      }
    } catch {
      extracted.push(`${file.name}: conteúdo não pôde ser extraído; use o nome do arquivo como referência.`);
    }
  }
  return compactText(extracted.join('\n'), 18_000);
}

const keywords = (text: string, count = 5) => {
  const stop = new Set('para com uma umas uns dos das que por como mais sobre entre nosso nossa seus suas esse essa isso este esta foram será sao são nao não projeto teste equipe robo robô'.split(' '));
  const words = plain(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9-]{4,}/g) || [];
  const rank = new Map<string, number>();
  words.forEach(word => { if (!stop.has(word)) rank.set(word, (rank.get(word) || 0) + 1); });
  return [...rank].sort((a, b) => b[1] - a[1]).slice(0, count).map(([word]) => word.replace(/^./, c => c.toUpperCase()));
};

const fallbackContent = (teamName: string, problem: string, research: string, robot: string): BannerContent => ({
  kicker: 'PESQUISA • INOVAÇÃO • NOVOS CONHECIMENTOS',
  title: teamName,
  subtitle: 'Da pergunta ao protótipo: investigar, construir, testar e evoluir',
  problem: compactText(problem, 240),
  research: keywords(research || problem, 5),
  innovation: ['Investigação aplicada', 'Solução centrada no problema', 'Iteração com evidências'],
  learning: ['Trabalho colaborativo', 'Decisões documentadas', 'Conhecimento compartilhado'],
  robotDesign: keywords(robot || research || problem, 5),
  footer: 'Engenharia com propósito, criatividade e impacto.'
});

const bannerSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['kicker', 'title', 'subtitle', 'problem', 'research', 'innovation', 'learning', 'robotDesign', 'footer'],
  properties: {
    kicker: { type: 'string', maxLength: 80 },
    title: { type: 'string', maxLength: 60 },
    subtitle: { type: 'string', maxLength: 130 },
    problem: { type: 'string', maxLength: 260 },
    research: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'string', maxLength: 65 } },
    innovation: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'string', maxLength: 65 } },
    learning: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'string', maxLength: 65 } },
    robotDesign: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'string', maxLength: 65 } },
    footer: { type: 'string', maxLength: 100 }
  }
};

export async function synthesizeBanner(input: {
  teamName: string;
  problem: string;
  research: string;
  robot: string;
  previous?: BannerContent;
}): Promise<{ content: BannerContent; generatedBy: 'openai' | 'fallback' }> {
  const fallback = fallbackContent(input.teamName, input.problem, input.research, input.robot);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { content: fallback, generatedBy: 'fallback' };

  const source = JSON.stringify({
    equipe: input.teamName,
    pergunta: compactText(input.problem, 900),
    pesquisa: compactText(input.research, 8000),
    designRobo: compactText(input.robot, 8000),
    bannerAtual: input.previous || undefined
  });
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: AbortSignal.timeout(25_000),
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_BANNER_MODEL || 'gpt-5-nano',
        store: false,
        max_output_tokens: 650,
        text: { verbosity: 'low', format: { type: 'json_schema', name: 'banner_content', strict: true, schema: bannerSchema } },
        input: [
          { role: 'developer', content: 'Sintetize em português do Brasil um banner científico escolar. Use frases curtas e palavras-chave concretas. Não invente resultados, números ou fontes. Preserve fatos do material. Em atualização, complemente e refine o conteúdo anterior.' },
          { role: 'user', content: source }
        ]
      })
    });
    if (!response.ok) throw new Error(`OpenAI ${response.status}`);
    const body = await response.json() as any;
    const outputText = body.output_text || body.output?.flatMap((item: any) => item.content || []).find((item: any) => item.type === 'output_text')?.text;
    if (!outputText) throw new Error('Resposta vazia');
    return { content: JSON.parse(outputText) as BannerContent, generatedBy: 'openai' };
  } catch (error) {
    console.warn('[Banner IA] Usando síntese local:', error instanceof Error ? error.message : error);
    return { content: fallback, generatedBy: 'fallback' };
  }
}

const addSection = (slide: any, title: string, items: string[], x: number, y: number, w: number, h: number, accent: string) => {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.08, fill: { color: 'FFFFFF', transparency: 4 }, line: { color: accent, transparency: 45, width: 1 } });
  slide.addText(title, { x: x + 0.25, y: y + 0.2, w: w - 0.5, h: 0.35, fontFace: 'Aptos Display', fontSize: 15, bold: true, color: accent, margin: 0 });
  slide.addText(items.map(item => ({ text: item, options: { bullet: { indent: 12 }, breakLine: true } })), { x: x + 0.25, y: y + 0.7, w: w - 0.5, h: h - 0.85, fontFace: 'Aptos', fontSize: 12, color: '193126', valign: 'top', breakLine: false, margin: 0.04, fit: 'shrink' });
};

export async function createBannerPptx(record: { widthCm: number; heightCm: number; content: BannerContent; teamKey: string; version: number }) {
  const width = Math.min(56, Math.max(4, record.widthCm / 2.54));
  const height = Math.min(56, Math.max(4, record.heightCm / 2.54));
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'BANNER', width, height });
  pptx.layout = 'BANNER';
  pptx.author = 'Hortobots Planning';
  pptx.subject = 'Banner editável para Canva';
  pptx.title = record.content.title;
  pptx.company = 'SESI Hortobots';
  const slide = pptx.addSlide();
  const accent = record.teamKey === 'under' ? '9D174D' : record.teamKey === 'obr' ? 'B42318' : '16794B';
  const dark = '071A11';
  slide.background = { color: 'F3F7EF' };
  slide.addShape('rect', { x: 0, y: 0, w: width, h: height * 0.2, fill: { color: dark }, line: { color: dark } });
  slide.addShape('arc', { x: width * 0.72, y: -height * 0.13, w: width * 0.42, h: height * 0.42, rotate: 25, fill: { color: accent, transparency: 14 }, line: { color: accent, transparency: 100 } });
  slide.addText(record.content.kicker, { x: width * 0.055, y: height * 0.035, w: width * 0.7, h: height * 0.035, fontFace: 'Aptos', fontSize: 10, bold: true, color: '9FE870', charSpacing: 1.5, margin: 0, fit: 'shrink' });
  slide.addText(record.content.title, { x: width * 0.055, y: height * 0.075, w: width * 0.82, h: height * 0.07, fontFace: 'Aptos Display', fontSize: 30, bold: true, color: 'FFFFFF', margin: 0, fit: 'shrink' });
  slide.addText(record.content.subtitle, { x: width * 0.055, y: height * 0.15, w: width * 0.8, h: height * 0.035, fontFace: 'Aptos', fontSize: 12, color: 'DCEADF', margin: 0, fit: 'shrink' });

  const margin = width * 0.055;
  const contentTop = height * 0.23;
  const gap = Math.max(0.18, width * 0.018);
  const colW = (width - margin * 2 - gap) / 2;
  const problemH = height * 0.16;
  slide.addShape('roundRect', { x: margin, y: contentTop, w: width - margin * 2, h: problemH, rectRadius: 0.08, fill: { color: accent, transparency: 4 }, line: { color: accent } });
  slide.addText('PERGUNTA-PROBLEMA', { x: margin + 0.3, y: contentTop + 0.18, w: width - margin * 2 - 0.6, h: 0.35, fontFace: 'Aptos', fontSize: 12, bold: true, color: 'FFFFFF', margin: 0 });
  slide.addText(record.content.problem, { x: margin + 0.3, y: contentTop + 0.62, w: width - margin * 2 - 0.6, h: problemH - 0.8, fontFace: 'Aptos Display', fontSize: 20, bold: true, color: 'FFFFFF', valign: 'middle', margin: 0, fit: 'shrink' });

  const gridTop = contentTop + problemH + gap;
  const sectionH = (height - gridTop - height * 0.09 - gap) / 2;
  addSection(slide, 'PESQUISA', record.content.research, margin, gridTop, colW, sectionH, accent);
  addSection(slide, 'INOVAÇÃO', record.content.innovation, margin + colW + gap, gridTop, colW, sectionH, accent);
  addSection(slide, 'NOVOS CONHECIMENTOS', record.content.learning, margin, gridTop + sectionH + gap, colW, sectionH, accent);
  addSection(slide, 'DESIGN DO ROBÔ', record.content.robotDesign, margin + colW + gap, gridTop + sectionH + gap, colW, sectionH, accent);
  slide.addText(record.content.footer, { x: margin, y: height - height * 0.065, w: width - margin * 2, h: height * 0.035, fontFace: 'Aptos', fontSize: 11, italic: true, color: dark, align: 'center', margin: 0, fit: 'shrink' });
  slide.addText(`Versão ${record.version} • cada texto, forma e bloco permanece editável no Canva`, { x: margin, y: height - height * 0.03, w: width - margin * 2, h: height * 0.02, fontFace: 'Aptos', fontSize: 7, color: '5F6F65', align: 'center', margin: 0, fit: 'shrink' });
  return pptx.write({ outputType: 'nodebuffer' }) as Promise<Buffer>;
}
