/**
 * ÚNICA fuente de la política de seguridad.
 * - BaseLayout la inserta como <meta http-equiv="content-security-policy"> (primer elemento del <head>).
 * - scripts/gen-headers.mjs la escribe en public/_headers (Netlify / Cloudflare Pages).
 * - docs/hosting.md muestra la equivalente para Nginx/Apache.
 *
 * El sitio no tiene scripts ni estilos en línea (lo verifica scripts/verify-dist.mjs),
 * por eso la política no necesita hashes, nonces ni 'unsafe-inline'.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Video opcional del hero. Si existe, la CSP permite media del mismo origen. */
export const HAS_HERO_VIDEO = existsSync(join(process.cwd(), 'src/assets/video/hero-loop.mp4'));

const DIRECTIVES = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  // 'self' (no 'none'): herramientas como Lighthouse leen /robots.txt desde la página.
  // Solo permite el mismo origen; el sitio no hace peticiones de red propias.
  "connect-src 'self'",
  "manifest-src 'self'",
  HAS_HERO_VIDEO ? "media-src 'self'" : "media-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  'upgrade-insecure-requests',
];

/** Para <meta>: frame-ancestors no tiene efecto en meta, va solo en el header. */
export const CSP_META = DIRECTIVES.join('; ');

/** Para cabeceras HTTP. */
export const CSP_HEADER = [...DIRECTIVES, "frame-ancestors 'none'"].join('; ');

export const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP_HEADER,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
