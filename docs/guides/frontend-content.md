# Módulos y material de AcademiX

Implementación: 2026-10-22, rama `feat/frontend-modulos-material`.
Spec: [frontend-modulos-material](../../specs/20261021-141350_frontend-modulos-material/spec.md).
US1, US2 y US3 implementadas. Validación con backend real pendiente: T026.

## Recorrido y permisos

Desde el curso, abrir **Módulos y material**. Expandir un módulo carga sus materiales.
La lectura profunda verifica primero `module.courseId`, después `material.moduleId`.
Breadcrumbs y retorno enlazan curso, módulos y módulo concreto.
Markdown/metadatos se interpolan con React; espacios y saltos se conservan.
No hay HTML interpretado, enlaces de contenido activos ni imágenes remotas.

Teacher activo de cualquier sección del curso tiene autoría compartida.
Admin/superadmin sin teacher no obtiene autoría. Sin Enrollment, API deniega contenido.
Student/assistant requieren módulo e ítem publicados, también por URL directa.
La UI orienta permisos; cada petición sigue autorizada por el backend.

## Edición, orden y publicación

Crear genera borradores. Editar conserva publicación y reemplaza contenido publicado.
Alta de módulo usa max(position)+1, con detección de overflow int32.
Subir/Bajar envía todos los IDs únicos vía PUT; se representa la consulta del servidor.
Títulos recortados: 1–200 caracteres Unicode sin NUL.
Markdown: no blanco, sin NUL, hasta 10000 caracteres; conserva fuente original.
Todo JSON serializado respeta 4096 bytes UTF-8, incluidos escapes y campos del cuerpo.
PATCH contiene solo campos editables que cambiaron.

Publicar/ocultar usa POST sin cuerpo. Estado propio y visibilidad efectiva son distintos:
un ítem publicado bajo módulo oculto dice **No visible: módulo sin publicar**.
Ocultar padre conserva publicaciones y contenido de hijos.
No se generan eventos de auditoría frontend ni se promete versionado o fusión.

## Recuperación y privacidad

No hay reintentos automáticos de escritura.
400/409/413/415/422 conservan texto mientras la vista siga autorizada.
Una creación incierta consulta lista, mantiene texto y bloquea repetir el mismo envío.
Coincidencias o su ausencia no demuestran qué ocurrió con el envío.
PATCH/PUT/publicación inciertos consultan estado; mantienen incertidumbre y bloqueo.
Actualizar módulos/materiales repite solo lecturas explícitas.
Colapsar un módulo conserva el editor incierto y su bloqueo.

Una escritura confirmada seguida de refresh fallido se anuncia como confirmada,
con lectura fallida; la representación anterior se etiqueta como no vigente.
No se presenta ese fallo como lista vacía ni se repite la escritura.
Refresh de recursos conserva componentes/formularios y borradores en memoria.
Salir, expirar, 401, revocación 403/404 o cambiar contexto limpia la vista autorizada.
403/404 revalidan /me; respuestas anteriores no pueden restaurar datos o borrar sesión nueva.
Los cambios de contexto de la protección de sesión desmontan contenido privado.
Nada privado se persiste en storage, URL o logs.

## Evidencia automatizada

Comandos finales desde raíz con `rtk pnpm --dir frontend <script>`.
api:check, lint, typecheck, test, test:coverage y build: PASS.
192 pruebas, 0 fallos (165 existentes + 27 de contenido).
Cobertura global: 92.88% líneas, 87.55% ramas; umbrales 80/80 intactos.
check-doc-length.py y git diff --check: PASS.
Build advierte lockfiles múltiples preexistentes; compila ambas rutas nuevas.
Auditoría adicional `pnpm --dir frontend audit --audit-level high`: FAIL preexistente.
Reporta `braces@3.0.3` vía eslint-config-next → fast-glob → micromatch (desarrollo),
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
El audit no ofrece versión corregida; dependencias/lockfiles permanecen intactos.
Revisión `lms-reviewer`: sin hallazgos pendientes en el cambio de contenido;
backend real y este aviso preexistente quedan separados de la evidencia de la feature.
No se cambiaron dependencias, umbrales de cobertura ni exclusiones.

| Archivos de prueba | Evidencia |
| --- | --- |
| content-api / content-capabilities | DTO, parentesco, Unicode, bytes exactos y teacher independiente de admin |
| content-read-api / content-reader | Paths UC/UTFSM, matriz, rechazos, metadatos inertes, estados y respuestas tardías |
| content-write-api / content-editor | Alta/PATCH/PUT, posiciones, orden, conflictos, incertidumbre, borradores y contexto |
| content-publication-api / content-publication | POST vacío, estados independientes, no-op fixture, foco y errores de refresh |
| Suite existente | Sesión/expiración, cursos, administración y participantes |

Pruebas escritas antes de implementación; fallaron por APIs/componentes ausentes.
Pruebas adicionales reprodujeron vacío anterior tras refresh fallido, desbloqueo por
colapso y publicación incierta cuyo estado observado no se refrescaba; corregidos.

## Navegador con fixtures

Chromium visible mediante `playwright-skill`, Next local y respuestas API interceptadas.
Recorrido: login fixture, curso, módulos, alta, edición, orden y publicación por teclado.
Expandir, Enter, foco tras orden/publicación, labels asociados y reduced motion: PASS.
375/1280 px, claro/oscuro: sin desborde horizontal. Capturas revisadas visualmente.
Contraste medido en inputs, textarea y botones: mínimo 7.58:1 claro y 7.10:1 oscuro.
Lector con fuente adversarial: cero ejecución, enlaces activos o solicitudes externas.
Borrador permanece tras refresh autorizado. Sin errores JavaScript en el recorrido.
Artefactos temporales: `/tmp/playwright-test-content.js`, `/tmp/content-{light,dark}-{375,1280}.png`.

## FR, SC y límites

| Alcance | Estado / evidencia |
| --- | --- |
| FR-001–004/008/013 | Rutas, DTO, roles/contexto: pruebas API/UI; rechazo real pendiente |
| FR-005/009–012 | Validación, autoría, orden y recuperación: automatizadas |
| FR-006–007 | Publicación independiente confirmada: automatizada; auditoría SQL pendiente |
| FR-014–016 | Teclado, temas, móvil, contraste y regresiones: fixtures/navegador |
| SC-001 | Cuatro combinaciones: lectura directa y navegación con student/assistant fixture |
| SC-002 | Teacher no admin: autoría, orden y publicación con fixtures y navegador |
| SC-003 | Roles/tenant/markdown adversarial: fixtures; aislamiento persistido pendiente |
| SC-004 | Lectura/edición/orden: teclado, móvil y dos temas en navegador con fixtures |

Trazabilidad: FE-08–10/20; CU-05/06/14; RF13/14(markdown)/16/25–26; RNF1–4/7/9.
PDF/binarios, delete, orden de ítems, autosave, colaboración y versionado siguen excluidos.

## Pendiente con entorno real — T026

No había servidores de desarrollo al iniciar. `curl localhost:3001/health` falló conexión;
sin archivo de entorno/credenciales locales disponibles. Solo se levantó Next para UI.
Completar [quickstart](../../specs/20261021-141350_frontend-modulos-material/quickstart.md)
con backend y cuentas UC/UTFSM provisionadas: cuatro publicaciones por rol/URL directa,
IDs cruzados, teacher de otra sección, denegaciones forzadas y auditoría/no-op reales.
Fixtures UI no certifican RLS, barrera por omisión, transacciones ni auditoría SQL.
No se modificó producción, no hubo despliegue ni commits automáticos.
