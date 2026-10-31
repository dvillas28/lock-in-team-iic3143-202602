# F4 — Registro incremental

F4 en implementación,sin aceptación. Rama `test/e2e-f4`,desde8bd5d8f (F3 aceptada).
El usuario autorizó continuar al cerrar F3. F1–F3 conservan85 fichas y201 ejecuciones aprobadas.

## Alcance y siguiente paso

- T01:cursos/secciones,UI real y persistencia; COURSE-013 adopta HTTP400 para NUL según decisión Q02.
- T02–T03:directorio,asignación,historia de roles,revocación y concurrencia.
- T04–T05:módulos,Markdown,visibilidad y escrituras inciertas/concurrentes.
- T06:repetición,regresión acumulada,reportes y limpieza.

Comando incremental:`pnpm test:e2e:f4`; visible:añadir `--headed`.
Un comando filtrado o specs parciales no acredita la fase completa.
No push/merge ni producción; correcciones funcionales en rama fix y commit separados.

## Hallazgo Q02

Run1c94e7e20619fc8b:4 FAIL; code/name/term/sectionCode con NUL devuelven500,esperado400.
Reproducción en courses.spec.ts; corrección funcional separada en fix/e2e-metadata-nul.

## Incrementos ejecutados

- Fix Q02:5b9c242 en fix/e2e-metadata-nul e incorporado por cherry-pick local a F4.
- Unitario de metadatos,build y lint backend PASS; las4 variantes NUL pasan en ea8a85e3dec0f480.
- ea8a85e3dec0f480:cursos/secciones,22 PASS/10 FAIL; fallos de expectativa/selector del harness.
- 34cf4a46b02d882f:13 PASS tras corregir scope de T1,espera de navegación y selectors accesibles.
- 472b2d09543d3d90:27 PASS de ENROLL,sin relajación de permisos ni pérdida de historia.
- eebfa126f54397b6:CONTENT,30 PASS/3 FAIL; dos problemas del harness y un defecto funcional.
- CONTENT-016:repro9049743a5fb712f5;004/010 PASS y016 FAIL. Fixd5d85b2 en rama independiente e incorporado localmente.
- UI:typecheck/lint y14 unitarios de edición/publicación PASS; falta prueba E2E del fix.
- AUTH-002 se alinea con su etiqueta smoke del catálogo y requiere Firefox/WebKit además de Chromium.

Estos diagnósticos no acreditan F4 completa. Faltan validar CONTENT-016,repetición limpia,
smoke en motores requeridos,regresión acumulada,review,reportes y limpieza.
