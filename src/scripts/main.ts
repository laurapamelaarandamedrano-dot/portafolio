/**
 * Mejoras progresivas. El sitio funciona completo sin JavaScript;
 * este script solo agrega: teléfono ensamblado, copiar número, menú móvil,
 * animaciones al hacer scroll y ocultar el CTA fijo cuando ya hay uno visible.
 */

const decode = (encoded: string): string => [...atob(encoded)].reverse().join('');

function initPhone(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-tel]').forEach((a) => {
    const value = a.dataset['tel'];
    if (value) a.href = `tel:${decode(value)}`;
  });
  document.querySelectorAll<HTMLElement>('[data-tel-text]').forEach((el) => {
    const value = el.dataset['telText'];
    if (value) el.textContent = decode(value);
  });
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* continúa con el método alternativo */
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.className = 'visually-hidden';
  document.body.append(area);
  area.select();
  let ok: boolean;
  try {
    // Alternativa deliberada para navegadores sin Clipboard API o fuera de HTTPS.
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

function initCopy(): void {
  document.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach((btn) => {
    const encoded = btn.dataset['copy'];
    const label = btn.querySelector<HTMLElement>('[data-copy-label]');
    const status = document.getElementById(btn.getAttribute('aria-describedby') ?? '');
    if (!encoded || !label) return;
    const original = label.textContent ?? '';
    let timer: number | undefined;

    btn.hidden = false;
    btn.addEventListener('click', async () => {
      const ok = await copyText(decode(encoded));
      const message = ok ? btn.dataset['ok'] : btn.dataset['fail'];
      label.textContent = ok ? (btn.dataset['ok'] ?? original) : original;
      btn.classList.toggle('is-copied', ok);
      if (status && message) status.textContent = message;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        label.textContent = original;
        btn.classList.remove('is-copied');
        if (status) status.textContent = '';
      }, 2600);
    });
  });
}

function initMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = document.getElementById(toggle?.getAttribute('aria-controls') ?? '');
  if (!toggle || !panel) return;
  const labelOpen = toggle.dataset['labelOpen'] ?? '';
  const labelClose = toggle.dataset['labelClose'] ?? '';

  const set = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? labelClose : labelOpen);
    panel.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
  };
  set(false);
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      set(false);
      toggle.focus();
    }
  });
  panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  window.matchMedia('(min-width: 64rem)').addEventListener('change', () => set(false));
}

function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header].is-overlay');
  if (!header) return;
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-solid', window.scrollY > 24);
    ticking = false;
  };
  update();
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
}

/** Conteo animado de cifras. Sin JS o con movimiento reducido, se muestra el valor final. */
function initCounters(): void {
  const counters = document.querySelectorAll<HTMLElement>('[data-count]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || counters.length === 0 || !('IntersectionObserver' in window)) return;

  const run = (el: HTMLElement) => {
    const target = Number(el.dataset['count']);
    if (!Number.isFinite(target)) return;
    const duration = 1100;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          run(entry.target as HTMLElement);
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.6 },
  );
  counters.forEach((el) => {
    // Evita el parpadeo: solo arranca en 0 si aún no está en pantalla.
    if (el.getBoundingClientRect().top > window.innerHeight) el.textContent = '0';
    io.observe(el);
  });
}

function initReveal(): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window) || targets.length === 0) return;

  document.documentElement.classList.add('reveal-ready');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  targets.forEach((el) => io.observe(el));
}

function initStickyCta(): void {
  const sticky = document.querySelector<HTMLElement>('[data-sticky-cta]');
  const primaries = document.querySelectorAll<HTMLElement>('[data-cta-primary]');
  if (!sticky || primaries.length === 0 || !('IntersectionObserver' in window)) return;

  const visible = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    const hide = visible.size > 0;
    sticky.classList.toggle('is-hidden', hide);
    sticky.inert = hide;
  });
  primaries.forEach((el) => io.observe(el));
}

/** Mapas-red: animaciones SVG solo cuando están en pantalla y si se permite movimiento. */
function initNetwork(): void {
  const maps = document.querySelectorAll<SVGSVGElement>('svg[data-network]');
  if (maps.length === 0) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    if (reduce) maps.forEach((svg) => svg.pauseAnimations());
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const svg = entry.target as SVGSVGElement;
      svg.classList.toggle('is-paused', !entry.isIntersecting);
      if (entry.isIntersecting) svg.unpauseAnimations();
      else svg.pauseAnimations();
    }
  });
  maps.forEach((svg) => io.observe(svg));
}

initPhone();
initCopy();
initNetwork();
initMenu();
initHeader();
initCounters();
initReveal();
initStickyCta();
