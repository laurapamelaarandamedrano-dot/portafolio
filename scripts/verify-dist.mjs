#!/usr/bin/env node
/**
 * Auditoría automática del build (se ejecuta después de `npm run build`).
 * Falla (exit 1) si encuentra cualquiera de estos problemas en dist/:
 *  - Imágenes con metadatos EXIF/XMP/GPS.
 *  - Textos prohibidos o pendientes (placeholders, términos excluidos del posicionamiento).
 *  - El teléfono en texto plano, en metadatos o en JSON-LD.
 *  - El selector de tema de desarrollo.
 *  - Recursos externos (scripts, estilos, imágenes, fuentes) o enlaces externos sin rel seguro.
 *  - Páginas sin CSP, sin form-action 'none' o con 'unsafe-inline'.
 *  - Scripts o estilos en línea ejecutables, o atributos style="".
 *  - Video del hero mayor a 2 MB.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { CSP_HEADER, CSP_META } from '../src/config/security.mjs';

const DIST = join(process.cwd(), 'dist');
const errors = [];
const fail = (file, msg) => errors.push(`${relative(DIST, file).replaceAll('\\', '/')}: ${msg}`);

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = await walk(DIST);
const ext = (f) => extname(f).toLowerCase();

// ---------- Imágenes: metadatos ----------
const META_MARKERS = ['Exif\0\0', '<x:xmpmeta', 'http://ns.adobe.com/xap/', 'GPSLatitude'];
for (const f of files.filter((x) => ['.jpg', '.jpeg', '.webp', '.avif', '.png'].includes(ext(x)))) {
  const bin = (await readFile(f)).toString('latin1');
  for (const m of META_MARKERS) if (bin.includes(m)) fail(f, `metadatos en imagen (${m.trim()})`);
  if (ext(f) === '.webp' && /EXIF|XMP /.test(bin.slice(12, 200))) fail(f, 'chunk EXIF/XMP en WebP');
}

// ---------- Video ----------
for (const f of files.filter((x) => ['.mp4', '.webm'].includes(ext(x)))) {
  if ((await stat(f)).size > 2 * 1024 * 1024) fail(f, 'video mayor a 2 MB');
}

// ---------- HTML ----------
const FORBIDDEN = [
  /\[EDITAR\]/i,
  /lorem ipsum/i,
  /\bTODO\b/,
  /\bplaceholder\b/i,
  /abogad[oa]s?/i,
  /\bbufete/i,
  /\blitigi/i,
  /\blawyer|\battorney|law firm/i,
  /\bRFC\b/,
  /persona f[ií]sica/i,
  /r[ée]gimen fiscal/i,
  // El sitio se presenta como equipo profesional; solo se excluye la imagen de firma legal.
  /nuestr[oa]s? (firma|despacho)/i,
  /\bour firm\b/i,
  // Estilo editorial: la trayectoria se redacta en pasado.
  /cargo actual|actualmente se desempeña|en funciones|currently serves|current role/i,
];
const PHONE_PLAIN = [/5654503432/, /56[\s.-]?5450[\s.-]?3432/, /\+52\s*56\s*5450/];

for (const f of files.filter((x) => ext(x) === '.html')) {
  const html = await readFile(f, 'utf8');
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const attrs = [...html.matchAll(/\b(?:alt|content|title|aria-label)="([^"]*)"/g)].map(
    (m) => m[1],
  );
  const visible = `${textOnly} ${attrs.join(' ')}`;

  for (const re of FORBIDDEN) if (re.test(visible)) fail(f, `texto prohibido: ${re}`);
  // "Despacho" solo se permite dentro del nombre oficial del cargo.
  if (/despacho/i.test(visible.replace(/Encargado de Despacho/g, ''))) {
    fail(f, '"despacho" fuera del cargo "Encargado de Despacho"');
  }

  // Teléfono: nunca en texto plano (va ofuscado), ni en meta ni en JSON-LD.
  for (const re of PHONE_PLAIN) if (re.test(html)) fail(f, `teléfono en texto plano (${re})`);
  if (/href="tel:/.test(html))
    fail(f, 'enlace tel: en el HTML estático (debe ensamblarse en cliente)');
  for (const m of html.matchAll(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    if (/telephone|\d{10}/.test(m[1])) fail(f, 'teléfono en JSON-LD');
  }

  // Selector de tema de desarrollo
  if (/data-theme-select|Tema \(dev\)/.test(html))
    fail(f, 'selector de tema de desarrollo en producción');

  // CSP
  const csp = html.match(/<meta http-equiv="content-security-policy" content="([^"]+)"/i);
  if (!csp) fail(f, 'falta CSP');
  else {
    const policy = csp[1];
    if (!/form-action 'none'/.test(policy)) fail(f, "CSP sin form-action 'none'");
    if (/unsafe-inline|unsafe-eval/.test(policy)) fail(f, 'CSP con unsafe-inline/unsafe-eval');
    if (!/default-src 'none'/.test(policy)) fail(f, "CSP sin default-src 'none'");
    if (!/script-src 'self';/.test(policy)) fail(f, "CSP: script-src debe ser solo 'self'");
    if (policy !== CSP_META) fail(f, 'CSP distinta de src/config/security.mjs');
    if (
      !/<head>\s*<meta charset="utf-8">\s*<meta http-equiv="content-security-policy"/i.test(html)
    ) {
      fail(f, 'la CSP no es el primer elemento del <head>');
    }
  }

  // Scripts y estilos en línea
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!/type="application\/ld\+json"/.test(m[1]) && m[2].trim()) fail(f, 'script en línea');
  }
  if (/<style[\s>]/.test(html)) fail(f, 'bloque <style> en línea');
  if (/\sstyle="/.test(html)) fail(f, 'atributo style="" en línea');

  // Recursos externos
  for (const m of html.matchAll(/<(script|img|source|link|iframe|video)\b[^>]*>/g)) {
    const tag = m[0];
    if (/<link\b/.test(tag) && /rel="(?:canonical|alternate)"/.test(tag)) continue;
    if (/\b(?:src|href|srcset)="(?:https?:)?\/\//.test(tag))
      fail(f, `recurso externo: ${tag.slice(0, 90)}`);
  }
  for (const m of html.matchAll(/<a\b[^>]*href="https?:\/\/[^"]*"[^>]*>/g)) {
    if (!/rel="noopener noreferrer"/.test(m[0]))
      fail(f, `enlace externo sin rel seguro: ${m[0].slice(0, 90)}`);
  }

  // Idioma y hreflang
  if (!/<html lang="(es-MX|en)"/.test(html)) fail(f, 'falta <html lang>');
  if (!/noindex/.test(html) && !/hreflang="x-default"/.test(html))
    fail(f, 'falta hreflang x-default');
}

// ---------- CSS: recursos externos ----------
for (const f of files.filter((x) => ext(x) === '.css')) {
  const css = await readFile(f, 'utf8');
  if (/url\(\s*["']?(?:https?:)?\/\//.test(css)) fail(f, 'url() externa en CSS');
  if (/@import\s+url\(\s*["']?https?:/.test(css)) fail(f, '@import externo en CSS');
}

// ---------- _headers coherente con la meta CSP ----------
try {
  const headers = await readFile(join(DIST, '_headers'), 'utf8');
  if (!headers.includes(`Content-Security-Policy: ${CSP_HEADER}`)) {
    fail(join(DIST, '_headers'), 'CSP desactualizada (ejecuta node scripts/gen-headers.mjs)');
  }
} catch {
  fail(join(DIST, '_headers'), 'falta _headers');
}

// ---------- Source maps ----------
for (const f of files.filter((x) => ext(x) === '.map')) fail(f, 'source map publicado');

const htmlCount = files.filter((x) => ext(x) === '.html').length;
if (errors.length) {
  console.error(`\nverify-dist: ${errors.length} problema(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`verify-dist: OK (${htmlCount} páginas, ${files.length} archivos revisados).`);
