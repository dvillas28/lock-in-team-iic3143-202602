# Quickstart: Validación de notas y seguimiento frontend

Guía para ejecutar durante implementación; estos escenarios aún no acreditan UI lista.
Contratos: [notas/publicación](contracts/gradebook.md),
[intentos/auditoría](contracts/tracking-audit.md); [modelo](data-model.md).

## Prerrequisitos

Node 24, pnpm 9.15.9; frontend/backend configurados según sus README y
`docs/backend/demo-tenant-bootstrap.md`. Instituciones UC/UTFSM y orígenes locales
configurados; API en :3001, frontend :3000. No registrar tokens en evidencia.
Actores: student; assistant; teacher sección; teacher admin dueño; admin dueño
sin teacher; superadmin aislado; multirol student/assistant/teacher por sección.
Fixtures independientes aportan notas/intentos/historia sin requerir editor docente.

```bash
pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend api:check
pnpm --dir frontend typecheck
pnpm --dir frontend lint
pnpm --dir frontend test
pnpm --dir frontend build
python3 .github/scripts/check-doc-length.py
pnpm --dir frontend dev
```

En otra terminal iniciar backend siguiendo `backend/README.md`. Los checks
siguientes usan API real para integridad y fixtures node:test/jsdom para UI.
No modificar datos compartidos: usar entorno local de aceptación.

## US1 — Notas propias (MVP)

1. Abrir `/courses/{courseId}/grades` como student con una nota publicada y otra
   graded oculta. Ver solo publicada, promedio/peso/isPartial iguales al GET backend.
2. Confirmar cero requests de libro/pauta/intentos para completar nota; my-grades
   no envía studentId ni filtros. No exponer resultado oculto por DOM o mensajes.
3. Sin publicaciones: pendiente, no 0. Con publicación peso0: nota visible,
   partialAverage null. Simular carga/vacío/401/403/404/503/red.
4. Cambiar UC→UTFSM/actor o cerrar sesión con respuesta demorada: no aparece dato
   previo. Ruta de curso ajeno no concede acceso aunque se manipule URL.

## US2 — Libro e intentos

1. Abrir `/courses/{courseId}/gradebook` con teacher sección y assistant: solo
   filas de sus secciones; mostrar nota no publicada autorizada sin promediarla.
2. Consultar alumno revocado o movido: conservar sección histórica y filas separadas;
   no inferir permisos ni acceso a sección ajena desde matrícula del destinatario.
3. Abrir listado de intentos por quiz y detalle desde Grade.attemptId; filtrar
   sección/student/status y paginar. Cambio de filtro reinicia cursor y páginas.
4. Assistant ve answers sin pauta/isCorrect/pointsAwarded ni publicar/cancelar.
   Teacher autorizado ve corrección que entrega API y enlace cancelación misión5.
   Multirol propio puede recibir vista estudiantil limitada; no forzar pauta.
5. Teacher admin dueño ve curso; admin dueño sin teacher y superadmin aislado no
   reciben libro/intentos. Simular cursor ajeno y respuesta tardía de otra sección.

## US3 — Pesos/publicación

1. Teacher admin dueño abre editor: bloqueo mientras freeze desconocido. Publicación
   en una página posterior del libro también bloquea pesos; teacher ordinario,
   assistant y admin dueño sin teacher no disponen del editor.
2. En curso sin freeze, guardar colección completa con decimales y suma100.
   Probar duplicados, faltantes, rango y suma99.99; no afirmar persistencia fallida.
3. Seleccionar rectángulo explícito ítems×estudiantes y secciones históricas;
   confirmar resumen/cantidad. Sin selección o pares incompletos no enviar POST.
4. Intento activo, cancelled sin Grade, Grade antigua o ya publicada producen
   bloqueo/conflicto atómico. No cancelar automáticamente ni sobrescribir publicadas.
5. Perder respuesta POST; repetir misma clave/selección en contexto vigente:
   recibo original, eventos únicos, sin doble lote. Cambiar selección/curso con
   misma clave da409; nueva clave sobre publicada también falla.
6. Recargar sin clave: consultar estado y explicar imposibilidad de recuperar recibo;
   no reenviar automáticamente. Dos clientes publicando/pesando concurrentemente
   conservan freeze y notas; conflicto refresca y bloquea editor incluso no-op.
7. Revocar teacher mientras petición/replay está pendiente: API rechaza alcance
   perdido y UI limpia datos. Guardado de pesos incierto no se reenvía solo.

## US4 — Auditoría

1. Admin dueño sin teacher abre `/courses/{courseId}/audit`: ve curso completo
   incluidos eventos globales, sin ganar acceso a libro/pauta.
2. Teacher ordinario ve únicamente eventos/snapshots de sus secciones; probar
   filtros actor/acción/recurso/sección/UTC desde-hasta y paginación vacía/final.
3. Assistant/student/superadmin aislados quedan denegados. Snapshot malicioso se
   muestra escapado; no contiene claves, credenciales, respuestas ni corrección.
4. Cambiar filtros/actor/tenant reinicia cursor; respuesta tardía nunca mezcla eventos.

## FE-20 — Seis recorridos y evidencia

En login/contexto, cursos/secciones, módulos/material, autoría, rendición y
notas/seguimiento comprobar teclado completo, foco visible y retorno de diálogo,
labels/aria-live, th/scope/caption, 375px, claro/oscuro, contraste ≥4.5:1 y
prefers-reduced-motion. No postergar accesibilidad local hasta esta pasada.
Registrar resultado, actor, institución, ruta y captura sin datos sensibles en
`docs/guides/frontend-grades-tracking.md`. Cada recorrido queda aprobado/fallido/
pendiente con causa; no declarar UI de otra misión implementada por tener mockup.

## Evidencia mínima antes de merge

Checks de frontend aprobados; aceptación independiente US1–US4; API real UC/UTFSM,
revocación, cursores, concurrencia, freeze/replay e historial sin duplicados.
Fixtures por sí solas no acreditan autorización/RLS ni locks de backend.
