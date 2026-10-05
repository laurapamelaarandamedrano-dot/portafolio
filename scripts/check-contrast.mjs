#!/usr/bin/env node
/** Verifica contraste WCAG 2.2 AA de los pares de color usados en los 3 temas. */
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

const themes = {};
for (const m of css.matchAll(/\[data-theme='([a-z]+)'\]\s*\{([^}]+)\}/g)) {
  const vars = {};
  for (const v of m[2].matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)) vars[v[1]] = v[2];
  themes[m[1]] = vars;
}

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// [texto, fondo, mínimo]
const pairs = [
  ['ink', 'bg', 4.5],
  ['ink', 'surface', 4.5],
  ['ink-soft', 'bg', 4.5],
  ['ink-soft', 'surface', 4.5],
  ['accent-strong', 'bg', 4.5],
  ['accent-strong', 'surface', 4.5],
  ['on-accent', 'accent', 4.5],
  ['on-primary', 'primary', 4.5],
  ['on-primary-soft', 'primary', 4.5],
  ['accent-on-primary', 'primary', 4.5],
  ['primary', 'bg', 3], // anillo de foco
  ['cta-on-primary', 'primary', 3], // botón sobre bloque oscuro
  ['on-cta-on-primary', 'cta-on-primary', 4.5],
];

let fail = 0;
for (const [name, vars] of Object.entries(themes)) {
  console.log(`\nTema ${name}`);
  for (const [fg, bg, min] of pairs) {
    const r = ratio(vars[fg], vars[bg]);
    const ok = r >= min;
    if (!ok) fail++;
    console.log(`  ${ok ? 'ok ' : 'FALLA'} ${fg} / ${bg}: ${r.toFixed(2)} (mín. ${min})`);
  }
}
if (fail) {
  console.error(`\n${fail} par(es) no cumplen WCAG AA.`);
  process.exit(1);
}
console.log('\nTodos los pares cumplen WCAG 2.2 AA.');
