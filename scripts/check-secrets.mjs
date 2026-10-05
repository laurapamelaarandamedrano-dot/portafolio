#!/usr/bin/env node
/**
 * Bloquea secretos antes de que lleguen al repositorio.
 *   node scripts/check-secrets.mjs           revisa todo el árbol del proyecto
 *   node scripts/check-secrets.mjs --staged  revisa solo lo preparado para commit (hook)
 * Sale con código 1 si encuentra algo sospechoso.
 */
import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';

const ROOT = process.cwd();
const SELF = 'scripts/check-secrets.mjs';
const SKIP_DIRS = new Set(['node_modules', 'dist', '.astro', '.git', '.lighthouseci']);
const BINARY = /\.(jpe?g|png|webp|avif|gif|ico|woff2?|ttf|otf|mp4|webm|pdf|zip)$/i;

const PATTERNS = [
  ['Llave privada', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/],
  ['AWS Access Key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Stripe secret', /\b(?:sk|rk)_live_[0-9A-Za-z]{20,}\b/],
  ['OpenAI/Anthropic key', /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}\b/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  [
    'Asignación de secreto',
    /\b(?:api[_-]?key|secret|token|passw(?:or)?d|client[_-]?secret)\b\s*[:=]\s*["'][^"'\s]{12,}["']/i,
  ],
];

const FORBIDDEN_FILES = [
  /^\.env$/,
  /^\.env\.(?!example$).+/,
  /\.(pem|key|p12|pfx)$/i,
  /^id_(rsa|ed25519)/,
];

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else out.push(relative(ROOT, full).replaceAll('\\', '/'));
  }
  return out;
}

function stagedFiles() {
  const out = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
    encoding: 'utf8',
  });
  return out.split('\n').filter(Boolean);
}

const files = process.argv.includes('--staged') ? stagedFiles() : await walk(ROOT);
const findings = [];

for (const file of files) {
  if (file === SELF) continue;
  if (FORBIDDEN_FILES.some((re) => re.test(basename(file)))) {
    findings.push(`${file}: archivo que no debe versionarse`);
    continue;
  }
  if (BINARY.test(file)) continue;
  let text;
  try {
    if ((await stat(join(ROOT, file))).size > 2_000_000) continue;
    text = await readFile(join(ROOT, file), 'utf8');
  } catch {
    continue;
  }
  text.split('\n').forEach((line, i) => {
    for (const [name, re] of PATTERNS) {
      if (re.test(line)) findings.push(`${file}:${i + 1}: posible ${name}`);
    }
  });
}

if (findings.length) {
  console.error('Posibles secretos detectados. Commit bloqueado:\n');
  for (const f of findings) console.error(`  - ${f}`);
  console.error(
    '\nSi es un falso positivo, ajusta el archivo o el patrón en scripts/check-secrets.mjs.',
  );
  process.exit(1);
}
console.log(`Sin secretos detectados (${files.length} archivos revisados).`);
