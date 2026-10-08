import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente (.env)
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://zinsqfrstpqbnrrxwtnk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET || 'hortobots-planning';

const supabase = createClient(supabaseUrl, supabaseKey);

// Formata data atual: DD-MM-YYYY
function getFormattedDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
}

async function runBackup() {
  console.log('====================================================');
  console.log('  HORTOBOTS PLANNING - SISTEMA DE BACKUP AUTOMATIZADO');
  console.log('====================================================');
  console.log(`Conectando ao Supabase: ${supabaseUrl}`);

  const dateStr = getFormattedDate();
  const zipFileName = `planning-data-${dateStr}.zip`;
  const outDir = path.resolve(__dirname, '../backups');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const zipFilePath = path.join(outDir, zipFileName);
  const output = fs.createWriteStream(zipFilePath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  output.on('close', () => {
    const sizeMb = (archive.pointer() / (1024 * 1024)).toFixed(2);
    console.log(`\n✅ Backup concluído com sucesso!`);
    console.log(`📦 Arquivo gerado: ${zipFileName} (${sizeMb} MB)`);
    console.log(`📁 Caminho local: ${zipFilePath}`);
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('Aviso no arquivo:', err);
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  // 1. Exportar Tabelas do Banco de Dados
  console.log('\n[1/4] Extraindo registros do diário de bordo (records)...');
  const { data: records, error: recErr } = await supabase.from('records').select('*').order('created_at', { ascending: false });
  if (recErr) console.warn('Aviso ao ler records:', recErr.message);
  archive.append(JSON.stringify(records || [], null, 2), { name: 'database/records.json' });

  console.log('[2/4] Extraindo testes técnicos e simulações (tests)...');
  const { data: tests, error: testErr } = await supabase.from('tests').select('*').order('created_at', { ascending: false });
  if (testErr) console.warn('Aviso ao ler tests:', testErr.message);
  archive.append(JSON.stringify(tests || [], null, 2), { name: 'database/tests.json' });

  console.log('[3/4] Extraindo eventos do calendário (events)...');
  const { data: events, error: evErr } = await supabase.from('events').select('*').order('created_at', { ascending: false });
  if (evErr) console.warn('Aviso ao ler events:', evErr.message);
  archive.append(JSON.stringify(events || [], null, 2), { name: 'database/events.json' });

  // 2. Exportar Mídias do Supabase Storage
  console.log('\n[4/4] Baixando arquivos de mídia do Storage (vídeos e imagens)...');

  async function listAllFiles(prefix = '') {
    const files = [];
    const { data, error } = await supabase.storage.from(supabaseBucket).list(prefix, { limit: 200 });
    if (error || !data) return files;

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        // É uma subpasta
        const subFiles = await listAllFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  let mediaFiles = [];
  try {
    mediaFiles = await listAllFiles('');
    console.log(`Encontrados ${mediaFiles.length} arquivos de mídia no Supabase Storage.`);
  } catch (err) {
    console.warn('Erro ao listar mídias:', err);
  }

  for (let i = 0; i < mediaFiles.length; i++) {
    const filePath = mediaFiles[i];
    process.stdout.write(`  Baixando [${i + 1}/${mediaFiles.length}]: ${filePath} ... `);
    try {
      const { data: fileBlob, error: dlErr } = await supabase.storage.from(supabaseBucket).download(filePath);
      if (!dlErr && fileBlob) {
        const buffer = Buffer.from(await fileBlob.arrayBuffer());
        archive.append(buffer, { name: `storage/${filePath}` });
        process.stdout.write('OK\n');
      } else {
        process.stdout.write(`FALHA (${dlErr?.message})\n`);
      }
    } catch (e) {
      process.stdout.write(`ERRO (${e.message})\n`);
    }
  }

  // Manifesto do Backup com Metadados
  const manifest = {
    backupName: zipFileName,
    date: dateStr,
    generatedAt: new Date().toISOString(),
    recordCount: records?.length || 0,
    testCount: tests?.length || 0,
    eventCount: events?.length || 0,
    mediaFileCount: mediaFiles.length,
    storageBucket: supabaseBucket
  };
  archive.append(JSON.stringify(manifest, null, 2), { name: 'MANIFEST.json' });

  console.log('\nFinalizando compactação ZIP...');
  await archive.finalize();
}

runBackup().catch((err) => {
  console.error('\n❌ Erro durante a geração do backup:', err);
  process.exit(1);
});
