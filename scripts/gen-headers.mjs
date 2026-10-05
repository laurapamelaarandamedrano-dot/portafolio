#!/usr/bin/env node
/**
 * Genera la configuración de cabeceras de seguridad para cada tipo de hosting,
 * siempre desde la misma fuente: src/config/security.mjs.
 *
 *   public/_headers   Netlify y Cloudflare Pages
 *   public/.htaccess  Apache / cPanel (se publica dentro de dist/)
 *   vercel.json       Vercel
 *
 * Se ejecuta en cada `npm run build` (prebuild). No editar a mano los archivos generados.
 */
import { writeFile } from 'node:fs/promises';
import { SECURITY_HEADERS } from '../src/config/security.mjs';

const HEADER_NOTE =
  'Generado por scripts/gen-headers.mjs desde src/config/security.mjs. No editar a mano.';
const CACHE_IMMUTABLE = 'public, max-age=31536000, immutable';
const entries = Object.entries(SECURITY_HEADERS);

// ---------- Netlify / Cloudflare Pages ----------
const headers = [
  `# ${HEADER_NOTE}`,
  '/*',
  ...entries.map(([k, v]) => `  ${k}: ${v}`),
  '',
  '/_astro/*',
  `  Cache-Control: ${CACHE_IMMUTABLE}`,
  '',
];
await writeFile(new URL('../public/_headers', import.meta.url), headers.join('\n'), 'utf8');

// ---------- Apache / cPanel ----------
const escape = (v) => v.replaceAll('"', '\\"');
const htaccess = [
  `# ${HEADER_NOTE}`,
  'Options -Indexes',
  'DirectoryIndex index.html',
  'ErrorDocument 404 /404.html',
  '',
  '<IfModule mod_rewrite.c>',
  '  RewriteEngine On',
  '  # Fuerza HTTPS (compatible con hostings detrás de proxy).',
  '  RewriteCond %{HTTPS} off',
  '  RewriteCond %{HTTP:X-Forwarded-Proto} !https',
  '  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
  '</IfModule>',
  '',
  '<IfModule mod_headers.c>',
  ...entries
    .filter(([k]) => k !== 'Strict-Transport-Security')
    .map(([k, v]) => `  Header always set ${k} "${escape(v)}"`),
  `  Header always set Strict-Transport-Security "${escape(
    SECURITY_HEADERS['Strict-Transport-Security'],
  )}" "expr=%{HTTPS} == 'on'"`,
  '  <FilesMatch "\\.(js|css|woff2|avif|webp|jpe?g|png|svg)$">',
  '    <If "%{REQUEST_URI} =~ m#/_astro/#">',
  `      Header set Cache-Control "${CACHE_IMMUTABLE}"`,
  '    </If>',
  '  </FilesMatch>',
  '</IfModule>',
  '',
];
await writeFile(new URL('../public/.htaccess', import.meta.url), htaccess.join('\n'), 'utf8');

// ---------- Vercel ----------
const vercel = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  trailingSlash: true,
  headers: [
    { source: '/(.*)', headers: entries.map(([key, value]) => ({ key, value })) },
    { source: '/_astro/(.*)', headers: [{ key: 'Cache-Control', value: CACHE_IMMUTABLE }] },
  ],
};
await writeFile(
  new URL('../vercel.json', import.meta.url),
  `${JSON.stringify(vercel, null, 2)}\n`,
  'utf8',
);

console.log('Cabeceras generadas: public/_headers, public/.htaccess, vercel.json');
