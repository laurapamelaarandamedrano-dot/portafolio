// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Despliegue neutro: estas dos variables definen dónde vive el sitio.
 *
 *   SITE_URL   URL pública sin barra final. Ej.: https://usuario.github.io
 *   BASE_PATH  Subruta. "/" para dominio propio, "/portafolio/" para GitHub Pages
 *              en un repositorio de proyecto.
 *
 * Ver docs/hosting.md.
 *
 * Seguridad: la CSP vive en src/config/security.mjs (meta en BaseLayout + public/_headers).
 */
const SITE_URL = process.env.SITE_URL || 'https://salvadorvazquezvilla.com';
const BASE_PATH = process.env.BASE_PATH || '/';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
    // Sin CSS en línea: todo como archivo externo, compatible con style-src 'self'.
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Evita que Vite incruste scripts o recursos como data: URI.
      assetsInlineLimit: 0,
    },
  },
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-MX', en: 'en' },
      },
      filter: (page) => !page.includes('/404'),
    }),
  ],
  // Sin resaltado de código: Shiki usa estilos en línea incompatibles con la CSP.
  markdown: { syntaxHighlight: false },
  devToolbar: { enabled: false },
  prefetch: false,
});
