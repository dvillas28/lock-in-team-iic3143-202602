# Autoría frontend de quizzes — evidencia

Validación: 2026-10-22. Feature: `20261021-141351_frontend-autoria-quizzes`.
US1, US2 y US3 implementadas con el stack existente; sin cambios API/DB/permisos.
PR autorizado posteriormente por el usuario; sin deploy. Cambios previos preservados.

## Implementación y decisiones

- Lista y detalle usan proyecciones seguras. La pauta se carga únicamente al abrir
  autoría autorizada; enlace sin prefetch. Sin storage, URL, logs ni caché global privados.
- Teacher activo y pertenencia al destino obligatorios; admin dueño amplía alcance
  solo con teacher. Permisos de módulos/material no conceden autoría de quizzes.
- Se valida curso del quiz y relación de sección, además de origen/destino al guardar.
- Borradores vacíos admitidos. PATCH omite campos intactos, conserva UUID existentes
  y omite UUID nuevos; reemplaza preguntas solo si cambiaron.
- Fechas intactas preservan zona y microsegundos. Fechas editadas usan zona local
  explícita y salida ISO. Nulos y omisión de sectionId siguen siendo distintos.
- Límites: JSON serializado ≤4096 bytes UTF-8, Unicode/NUL, int32, fechas,
  IDs/posiciones únicos, exactamente una correcta, centésimas y suma máxima.
- Guardado manual; errores conservan entradas mientras existe autorización.
  Sesión/contexto/revocación desmontan privados y descartan respuestas tardías.
- Resultado incierto bloquea reenvío. Lista/título no prueban identidad de un alta;
  candidatos son enlaces para revisión. Lecturas explícitas, sin retry de mutaciones.
- 409 consulta versión recibida separada del formulario. Descartar cambios requiere
  acción explícita; no hay fusión automática ni garantía de concurrencia adicional.
- Publicación confirma datos guardados, destino, ventana, irreversibilidad y peso
  inicial cero. Se consulta GradeItem real por quizId; muestra peso actual recibido.
  Fallo de lectura secundaria conserva publicación confirmada y permite releer ítem.
- FR-010 se resuelve conforme a contrato/research: congelación bloquea publicación
  de nuevos borradores; guardar sigue permitido. 409 no prueba una causa única.
- Published inmutable; sin rendición, unpublish/delete, edición de notas ni API nueva.

## Pruebas frontend con mocks

`frontend/test/quiz-*.test.ts` cubre estas fronteras con node:test/jsdom:

| Cobertura | Evidencia |
| --- | --- |
| FR-001/002 | Paths UC/UTFSM, parent/IDs, DTO inesperados, proyección sin pauta/prefetch |
| FR-003/004/011 | Teacher ordinario/admin dueño/no dueño, admin/super aislado, assistant/student, multirol; origen/destino |
| FR-005/006/008 | Create vacío, PATCH mínimo, UUID, nulos/omisión, Unicode/bytes 4096/4097, puntos, fechas |
| FR-007/012 | Published, 409, red/400/413/422/503, candidatos ambiguos, texto retenido y envío único |
| FR-009/010/014 | Confirmar/cancelar, dirty, respuesta perdida, GradeItem real/peso, freeze simulado |
| FR-013/016 | Logout, expiración, usuario/tenant, revocación 401/403/404 y respuestas tardías |
| FR-015 | Labels, avisos, foco al agregar/quitar, reorder con texto/UUID/radio estable |

Los mocks no demuestran RLS, locks, atomicidad ni unicidad de eventos backend.
La fixture compartida agrega solo shims de eventos legacy React y dialog jsdom.
Cambio compartido mínimo: feedback 413 explica presupuesto; regresiones auth/cursos/
contenido incluidas en la suite completa. Foco corregido en app.css y fuente mockup.

## Navegador con backend y PostgreSQL reales

Chromium visible mediante Playwright; API local `http://localhost:3001`, runtime
`academix_runtime`, base demo local ya existente. Orígenes de proceso configurados:
`http://uc.localhost:3000` y `http://utfsm.localhost:3000`; sin cambios versionados.
Se crearon cursos de validación nuevos; no se reinicializó ni limpió la base demo.

