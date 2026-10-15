import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { createBannerPptx, extractBannerFiles } from './bannerService.js';

const dataUrl = (buffer: Buffer, mime: string) => `data:${mime};base64,${buffer.toString('base64')}`;

describe('banner service', () => {
  it('extracts useful text from DOCX and XLSX without executing document content', async () => {
    const docx = new JSZip();
    docx.file('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>Pesquisa sobre biodiversidade</w:t></w:r></w:p></w:body></w:document>');
    const docxBuffer = await docx.generateAsync({ type: 'nodebuffer' });

    const xlsx = new JSZip();
    xlsx.file('xl/sharedStrings.xml', '<sst><si><t>Teste do sensor de cor</t></si></sst>');
    xlsx.file('xl/worksheets/sheet1.xml', '<worksheet><sheetData><row><c t="s"><v>0</v></c><c><v>87</v></c></row></sheetData></worksheet>');
    const xlsxBuffer = await xlsx.generateAsync({ type: 'nodebuffer' });

    const result = await extractBannerFiles([
      { name: 'pesquisa.docx', data: dataUrl(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') },
      { name: 'testes.xlsx', data: dataUrl(xlsxBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') }
    ]);

    expect(result).toContain('Pesquisa sobre biodiversidade');
    expect(result).toContain('Teste do sensor de cor | 87');
  });

  it('exports a valid editable PPTX package', async () => {
    const output = await createBannerPptx({
      teamKey: 'challenge',
      version: 1,
      widthCm: 90,
      heightCm: 120,
      content: {
        kicker: 'PESQUISA • INOVAÇÃO • NOVOS CONHECIMENTOS',
        title: 'SESI Biotech',
        subtitle: 'Da pergunta ao protótipo',
        problem: 'Como preservar a biodiversidade perto da escola?',
        research: ['Mapeamento de espécies', 'Entrevistas'],
        innovation: ['Protótipo iterativo', 'Impacto local'],
        learning: ['Método científico', 'Colaboração'],
        robotDesign: ['Sensor de cor', 'Testes repetidos'],
        footer: 'Engenharia com propósito.'
      }
    });

    expect(Buffer.isBuffer(output)).toBe(true);
    expect(output.subarray(0, 2).toString()).toBe('PK');
    const archive = await JSZip.loadAsync(output);
    expect(archive.file('ppt/slides/slide1.xml')).toBeTruthy();
  });
});
