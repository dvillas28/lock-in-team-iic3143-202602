# Rendición de quizzes: implementación y evidencia

Fecha: 2026-10-22. Misión: `20261021-141352_frontend-rendicion-quizzes`.
Sin cambios de dependencias, endpoints, migraciones ni semántica académica.

## Comportamiento por historia

- **US1**: inicio con sección student explícita y clave estable; replay seguido
  de GET actual. Enlace conocido `/attempts/{UUID}`, retorno login exacto,
  preguntas seguras, borrador separado del snapshot confirmado y guardado manual
  completo. Vaciar requiere confirmación. PUT incierto bloquea escrituras aun
  después de consultar; controles congelados evitan snapshots competidores.
- **US2**: confirmación de respuestas actuales; guardar cambios antes de enviar.
  Un fallo de PUT detiene la cadena. Submit tiene clave independiente, conserva
  identidad tras error/409 y permite solo GET o replay del POST original.
  Recibo: id, estado y fecha; sin nota, puntajes, porcentaje ni corrección.
- **US3**: cancelación explícita por student propietario sin pauta o teacher
  histórico/admin dueño con teacher. Assistant/admin aislado no cancelan.
  Consume máximo, no genera nota ni reemplaza graded para publicación.
  El 204 se confirma sin JSON; una lectura fallida/inconsistente conserva éxito.

## Archivos y decisiones

- `frontend/src/lib/attempts/`: DTO runtime, capacidades y coordinador específico.
- `frontend/src/lib/api/attempts.ts`: adaptadores del cliente OpenAPI existente.
- `frontend/src/components/attempts/`: inicio, respuestas, confirmaciones y recibos.
- `frontend/src/app/attempts/[attemptId]/page.tsx`: ProtectedInstitution existente.
- `quizzes.ts` conserva validación de courseId esperado y permite derivarlo del
  DTO seguro. Metadata de terminales/staff no depende de cargar preguntas.
- Navegación permite solo UUID exacto; el validador UUID compartido exige longitud
  36 para rechazar el salto final que admite `$`. Callers y regresiones revisados.
- Session.request conserva su comportamiento: generation y contexto invalidan
  completions; logout/401/403/404 limpian datos, borradores y claves locales.
- Se reutilizan shell, tokens, radios y dialog nativo con foco inicial en Volver,
  Tab confinado, Escape y retorno al disparador. Sin hoja de estilos nueva.

## Pruebas frontend con mocks

`frontend/test/attempt-*.test.ts` y fixtures de UC/UTFSM cubren:

- Contratos, IDs/fechas/estados, proyección mínima staff, campos prohibidos en
  student/recibo, alternativas string y límite JSON de 4096 bytes UTF-8.
- Sección histórica, propietario, multirol/pauta, teacher dueño/ajeno y assistant.
- Doble acción, claves estables, GET tras replay start y secciones explícitas.
- Snapshot completo, borrado explícito, errores 400/401/403/404/409/413/415/422/503,
  red perdida, guardado incierto, submit sin repetir PUT y cancelación 204.
- Logout, revocación y cambio de actor/tenant/recurso con respuesta o cuerpo JSON
  tardío; ningún completion restaura datos ni inicia la siguiente mutación.
- Regresiones de autoría, cursos, login, next duplicado y redirecciones abiertas.

Estos mocks prueban interacción y contrato del consumidor; no demuestran RLS,
auditoría persistida ni ausencia de duplicación de notas en la base de datos.

## Navegador real, API simulada

Chromium visible con Playwright sobre Next local y API interceptada; sin datos
productivos. Recorrido: login desde ID conocido, teclado en radios, guardar,
confirmar envío, recibo, recargar/login al mismo ID y cancelar explícitamente.

- PASS: fieldset/legend/labels, foco visible, foco inicial seguro, Tab/Shift+Tab,
  Escape y retorno, avisos role=status/aria-live y edición bloqueada.
