#!/usr/bin/env node
/** Activa los hooks de .githooks (se ejecuta con `npm install`). Si no hay Git, no falla. */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (process.env.CI) process.exit(0);
if (!existsSync('.git')) {
  console.log(
    'setup-hooks: aún no es un repositorio Git. Tras `git init`, ejecuta `npm run prepare`.',
  );
  process.exit(0);
}
try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
  console.log('setup-hooks: hook pre-commit activo (.githooks/pre-commit).');
} catch {
  console.log('setup-hooks: Git no está disponible; el hook no se activó.');
}
