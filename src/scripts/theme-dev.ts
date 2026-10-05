/** Solo en desarrollo: alterna data-theme para comparar paletas. No llega a producción. */
const select = document.querySelector<HTMLSelectElement>('[data-theme-select]');
if (select) {
  select.value = document.documentElement.dataset['theme'] ?? 'azul';
  select.addEventListener('change', () => {
    document.documentElement.dataset['theme'] = select.value;
  });
}
