# Research: Respuesta al feedback E2 y privacidad asociada

Fecha original: 2026-10-28; revisión de alcance: 2026-10-29. Fuentes locales.
Investigación delegada de solo lectura y revisión principal sobre código actual.
No quedan incógnitas que bloqueen el diseño. En la investigación previa no se ejecutó aceptación; la ejecución posterior
se registra en [evidencia local](../../docs/backend/feedback-e2-validation.md).

## 0. Alcance, línea base y decisiones del polish

**Decision**: Fuente primaria E2 fila 6 (C6/D6/E6/F6/G6), distinta de E1.
Siete IDs: cinco frentes accionables y dos valoraciones positivas. Auditoría
se identifica como hallazgo técnico asociado, no observación del evaluador.
Corte 2026-10-29 en 7f4334a; antes/después significa inicio/final del polish,
no antes/después de entregar E2 ni causalidad respecto de la evaluación.

**Rationale**: El spec previo respondía solo a privacidad. Ya existen
cardinalidades UML, CHECK de role, flags admin/superadmin, creación autorizada,
bootstrap y onboarding; faltan correspondencia en formatos finales y evidencia.
Informe y PPT mantienen HAProxy y diagramas sin cardinalidades.

**Alternatives considered**: Reimplementar todo atribuiría trabajo previo al
polish; marcar completado solo por presencia en código confunde aceptación;
crear superadmin global, signup o enum SQL ampliaría alcance sin necesidad.

**Decision**: Conservar CHECK físico y declarar dominio enumerado de roles.
Mantener operador de producto, capacidades institucionales y roles por sección
separados. Altas generales en tenant existente no están soportadas.
Arquitectura actual basada en configuración Render; HAProxy/HA/pool externo
se difieren y no se presentan como desplegados. Verificación remota separada.

**Decision**: Catálogo XLSX editable y exportaciones Mermaid/TeX se revisan
conjuntamente. No hay generador de catálogo; documentar herramientas y comandos
usados sin añadir pipelines o dependencias especulativas.

## 1. Permiso administrativo frente a docencia

**Decision**: Exigir teacher vigente para leer cualquier evento de recurso grade.
Owner+is_admin+teacher mantiene alcance de curso; teacher ordinario, sus secciones.
Owner sin teacher conserva eventos distintos de grade. Published no crea excepción.

**Rationale**: courseScope calcula owner como is_admin y created_by propio;
AuditService.list permite owner sin teacher y snapshot grade incluye grade/scorePercent.
La reproducción heredada en attempts-grading-validation documenta filtración.

**Alternatives considered**: Quitar toda auditoría al owner rompe administración;
mostrar solo notas publicadas crea auditoría estudiantil no solicitada; vaciar
solo el payload sigue exponiendo identificadores y existencia de eventos.

## 2. Ubicación de la corrección

**Decision**: Añadir a la consulta de AuditService.list una condición equivalente
 a `(a.resource_type <> 'grade' OR teacherSections.length > 0)`, mediante parámetro
boolean SQL. Se conserva el predicado owner OR sección docente existente.

**Rationale**: El predicado existente da scope correcto a owner+teacher y teacher
ordinario. La condición adicional elimina grade solo cuando falta docencia;
reutiliza los roles activos obtenidos por courseScope, sin consultas por evento.

**Alternatives considered**: Filtrar después de LIMIT produce páginas truncadas
 e indicadores sobre filas prohibidas; esconder solo UI conserva fuga por API;
modificar courseScope cambia permisos de otros módulos innecesariamente.

## 3. Paginación y revocaciones

**Decision**: Aplicar todos los permisos antes de ORDER/LIMIT. Conservar page y
paginated, que usan limit+1 y cursor occurred_at/id ligado a actor/contexto/filtros.
Cada petición revalida roles; cursor no constituye autorización.

**Rationale**: Un permiso revocado debe afectar la siguiente lectura con la misma
sesión. No se exige retirar datos que el usuario ya recibió autorizado ni cancelar
consultas iniciadas antes de confirmar la revocación.

**Alternatives considered**: Versionar permisos en cursor, nueva caché o locks de
escritura para toda lectura añaden complejidad sin requisito actual.

## 4. Historia y sanitización

**Decision**: Sin migración ni reescritura de eventos. Aplicar restricción al leer
historia antigua y nueva; conservar allowlists snapshot de entrada y salida.

**Rationale**: grade contiene nota y porcentaje; quizAttempt omite resultados,
gradebook solo conserva pesos. La integridad append-only se mantiene intacta.
Se prueban cargas antiguas malformadas para comprobar sanitización de respuestas,
credenciales y resultados incrustados en otros tipos.

**Alternatives considered**: Borrar/redactar datos persistidos destruye historia;
quitar resultados al docente autorizado reduce utilidad del historial.

## 5. Pruebas y consumidores

**Decision**: Reutilizar gradebookFixture, helpers HTTP y runtime con RLS; crear
pruebas pequeñas por privacidad y scope, actualizar expectativas existentes.
No construir un nuevo servidor/harness. El contrato de respuesta no cambia.

**Rationale**: gradebook-audit-read prueba sanitización y conserva owner sin teacher;
se debe precisar que conserva únicamente eventos administrativos. CourseAudit y
cliente tipado ya admiten colecciones vacías; no requieren UI nueva.

**Alternatives considered**: Solo mocks no prueban selección/paginación SQL;
pruebas de navegador adicionales no sustituyen autorización HTTP/SQL.

## Fuentes y efectos sobre documentación

- backend/src/audit/audit.service.ts: snapshot, list, record.
- backend/src/courses/course-access.ts: context, courseScope, sectionScope.
- backend/src/courses/validation.ts: page y paginated.
- backend/test/integration/gradebook-audit-read.test.mjs y course-audit.test.mjs.
- docs/reference/openapi/paths/audit.yaml: excepción actual de owner.
- ADR institution-admin-and-course-ownership y grade-publication-and-weight-freeze.
- El futuro ADR grade-audit-visibility debe acotar esa excepción antes de cerrar
  la implementación; los documentos históricos conservan su contexto.
