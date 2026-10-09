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
// Role and course administration are independent preview dimensions.
// These parameters select demo profiles; they do not grant real permissions.
var mockAcademicContext = (function () {
  var params = new URLSearchParams(location.search);
  var file = location.pathname.split('/').pop();
  var staffFiles = ['07-teacher-dashboard.html', '08-teacher-gradebook.html',
    '11-course-management.html', '12-content-editor.html', '13-quiz-editor.html',
    '15-audit.html', '16-attempt-review.html'];
  var role = params.get('role') || (staffFiles.includes(file) ? 'teacher' : 'student');
  if (!['teacher', 'assistant', 'student'].includes(role)) role = 'student';
  // Bare staff pages are preset admin demos; a role parameter alone never grants it.
  var requested = params.get('experience');
  var admin = role === 'teacher' && (requested === 'admin' ||
    (!requested && !params.has('role') && staffFiles.includes(file)));
  return { role: role, admin: admin, experience: admin ? 'admin' : 'non-admin', file: file };
})();
function mockCanAdmin() {
  if (!mockAcademicContext.admin) mockNotice('Tu perfil no tiene administración del curso.');
  return mockAcademicContext.admin;
}
function mockCanTeach() {
  if (mockAcademicContext.role !== 'teacher') {
    mockNotice('Esta acción requiere un rol docente vigente.');
    return false;
  }
  return true;
}
function mockCanManageSection(section) {
  if (!mockCanTeach()) return false;
  var own = section === '2' || section === 'Sección 2';
  if (!mockAcademicContext.admin && !own) {
    mockNotice('Solo puedes gestionar tu sección 2.');
    return false;
  }
  return true;
}
function mockProfileUrl(file) {
  var url = new URL(file, location.href);
  url.searchParams.set('role', mockAcademicContext.role);
  url.searchParams.set('experience', mockAcademicContext.experience);
  return url;
}
document.addEventListener('DOMContentLoaded', function () {
  if (!document.body.hasAttribute('data-academic')) return;
  var ctx = mockAcademicContext;
  var staff = ctx.role !== 'student';
  var home = ctx.admin ? '07-teacher-dashboard.html' : '03-dashboard.html';
  // Preserve old helper links, but always enter the common non-admin home.
  if ((ctx.file === '07-teacher-dashboard.html' && !ctx.admin) ||
      (ctx.file === '03-dashboard.html' && ctx.admin)) {
    var destination = mockProfileUrl(home);
    var state = new URLSearchParams(location.search).get('state');
    if (state) destination.searchParams.set('state', state);
    location.replace(destination.href);
    return;
  }
  document.body.dataset.experience = ctx.experience;
  var profile = ctx.role === 'teacher' ? ['Carla Contreras', 'CC', 'Docente', ctx.admin ? 'Todas las secciones' : 'Sección 2'] :
    ctx.role === 'assistant' ? ['Javier Morales', 'JM', 'Ayudante', 'Sección 2'] :
    ['María González', 'MG', 'Estudiante', 'Sección 2'];
  document.querySelectorAll('.sidebar-bottom [data-user-name]').forEach(function (el) { el.textContent = profile[0]; });
  document.querySelectorAll('.sidebar-bottom [data-user-initials]').forEach(function (el) { el.textContent = profile[1]; });
  document.querySelectorAll('.sidebar-bottom [data-user-role]').forEach(function (el) {
    el.textContent = profile[2] + ' · ' + profile[3] + ' · ' + (ctx.admin ? 'Admin del curso' : 'No admin');
  });
  var marker = document.createElement('p');
  marker.className = 'section-label';
  marker.style.marginTop = '12px';
  marker.textContent = 'Experiencia: ' + (ctx.admin ? 'Admin' : 'No admin') + ' · ' + profile[2];
  document.querySelector('.sidebar-top').append(marker);
  document.querySelectorAll('[data-course-scope]').forEach(function (el) {
    el.textContent = 'IIC2233 · ' + profile[3];
  });
  document.querySelectorAll('[data-admin-only]').forEach(function (el) {
    if (!ctx.admin) {
      el.hidden = true;
      el.querySelectorAll('input,button,select,textarea').forEach(function (control) { control.disabled = true; });
      if (el.matches('button,input,select,textarea')) el.disabled = true;
    }
  });
  document.querySelectorAll('[data-teacher-only]').forEach(function (el) {
    if (ctx.role !== 'teacher') {
      el.hidden = true;
      el.querySelectorAll('input,button,select,textarea').forEach(function (control) { control.disabled = true; });
      if (el.matches('button,input,select,textarea')) el.disabled = true;
    }
  });
  document.querySelectorAll('[data-admin-edit]').forEach(function (el) { if (!ctx.admin) el.disabled = true; });
  // Hidden options must also be removed so a keyboard cannot select them.
  document.querySelectorAll('option[data-admin-only]').forEach(function (el) { if (!ctx.admin) el.remove(); });
  document.querySelectorAll('[data-scope-notice]').forEach(function (el) {
    el.textContent = ctx.role === 'teacher' ?
      (ctx.admin ? 'Gestión académica: todas las secciones del curso.' : 'Gestión académica: solo tu sección 2. El contenido del curso permanece compartido.') :
      'Consulta de solo lectura: sección 2.';
  });
  document.querySelectorAll('[data-student-only]').forEach(function (el) { el.hidden = staff; });
  document.querySelectorAll('[data-readonly-staff-only]').forEach(function (el) { el.hidden = ctx.role !== 'assistant'; });
  document.querySelectorAll('[data-staff-query-only]').forEach(function (el) { el.hidden = !staff || ctx.admin; });
  if (!ctx.admin) {
    document.querySelectorAll('[data-section-one]').forEach(function (el) { el.remove(); });
  }
  // Two navigation templates, with academic queries appropriate to each role.
  var items = [['index.html', 'Galería', 'layers'], ['10-institutions.html', 'Instituciones', 'building-2'],
    [home, 'Mis cursos', 'book-open']];
  if (ctx.role === 'teacher') items.push(['11-course-management.html', ctx.admin ? 'Secciones y roles' : 'Mi sección', 'users'],
    ['12-content-editor.html', 'Módulos y material', 'folder'],
    ['13-quiz-editor.html', 'Autoría de quizzes', 'list-checks']);
  else items.push(['04-course-modules.html', 'Material', 'folder']);
  if (staff) items.push(['08-teacher-gradebook.html', 'Libro de notas', 'bar-chart-2'],
    ['16-attempt-review.html', 'Intentos', 'clipboard-list']);
  else items.push(['05-evaluations.html', 'Quizzes', 'clipboard-list'],
    ['06-grades.html', 'Mis calificaciones', 'bar-chart-2']);
  if (ctx.role === 'teacher') items.push(['15-audit.html', 'Auditoría', 'history']);
  items.push(['02-login.html', 'Cerrar sesión', 'log-out']);
  var nav = document.querySelector('.sidebar-nav');
  nav.replaceChildren();
  items.forEach(function (item) {
    var a = document.createElement('a');
    a.className = 'nav-item' + (item[0] === ctx.file ? ' active' : '');
    if (item[0] === ctx.file) a.setAttribute('aria-current', 'page');
    a.href = item[0];
    var icon = document.createElement('i');
    icon.dataset.lucide = item[2];
    icon.setAttribute('aria-hidden', 'true');
    icon.style.width = icon.style.height = '16px';
    a.append(icon, document.createTextNode(item[1]));
    nav.append(a);
  });
  document.querySelectorAll('a[href]').forEach(function (a) {
    if (a.hasAttribute('data-demo-profile')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    var file = url.pathname.split('/').pop();
    if (!/^(0[3-9]|1[1-6])-/.test(file)) return;
    if (file === '07-teacher-dashboard.html') url.pathname = url.pathname.replace(file, home);
    url.searchParams.set('role', ctx.role);
    url.searchParams.set('experience', ctx.experience);
    a.href = url.href;
  });
  var restricted = (document.body.hasAttribute('data-teacher-page') && ctx.role !== 'teacher') ||
    (['08-teacher-gradebook.html', '16-attempt-review.html'].includes(ctx.file) && !staff) ||
    (['05-evaluations.html', '06-grades.html', '14-quiz-attempt.html'].includes(ctx.file) && staff);
  if (restricted) {
    var content = document.getElementById('main-content');
    content.querySelectorAll('input,button,select,textarea').forEach(function (control) { control.disabled = true; });
    Array.from(content.children).forEach(function (el) { el.hidden = true; });
    var panel = document.createElement('section');
    panel.className = 'card panel';
    var title = document.createElement('h1');
    title.textContent = 'Acceso no disponible para este perfil';
    title.className = 'serif';
    title.style.fontSize = '28px';
    title.style.marginBottom = '8px';
    var explanation = document.createElement('p');
    explanation.textContent = 'Tu rol académico y tus permisos de curso determinan las funciones disponibles.';
    var back = document.createElement('a');
    back.className = 'btn btn-ghost';
    back.href = mockProfileUrl(home).href;
    back.textContent = 'Volver a mis cursos';
    back.style.marginTop = '16px';
    panel.append(title, explanation, back);
    content.append(panel);
    document.title = 'AcademiX — Acceso no disponible';
  }
  if (ctx.file === '15-audit.html' && typeof filterAudit === 'function') filterAudit();
  if (window.lucide) lucide.createIcons();
});
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-demo-message]').forEach(function (el) {
    el.addEventListener('click', function () { mockNotice(el.dataset.demoMessage); });
  });
});
