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
