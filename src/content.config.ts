import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const lang = z.enum(['es', 'en']);

/** Único lugar donde vive el teléfono. Se reutiliza en todos los CTA. */
const contact = defineCollection({
  loader: file('src/content/contact/contact.json'),
  schema: z.object({
    phoneE164: z.string().regex(/^\+\d{10,15}$/),
    phoneDisplay: z.string().regex(/^\+[\d ]+$/),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      lang,
      route: z.string().regex(/^[a-z0-9-]+$/),
      translationKey: z.string(),
      order: z.number().int(),
      /** infrastructure: proyecto carretero · support: página de acompañamiento */
      category: z.enum(['infrastructure', 'support']),
      title: z.string(),
      kicker: z.string(),
      summary: z.string(),
      seoDescription: z.string().max(170),
      operator: z.string().optional(),
      region: z.string().optional(),
      kind: z.string(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      gallery: z.array(z.object({ src: image(), alt: z.string() })).default([]),
      sources: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: z.object({
    lang,
    order: z.number().int(),
    title: z.string(),
    officialTitle: z.string().optional(),
    institution: z.string().optional(),
    area: z.string(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      lang,
      key: z.string(),
      title: z.string(),
      description: z.string().max(170),
      eyebrow: z.string().optional(),
      heading: z.string(),
      lead: z.string().optional(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      blocks: z.record(z.string(), z.string()).default({}),
      items: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
      steps: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
    }),
});

export const collections = { contact, projects, experience, pages };
