/* AcademiX mockups — tema + íconos.
   Cargar de forma síncrona en <head> (después de lucide) para aplicar
   el tema antes del primer paint y evitar flash. */

(function () {
  var theme = 'light';
  try { theme = localStorage.getItem('lms-theme') || 'light'; } catch (e) { /* file:// sin storage */ }
  // Override por URL (?theme=dark|light) para demos y capturas
  var param = new URLSearchParams(location.search).get('theme');
  if (param === 'dark' || param === 'light') {
    theme = param;
    try { localStorage.setItem('lms-theme', theme); } catch (e) { /* noop */ }
  }
  document.documentElement.dataset.theme = theme;
})();

function toggleTheme() {
  var root = document.documentElement;
  var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('lms-theme', next); } catch (e) { /* noop */ }
}

document.addEventListener('DOMContentLoaded', function () {
  if (window.lucide) lucide.createIcons();
});
