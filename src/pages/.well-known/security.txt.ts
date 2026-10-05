/**
 * RFC 9116. Sin correo: el contacto es la página de Contacto (teléfono).
 * "Expires" se recalcula en cada build (≈ 11 meses): reconstruye y publica al menos una vez al año.
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const abs = (p: string) => new URL(`${base}${p}`, site).href;
  const expires = new Date(Date.now() + 330 * 24 * 60 * 60 * 1000);
  expires.setUTCHours(0, 0, 0, 0);

  const body = [
    `Contact: ${abs('contacto/')}`,
    `Contact: ${abs('en/contact/')}`,
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: es, en',
    `Canonical: ${abs('.well-known/security.txt')}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
