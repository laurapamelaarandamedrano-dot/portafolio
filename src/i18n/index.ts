import es from './es.json';
import en from './en.json';

export const LANGS = ['es', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'es';

/** Etiquetas BCP 47 para `<html lang>` y hreflang. */
export const HREFLANG: Record<Lang, string> = { es: 'es-MX', en: 'en' };

type Key = keyof typeof es;
const dictionaries: Record<Lang, Record<Key, string>> = { es, en };

export function t(lang: Lang, key: Key): string {
  return dictionaries[lang][key];
}

/** Rutas equivalentes por idioma (sin `base`). */
export const ROUTES = {
  home: { es: '/', en: '/en/' },
  projects: { es: '/proyectos/', en: '/en/projects/' },
  experience: { es: '/experiencia/', en: '/en/experience/' },
  philosophy: { es: '/filosofia/', en: '/en/philosophy/' },
  profile: { es: '/perfil/', en: '/en/about/' },
  contact: { es: '/contacto/', en: '/en/contact/' },
  privacy: { es: '/aviso-de-privacidad/', en: '/en/privacy/' },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteKey = keyof typeof ROUTES;

export function projectPath(lang: Lang, slug: string): string {
  return `${ROUTES.projects[lang]}${slug}/`;
}

/** Antepone el `base` configurado (GitHub Pages en subruta o raíz). */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path}`;
}

export function href(lang: Lang, key: RouteKey): string {
  return withBase(ROUTES[key][lang]);
}

/** Navegación principal: máximo 6 ítems. */
export const NAV: RouteKey[] = ['projects', 'experience', 'philosophy', 'profile', 'contact'];