- PASS: 1280 y 375 px, claro/oscuro, sin desborde horizontal y movimiento reducido.
- Tokens cargados: texto principal/secundario sobre lienzo, texto sobre superficie,
  blanco sobre primario y peligro sobre superficie: mínimo 6,47 claro/6,27 oscuro.
  Medición de esos pares; no se declara auditoría WCAG exhaustiva.
- Sin errores JavaScript. Capturas temporales `/tmp/attempt-{theme}-{width}.png`.

## API y PostgreSQL reales

Contenedores PostgreSQL 18 exclusivos, DB con sufijo `_test` y usuario runtime
`academix_runtime` sin bypass. No se usó ni modificó producción o la demo local.

- Suites existentes attempt-contract/lifecycle/window/permissions/integrity/
  concurrency/grading y gradebook-publication: resultados en tabla de checks.
  Cubren tenants UC/UTFSM, pauta multirol, revocación, sección histórica,
  [apertura,cierre), replay tras publicación/cierre, locks y rollback de auditoría.
- Adaptadores nuevos contra HTTP real: start/replay devuelve mismo ID; guardar y
  GET restauran conjunto completo; cancel x2 produce un evento y cero Grade;
  submit x2 produce una Grade, un attempt.graded y un grade.created.
  Recibo estricto y rechazos de tenant cruzado y cancelación de graded comprobados.
- Las suites de aislamiento comprueban RLS, omisión del predicado institucional,
  reutilización de conexión y contexto de ruta frente a headers/body.

## Checks de entrega

Ejecuciones finales sobre el código de esta misión; no se omiten integraciones.

| Check | Resultado |
| --- | --- |
| API/schema | PASS, sin diferencias |
| lint / typecheck | PASS |
| frontend test / coverage | PASS 248/248; líneas 94,35 %, ramas 87,44 % (umbral 80/80) |
| frontend build | PASS; nueva ruta dinámica incluida |
| longitud documental / git diff --check | PASS; guía <150 líneas |
| backend test:integration | PASS 126/126, sin skips (repetición completa aislada de checks pesados) |
| Primera pasada backend | 124/126: dos readiness deadline; ambos PASS aislados y en repetición completa |
| pnpm audit --audit-level=high | FAIL previo: braces vía ESLint/Next, GHSA-vfj7-8cjw-p6xm |

## Trazabilidad y límites

| Requisitos | Evidencia |
| --- | --- |
| FR-001–004, FR-007 / SC-002 | start/API/UI/session, GET actual y replay real |
| FR-005–006, FR-008 / SC-001 | save/validation/submit, reemplazo completo real |
| FR-009–012 / SC-002–003 | submit/API, recibo seguro, concurrency/grading reales |
| FR-013–015 / SC-004 | cancel/capabilities, lifecycle/permissions/integrity reales |
| FR-016–017, FR-019 | API/schema, session, regresiones y suites de backend |
| FR-018 / SC-005 | DOM + Chromium, teclado/diálogos/temas/375 px |

- GET de intento histórico puede autorizarse y GET quiz devolver 404 tras cambio
  de sección. Se conserva limpieza/revalidación de Session; la UI no elude ese
  límite ni sustituye sección histórica por matrícula actual. Una caída no
  autorizativa permite solo resumen terminal seguro, sin controles inventados.
- No hay búsqueda de intentos propios: sin ID y clave perdidos tras recarga no
  se promete descubrimiento. Borradores/claves viven solo en el documento.
- PUT incierto no se resuelve con un GET aislado ni se demuestra terminado al
  perder su bloqueo local por recarga. No hay versión/ETag ni garantía
  entre pestañas. Nunca autosubmit/autocancel ni calificación local.
- T001–T033 implementadas y verificadas; sin tareas pendientes.
- Hooks opcionales git antes/después omitidos por instrucción del usuario.
  Sin commit, push, cambio de rama, despliegue ni PR; feature.json no se incluye.