- Crear → detalle seguro → autoría → preguntas/pauta → guardar → confirmar publicar,
  en UC y UTFSM con admin dueño matriculado teacher. Cero errores de página.
- Repetición HTTP real conserva publishedAt y un GradeItem; consulta audit-events
  confirma exactamente un quiz.published y ausencia de isCorrect en su representación.
- Token UC/UTFSM sobre recurso de la otra institución: 403/404.
- Cero solicitudes /authoring al listar/consultar detalle; storage vacío.
- 375 y 1280 px, temas claro/oscuro: sin desborde horizontal; controles etiquetados.
- Teclado: apertura, foco inicial Volver, Tab/Shift+Tab confinado, Escape y retorno.
  Movimiento reducido activo; foco visible comprobado como outline sólido.
- Pares text-1/2/3/primary-ink sobre bg/surface/muted y on-primary/primary:
  contraste mínimo 5.27:1 claro y 5.03:1 oscuro. No es auditoría WCAG completa.

[IDs/resultados sin secretos](frontend-quiz-authoring/browser-evidence.json),
[captura móvil clara](frontend-quiz-authoring/light-375.png),
[captura móvil oscura](frontend-quiz-authoring/dark-375.png).
Capturas del editor con datos de validación, sin passwords ni JWT.

## Checks de cierre

Ejecutados desde raíz, usando pnpm 9.15.9 y Node 24.14.0:

| Comando | Resultado |
| --- | --- |
| frontend install --frozen-lockfile | PASS; sin cambios de lockfile/dependencias |
| frontend api:check | PASS; OpenAPI vigente sin modificaciones |
| frontend lint / typecheck | PASS |
| frontend test | PASS 210/210; ampliación final 214/214 en test:coverage |
| frontend test:coverage | PASS 214/214; líneas 93.88 %, ramas 86.55 % |
| frontend build | PASS final; tres rutas de quizzes compiladas |
| check-doc-length.py / git diff --check | PASS final |
| frontend audit --audit-level high | FAIL previo: braces 3.0.3, dependencia de ESLint; ver límites |
| backend test | PASS 31/31 |
| backend test:integration | PASS 126/126; base academix_validation_test separada de demo |

Scripts de navegador usados: `/tmp/playwright-test-quiz-authoring.js` y
`/tmp/playwright-test-quiz-contrast.js`; logs de checks en `/tmp/academix-quiz-*.log`.
Reproducir configuración frontend/API según frontend-api-client.md; credenciales
locales permanecen fuera de Git. Inicio local frontend con los orígenes explícitos:

```bash
rtk proxy env NEXT_PUBLIC_INSTITUTION_ORIGINS='{"http://uc.localhost:3000":"uc","http://utfsm.localhost:3000":"utfsm"}' NEXT_PUBLIC_API_URL=http://localhost:3001 pnpm --dir frontend dev
```

El backend debe permitir ambos orígenes mediante CORS_ALLOWED_ORIGINS.
El JSON durable contiene solo IDs/resultados; capturas usan pauta sintética de validación.

## Revisión lms-reviewer y límites

Revisión final de tenant, roles, integridad, callers y pruebas: sin bloqueos nuevos.
Corregidos: radio al reordenar, etiqueta de destino, contorno de foco y comparación
submilisegundo. SC-001–004 tienen cobertura automatizada y recorrido real descrito.

Sin ETag: dos ediciones autorizadas concurrentes conservan semántica backend actual.
Freeze/revocación adversarial se cubren con mocks y checks backend, sin manipular
permisos ni calificaciones de los cursos demo durante navegador. Los demás roles
se validan en matriz automatizada; no todos tienen recorrido visual manual real.
`pnpm audit` informa GHSA-vfj7-8cjw-p6xm (high) en braces 3.0.3, transitiva de
eslint-config-next → fast-glob → micromatch. Lockfile/dependencias no cambiaron;
el registro no ofrece versión corregida. Riesgo de agotamiento de pila al procesar
patrones profundamente anidados en tooling de desarrollo; pendiente actualización upstream.
No se validaron producción, DNS/TLS, lector de pantalla ni auditoría WCAG completa.
