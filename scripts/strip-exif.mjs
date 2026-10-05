#!/usr/bin/env node
/**
 * Elimina metadatos (EXIF/GPS, XMP, IPTC, comentarios) de las fotos fuente.
 *
 * - JPEG: elimina segmentos APP1 (Exif/XMP), APP3–APP13, APP15 y COM sin
 *   recomprimir (sin pérdida). Conserva APP0 (JFIF), APP2 (perfil ICC) y
 *   APP14 (Adobe), necesarios para mostrar el color correctamente.
 * - Si una foto depende de la orientación EXIF (≠ 1), se rota físicamente con
 *   sharp antes de quitar los metadatos, para que no se vea girada.
 * - Es idempotente: si una foto ya está limpia, no se reescribe.
 *
 * Uso:
 *   node scripts/strip-exif.mjs           limpia src/assets/photos
 *   node scripts/strip-exif.mjs --check   solo verifica (exit 1 si hay metadatos)
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PHOTOS_DIR = new URL('../src/assets/photos/', import.meta.url);
const CHECK_ONLY = process.argv.includes('--check');

const KEEP_APP = new Set([0xe0, 0xe2, 0xee]); // APP0, APP2 (ICC), APP14

/** Recorre los segmentos de un JPEG hasta SOS. */
export function* jpegSegments(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('No es un JPEG válido');
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new Error(`Marcador inválido en ${i}`);
    const marker = buf[i + 1];
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      yield { marker, start: i, end: i + 2 };
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    yield { marker, start: i, end: i + 2 + len };
    if (marker === 0xda) {
      yield { marker: 'scan', start: i + 2 + len, end: buf.length };
      return;
    }
    i += 2 + len;
  }
}

function isMetadataMarker(marker) {
  if (marker === 0xfe) return true; // COM
  return typeof marker === 'number' && marker >= 0xe1 && marker <= 0xef && !KEEP_APP.has(marker);
}

function exifOrientation(buf, seg) {
  const data = buf.subarray(seg.start + 4, seg.end);
  if (data.subarray(0, 6).toString('latin1') !== 'Exif\0\0') return 1;
  const tiff = data.subarray(6);
  const le = tiff.toString('latin1', 0, 2) === 'II';
  const u16 = (o) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
  const ifd = u32(4);
  const count = u16(ifd);
  for (let n = 0; n < count; n++) {
    const e = ifd + 2 + n * 12;
    if (u16(e) === 0x0112) return u16(e + 8);
  }
  return 1;
}

export function inspectJpeg(buf) {
  const found = [];
  let orientation = 1;
  for (const seg of jpegSegments(buf)) {
    if (isMetadataMarker(seg.marker)) {
      found.push(`0x${seg.marker.toString(16)}`);
      if (seg.marker === 0xe1) orientation = Math.max(orientation, exifOrientation(buf, seg));
    }
  }
  return { found, orientation };
}

function stripJpeg(buf) {
  // jpegSegments() empieza después de SOI (FF D8): hay que conservarlo explícitamente.
  const parts = [buf.subarray(0, 2)];
  for (const seg of jpegSegments(buf)) {
    if (!isMetadataMarker(seg.marker)) parts.push(buf.subarray(seg.start, seg.end));
  }
  const out = Buffer.concat(parts);
  // Autoverificación: debe seguir siendo un JPEG válido y sin metadatos.
  if (out[0] !== 0xff || out[1] !== 0xd8 || inspectJpeg(out).found.length > 0) {
    throw new Error('La limpieza produjo un JPEG inválido; no se escribió el archivo.');
  }
  return out;
}

const files = (await readdir(PHOTOS_DIR)).filter((f) =>
  ['.jpg', '.jpeg'].includes(extname(f).toLowerCase()),
);
let dirty = 0;

for (const name of files) {
  const path = join(fileURLToPath(PHOTOS_DIR), name);
  let buf = await readFile(path);
  const { found, orientation } = inspectJpeg(buf);
  if (found.length === 0) {
    console.log(`ok      ${name}`);
    continue;
  }
  dirty++;
  if (CHECK_ONLY) {
    console.log(`SUCIA   ${name} → ${found.join(', ')}`);
    continue;
  }
  if (orientation !== 1) {
    const { default: sharp } = await import('sharp');
    buf = await sharp(buf).rotate().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
    console.log(`rotada  ${name} (orientación EXIF ${orientation})`);
  }
  const clean = stripJpeg(buf);
  await writeFile(path, clean);
  console.log(`limpia  ${name} (eliminado: ${found.join(', ')})`);
}

if (CHECK_ONLY && dirty > 0) {
  console.error(`\n${dirty} foto(s) conservan metadatos. Ejecuta: npm run photos:strip`);
  process.exit(1);
}
