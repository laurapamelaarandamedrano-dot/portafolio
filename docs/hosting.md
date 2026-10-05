# Despliegue y hosting

El sitio es 100 % estático: `npm run build` genera la carpeta `dist/`, que puede servirse desde cualquier hosting. No hay servidor, base de datos ni secretos.

## Variables de despliegue

| Variable | Para qué | Ejemplo |
| --- | --- | --- |
| `SITE_URL` | URL pública, sin barra final. Se usa en canonical, hreflang, sitemap, Open Graph, robots.txt y security.txt. | `https://www.tu-dominio.com` |
| `BASE_PATH` | Subruta donde vive el sitio. `/` para un dominio propio. | `/` o `/portafolio/` |

Si no se definen, se usan `https://salvadorvazquezvilla.com` y `/` (ver `astro.config.mjs`). **Antes de publicar, ajusta `SITE_URL` al dominio real.**

```bash
# Ejemplo local (PowerShell): $env:SITE_URL="https://www.tu-dominio.com"; npm run build
SITE_URL=https://www.tu-dominio.com BASE_PATH=/ npm run build
```

---

## (a) GitHub Pages

1. Sube el proyecto a un repositorio en GitHub (rama `main`).
2. En **Settings → Pages → Build and deployment**, elige **Source: GitHub Actions**.
3. **No necesitas variables.** El workflow deduce solo la URL: `https://USUARIO.github.io/NOMBRE-DEL-REPO/` (o `https://USUARIO.github.io/` si el repositorio se llama `USUARIO.github.io`). Opcionalmente, en **Settings → Secrets and variables → Actions → Variables**:
   - `CUSTOM_DOMAIN`: `www.tu-dominio.com` para usar dominio propio. El workflow crea `dist/CNAME` y usa la raíz `/` (ver `docs/CNAME.example`).
   - `SITE_URL` / `BASE_PATH`: solo si necesitas forzar otros valores.
4. Haz push a `main`. El workflow `.github/workflows/deploy.yml` revisa secretos, lint, `npm audit`, tipos y el build (incluida la auditoría `verify-dist`), y luego publica.
5. Con dominio propio, activa **Enforce HTTPS** en Settings → Pages.

> **Limitación:** GitHub Pages no permite cabeceras HTTP personalizadas. La CSP sigue activa por `<meta>`, pero `frame-ancestors`, HSTS y el resto de cabeceras no se aplican. Si necesitas esa capa, usa Cloudflare delante de GitHub Pages o elige la opción (c).

## (b) Cualquier hosting o cPanel

1. En tu computadora: `npm ci && npm run build` (con `SITE_URL` correcto).
2. Sube **el contenido** de `dist/` (no la carpeta) a `public_html/` o a la carpeta raíz del dominio, por el administrador de archivos o FTP/SFTP.
3. Verifica que se haya subido la carpeta oculta `.well-known/`.
4. Activa HTTPS (AutoSSL / Let's Encrypt en cPanel).
5. El `.htaccess` con las cabeceras de seguridad y la redirección a HTTPS **ya viene dentro de `dist/`** (Apache/LiteSpeed, lo normal en cPanel). Asegúrate de subir también los archivos ocultos (`.htaccess`, `.well-known/`). En Nginx usa el ejemplo de abajo.

## (c) Netlify, Vercel o Cloudflare Pages

| Plataforma | Comando de build | Carpeta de salida | Cabeceras |
| --- | --- | --- | --- |
| Netlify | `npm run build` (ya en `netlify.toml`) | `dist` | Automáticas con `dist/_headers` |
| Cloudflare Pages | `npm run build` | `dist` | Automáticas con `dist/_headers` |
| Vercel | `npm run build` (ya en `vercel.json`) | `dist` | Automáticas con `vercel.json` |

Define `SITE_URL` (y `BASE_PATH=/`) como variables de entorno del proyecto en la plataforma. Usa Node 22 o superior (`.nvmrc` indica 24).

`public/_headers`, `public/.htaccess` y `vercel.json` se **generan en cada build** desde `src/config/security.mjs`, así que las tres plataformas aplican exactamente la misma política.

---

## Qué debe configurar quien administra el dominio

1. **DNS**
   - GitHub Pages: registros `A` del dominio raíz a `185.199.108.153`, `185.199.109.153`, `185.199.110.153` y `185.199.111.153`, y `CNAME` de `www` a `USUARIO.github.io`.
   - Netlify, Vercel, Cloudflare o cPanel: los registros que indique el panel de cada proveedor.
   - Recomendado: un registro `CAA` que autorice solo a la autoridad certificadora que use el hosting (por ejemplo, `letsencrypt.org`).
2. **HTTPS** obligatorio, con redirección de `http://` a `https://` y de `tu-dominio.com` a `www.tu-dominio.com` (o al revés, pero una sola forma).
3. **HSTS**: activarlo solo cuando HTTPS funcione bien en todos los subdominios. Agregar `preload` solo después de comprobarlo.
4. **Cabeceras de seguridad**: las de esta guía.
5. **Rotación anual**: reconstruye y publica al menos una vez al año para renovar `Expires` en `/.well-known/security.txt`.

---

## Cabeceras de seguridad

La fuente única es `src/config/security.mjs`. Valor actual de la CSP (cabecera HTTP):

```
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests; frame-ancestors 'none'
```

Si se agrega el video del hero (`src/assets/video/hero-loop.mp4`), `media-src` pasa automáticamente a `'self'` en la meta y en `_headers`. En Nginx o Apache cámbialo a mano.

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name www.tu-dominio.com;
    root /var/www/portafolio/dist;
    index index.html;

    add_header Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests; frame-ancestors 'none'" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()" always;
    add_header X-Frame-Options "DENY" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    server_tokens off;

    location / {
        try_files $uri $uri/ =404;
    }
    location /_astro/ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        # add_header en un location reemplaza los heredados: repite los de seguridad
        add_header X-Content-Type-Options "nosniff" always;
    }
    error_page 404 /404.html;
}
```

### Apache (referencia; el `.htaccess` real se genera solo en `dist/`)

```apache
<IfModule mod_headers.c>
  Header always set Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests; frame-ancestors 'none'"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()"
  Header always set X-Frame-Options "DENY"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains" "expr=%{HTTPS} == 'on'"
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

ErrorDocument 404 /404.html
Options -Indexes
ServerSignature Off
```

## Verificación después de publicar

- https://securityheaders.com: debe mostrar todas las cabeceras (excepto en GitHub Pages).
- https://observatory.mozilla.org
- `https://tu-dominio/.well-known/security.txt` y `https://tu-dominio/robots.txt` responden.
- Lighthouse en una ventana de incógnito.
