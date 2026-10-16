# Quickstart de validación: Módulos y material

Guía para después de implementar tasks.md; no implica checks funcionales ya aprobados.

## Prerequisitos

Node 24, pnpm 9.15.9, PostgreSQL 17 exclusiva con nombre terminado en `_test`.
Identidad-acceso y cursos-roles implementados/migrados, incluidos audit y locks.
Configurar TEST_DATABASE_URL fuera del repositorio, sin imprimir credenciales.
Los helpers de integración recrean public: nunca apuntar a una base compartida.

```bash
pnpm --dir backend install --frozen-lockfile
pnpm --dir frontend install --frozen-lockfile
pnpm install --frozen-lockfile
pnpm --dir backend build
node --test backend/test/content-validation.test.mjs
node --test --test-concurrency=1 backend/test/integration/modules-write.test.mjs backend/test/integration/materials-write.test.mjs backend/test/integration/content-integrity.test.mjs
node --test --test-concurrency=1 backend/test/integration/content-read.test.mjs backend/test/integration/content-revocation.test.mjs backend/test/integration/content-contract.test.mjs
pnpm docs:api:lint
pnpm --dir frontend api:check
pnpm --dir frontend typecheck
pnpm --dir frontend test
pnpm --dir backend lint
pnpm --dir backend test:coverage
python3 .github/scripts/check-doc-length.py
```

No correr migración contra datos reales para verificar este plan. Prueba de upgrade
usa el migrador existente en DB exclusiva con datos del prerequisito.

## Fixtures compartidas

content-fixtures.mjs reutiliza helpers.mjs y course-fixtures.mjs; crea UC/UTFSM,
actor docente no admin y docente admin, assistant/student de dos secciones,
dueño sin teacher, admin ajeno, usuario con dos roles y membresía revocada.
No modificar seed demo ni responsables del backlog.
Para independencia, lectura US2 inserta módulos/materiales por SQL y no llama POST US1.

## US1: organizar contenido

1. Docente no admin crea dos módulos con posiciones únicas y material oculto.
2. Edita títulos/cuerpo, intercambia orden y publica módulo/material.
3. Docente de otra sección ve y edita los mismos IDs; no aparecen copias por sección.
4. Oculta módulo: material conserva publishedAt y cuerpo; republicar lo revela.
5. Repite publish/unpublish/PATCH/order idénticos: sin evento/timestamp adicional.
6. Assistant/student no escriben; docente de otro curso/tenant no accede.
7. IDs duplicados, posición inválida/ocupada y cuerpos excesivos no mutan estado.
8. Provocar fallo de auditoría revierte datos, posición y publicación; conexiones se liberan.
9. Altas simultáneas misma posición: una gana y otra 409; dos órdenes válidos
   serializan sin posiciones duplicadas. Alta vs orden da resultado serial o 409.

Esperado: FR-001/002/003/006/007 y SC-002 con historial completo e inmutable.

## US2: consultar material

1. Con fixtures SQL probar las cuatro combinaciones padre/ítem de publicación.
2. Assistant/student solo leen caso ambos publicados en lista/detalle/enlace anterior.
3. Lectores de dos secciones reciben mismos IDs y contenido, sin duplicación.
4. Revocar User, Institution, membership y último Enrollment por separado; repetir
   enlaces y cliente generado: 401 o 404 según contrato, nunca cuerpo protegido.
5. Revocar solo teacher conservando student: pierde borradores/escritura;
   conservar otro Enrollment activo mantiene lectura publicada.
6. Sustituir tenant/course/module/material UUID en cada ruta: ninguna filtración.
7. Teacher ve borradores; dueño admin sin rol y superadmin sin matrícula no los ven.
8. Contenido con script/HTML/enlaces peligrosos se recibe como string JSON inerte,
   nosniff/no-store; consumidor no genera HTML ni navega automáticamente.

Esperado: SC-001/002/003 y FR-004/005/007; errores no revelan títulos, IDs ocultos,
markdown, SQL o historial. Concurrencia con revocación sigue locks del prerequisito.

## Evidencia de cierre

Registrar comandos/resultados y límites en docs/backend/modules-material-validation.md,
con correspondencia FR/SC, sin tokens, secretos ni datos reales. Verificar upgrade
preserva cursos, Enrollments y auditoría; migraciones repetidas no alteran datos.
No marcar tareas cumplidas si falta DB o alguno de los negativos queda pendiente.
