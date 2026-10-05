# Salvador J. Vazquez Villa: sitio personal

Sitio estático en [Astro](https://astro.build), bilingüe (español es-MX por defecto, inglés en `/en/`), sin formularios, sin cookies, sin analítica y sin servicios de terceros. El único canal de contacto es el teléfono.

## Publicar (resumen)

| Dónde | Qué hacer |
| --- | --- |
| **Netlify / Vercel / Cloudflare Pages** | Conecta el repositorio. El build y las cabeceras ya están configurados (`netlify.toml`, `vercel.json`, `_headers`). Solo agrega la variable `SITE_URL` con el dominio. |
| **GitHub Pages** | Settings → Pages → Source: *GitHub Actions*. Listo: la URL se calcula sola. Cada push a `main` publica. Para dominio propio, agrega la variable `CUSTOM_DOMAIN`. |
| **cPanel / cualquier hosting** | `npm ci` y luego `npm run build` con `SITE_URL` definido. Sube el **contenido** de `dist/`, incluidos los archivos ocultos (`.htaccess`, `.well-known/`). |

Guía completa, DNS y cabeceras para Nginx: `docs/hosting.md`.

## Requisitos

- Node.js 22.12 o superior (recomendado 24, ver `.nvmrc`).
- Git (opcional, necesario para activar el hook anti-secretos).

## Comandos

```bash
npm ci               # instala las dependencias exactas del lockfile
npm run dev          # desarrollo en http://localhost:4321 (incluye selector de tema)
npm run build        # limpia EXIF, verifica contraste, genera _headers, astro check, build y auditoría de dist/
npm run preview      # sirve dist/ localmente
npm run lint         # ESLint
npm run format       # Prettier
npm run check:secrets
npm audit
```

`npm run build` falla si encuentra fotos con metadatos, contraste insuficiente, errores de tipos, textos prohibidos o pendientes, el teléfono en texto plano o en metadatos, recursos externos, scripts en línea o una CSP incorrecta (`scripts/verify-dist.mjs`).

## Cómo editar el contenido (sin tocar código)

Todo el texto vive en `src/content/`, con una versión por idioma:

| Qué | Español | Inglés |
| --- | --- | --- |
| Páginas (Inicio, Proyectos, Experiencia, Filosofía, Perfil, Contacto, Aviso de privacidad) | `src/content/pages/es/*.md` | `src/content/pages/en/*.md` |
| Proyectos, Capacidades y Casos de seguimiento | `src/content/projects/es/*.md` | `src/content/projects/en/*.md` |
| Cargos (línea de tiempo) | `src/content/experience/es/*.md` | `src/content/experience/en/*.md` |
| Textos de interfaz (menú, botones, accesibilidad) | `src/i18n/es.json` | `src/i18n/en.json` |
| **Teléfono** (un solo lugar para todo el sitio) | `src/content/contact/contact.json` | (compartido) |

Reglas:

- Cada archivo `.md` tiene un encabezado (`---`) con campos. Edita los valores y conserva los nombres de los campos.
- Si falta un texto obligatorio en un idioma, el build falla en lugar de publicar algo vacío.
- Un proyecto nuevo necesita **dos archivos**, uno en `es/` y otro en `en/`, con el mismo `translationKey`. El campo `route` es la parte final de la URL (minúsculas y guiones).
- Las fotos van en `src/assets/photos/` y se referencian con ruta relativa desde el `.md` (por ejemplo, `../../../assets/photos/foto.jpeg`). Escribe siempre el texto alternativo (`coverAlt` / `alt`) en ambos idiomas.

## Cambiar el tema de color

Hay tres paletas en **un solo archivo**: `src/styles/tokens.css`.

- Tema 1 `azul`: azul, blanco y dorado (**por defecto**).
- Tema 2 `terracota`: café terracota, guinda y blanco.
- Tema 3 `petroleo`: petróleo, piedra y latón (ver `docs/investigacion.md`).

**Para cambiar el tema por defecto**, edita una sola línea en `src/config/site.ts`:

```ts
export const DEFAULT_THEME: Theme = 'azul'; // 'azul' | 'terracota' | 'petroleo'
```

En `npm run dev` aparece un selector de tema (abajo a la derecha) para comparar las paletas. Solo existe en desarrollo y el build verifica que no llegue a producción. Si cambias colores, ejecuta `npm run check:contrast`.

## Video opcional del hero

Si colocas `src/assets/video/hero-loop.mp4` (silencioso, de 2 MB como máximo), el hero lo reproduce en bucle, sin audio, con la foto como póster. La CSP habilita `media-src 'self'` automáticamente. Con `prefers-reduced-motion` se muestra la imagen estática. El build falla si el video pesa más de 2 MB.

## Seguridad

- CSP estricta en `src/config/security.mjs` (meta en cada página y `public/_headers`, generado). Ver `docs/hosting.md` para Nginx/Apache.
- Sin scripts ni estilos en línea, sin recursos externos y sin secretos.
- Hook `pre-commit` (`.githooks/pre-commit`) que bloquea secretos y fotos con metadatos. Se activa con `npm install` dentro de un repositorio Git (o con `npm run prepare` después de `git init`).
- Dependencias con versión exacta, Dependabot (`.github/dependabot.yml`) y acciones de GitHub fijadas por SHA.
- `/.well-known/security.txt` se genera en cada build (contacto: página de Contacto). Reconstruye al menos una vez al año.

## Despliegue

Consulta `docs/hosting.md`: GitHub Pages (workflow incluido), cualquier hosting o cPanel, y Netlify, Vercel o Cloudflare. Configura `SITE_URL` con el dominio real antes de publicar.

## Documentación interna

- `docs/investigacion.md`: investigación de color, tipografía y conversión.
- `docs/hosting.md`: despliegue y cabeceras.

Tipografía: Montserrat (SIL Open Font License 1.1, `src/assets/fonts/OFL.txt`), autoalojada.
