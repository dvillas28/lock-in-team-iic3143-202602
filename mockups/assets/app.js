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


// Interactions below simulate a wireframe only; no authentication or API calls.
function mockNotice(message) {
  var target = document.getElementById('mock-status');
  if (target) { target.hidden = false; target.textContent = message; }
}
function mockConfirm(title, message, action) {
  var dialog = document.getElementById('mock-confirm');
  var trigger = document.activeElement;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-accept').onclick = function () { dialog.close(); action(); };
  dialog.onclose = function () { if (trigger && trigger.isConnected) trigger.focus(); };
  dialog.showModal();
  document.getElementById('confirm-cancel').focus();
}
document.addEventListener('DOMContentLoaded', function () {
  var assistant = new URLSearchParams(location.search).get('role') === 'assistant';
  if (assistant && document.body.hasAttribute('data-staff')) {
    document.querySelectorAll('[data-teacher-only]').forEach(function (el) { el.hidden = true; el.querySelectorAll('input,button,select,textarea').forEach(function(c) {c.disabled = true;}); });
    document.querySelectorAll('[data-user-name]').forEach(function(el) { el.textContent = 'Javier Morales'; });
    document.querySelectorAll('[data-user-role]').forEach(function(el) { el.textContent = 'Ayudante · Sección 2 · Solo lectura'; });
    document.querySelectorAll('[data-user-initials]').forEach(function(el) { el.textContent = 'JM'; });
    document.querySelectorAll('[data-section-one]').forEach(function(el) { el.remove(); });
    document.querySelectorAll('[data-staff-link]').forEach(function(el) { var u = new URL(el.href); u.searchParams.set('role','assistant'); el.href = u.href; });
    document.querySelectorAll('[data-assistant-only]').forEach(function(el) { el.hidden = false; });
  }
  document.querySelectorAll('[data-demo-message]').forEach(function(el) { el.addEventListener('click',function() { mockNotice(el.dataset.demoMessage); }); });
});
