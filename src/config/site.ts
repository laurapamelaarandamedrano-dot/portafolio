/**
 * Configuración central del sitio.
 *
 * TEMA POR DEFECTO: cambia `DEFAULT_THEME` y vuelve a construir.
 * Opciones: 'azul' (Tema 1) · 'terracota' (Tema 2) · 'petroleo' (Tema 3).
 */
export const THEMES = ['azul', 'terracota', 'petroleo'] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'azul';

export const PERSON_NAME = 'Salvador J. Vazquez Villa';

/** CV en PDF (solo en español). Para actualizarlo, reemplaza el archivo en public/documentos/. */
export const CV_PATH = '/documentos/cv-salvador-j-vazquez-villa.pdf';
