import { getCollection, getEntry } from 'astro:content';
import type { Lang } from '@/i18n';

export async function getPage(lang: Lang, key: string) {
  const entry = await getEntry('pages', `${lang}/${key}`);
  if (!entry) throw new Error(`Falta el contenido: src/content/pages/${lang}/${key}.md`);
  return entry;
}

/** Lee un bloque de texto obligatorio: el build falla si falta (nunca se publica vacío). */
export function block(
  entry: { id: string; data: { blocks: Record<string, string> } },
  name: string,
) {
  const value = entry.data.blocks[name];
  if (!value) throw new Error(`Falta el bloque "${name}" en ${entry.id}`);
  return value;
}

export async function getProjects(lang: Lang) {
  const all = await getCollection('projects', (p) => p.data.lang === lang);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getExperience(lang: Lang) {
  const all = await getCollection('experience', (e) => e.data.lang === lang);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getPhone() {
  const entry = await getEntry('contact', 'main');
  if (!entry) throw new Error('Falta src/content/contact/contact.json');
  return entry.data;
}

/** Codificación ligera contra scrapers: base64 del texto invertido. */
export function encodeForClient(value: string): string {
  return Buffer.from([...value].reverse().join(''), 'utf8').toString('base64');
}
