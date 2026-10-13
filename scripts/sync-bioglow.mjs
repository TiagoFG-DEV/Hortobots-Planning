import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.resolve(process.env.BIOGLOW_SOURCE_DIR || path.join(repositoryRoot, '..', 'BIOGLOW-site'));
const sourcePackage = path.join(sourceRoot, 'package.json');
const sourceDist = path.join(sourceRoot, 'dist');
const target = path.join(repositoryRoot, 'apps', 'web', 'public', 'bioglow');

try {
  await readFile(sourcePackage, 'utf8');
} catch {
  throw new Error(`Repositório BIOGLOW não encontrado em: ${sourceRoot}`);
}

const buildCommand = process.platform === 'win32'
  ? { command: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', 'npm run build'] }
  : { command: 'npm', args: ['run', 'build'] };
const build = spawnSync(buildCommand.command, buildCommand.args, {
  cwd: sourceRoot,
  env: { ...process.env, VITE_BASE_PATH: '/bioglow/' },
  stdio: 'inherit'
});

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(sourceDist, target, { recursive: true });

const revision = spawnSync('git', ['rev-parse', 'HEAD'], {
  cwd: sourceRoot,
  encoding: 'utf8'
}).stdout.trim();

await writeFile(path.join(target, 'source.json'), `${JSON.stringify({
  repository: 'https://github.com/Hortobots/BIOGLOW-site',
  revision
}, null, 2)}\n`);

console.log(`BIOGLOW ${revision.slice(0, 7)} sincronizado em ${target}`);
