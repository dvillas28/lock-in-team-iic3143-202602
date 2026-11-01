# Privacidad de auditoría: validación local

Fecha 2026-10-29. Base `7f4334a03cc9b2245a169fd56b9a1c99942030f0`;
Versión funcional validada: `395e26746fb05e238403fb2575add74ddc273549`.
Rama `fix/polish-feedback-e2`; sin PR/despliegue.
[Decisión](../adr/grade-audit-visibility.md), [contrato](../../specs/20261028-185147_privacidad-notas-auditoria/contracts/audit-visibility.md).

## Entorno y reproducción

Node 24.14.0/pnpm 9.15.9, PostgreSQL 17-alpine exclusivo en contenedor
academix-e2-polish-test, base academix_polish_test. Operador separado del rol
academix_runtime; harness recrea public. URLs y secretos no incluidos.
Backend lint/build en serie; pruebas `node --test --test-concurrency=1`.

## Regresión antes/después

Antes del cambio productivo, gradebook-audit-privacy.test.mjs: **0/2 PASS**.
La primera prueba revoca teacher antes de iniciar como owner+student: inicio 201,
submit 200 y Grade no publicada comprobada por SQL. Falla exactamente con
`grade events exposed to owner without teacher`: esperaba items vacío y recibió
un evento grade. La segunda también expuso tres eventos tras revocar y continuar.
No falla por una fixture de rendición inválida.

Después: mismo rechazo esperado, filtro de AuditService.list por resource_type
antes de ORDER/LIMIT. Sin migración, borrado, nuevo DTO ni cambios globales.
Focalizadas nuevas privacidad/scope: **3/3 PASS**, 0 omitidos, 10.38 s.
Ensayo intermedio: privacidad ya no fugaba; se corrigieron dos errores de test:
publishedDto usa gradeItemId (no id) y sexto login excedía la cuota vigente.
La prueba de scope reinicia HTTP antes del recorrido UTFSM; no se altera rate limit.
Revocaciones y continuación se prueban con el mismo token antes del reinicio.

## Matriz de aceptación

| Requisito / criterio | Evidencia ejecutable |
| --- | --- |
| FR-001/009, SC-002 | gradebook-audit-scope + tenant-isolation: cruces UC/UTFSM, RLS sin filtros, reuso tras errores, 401/403/404 |
| FR-002/004, SC-001/002 | privacy/scope: owner sin teacher cero grade; conserva administrativos; owner+teacher todo curso; docentes sección 1/2 |
| FR-003, SC-001 | privacy: filtros tipo/acciones/id/actor/sección/fechas, solo grade vacío, páginas limit=1 completas sin duplicados |
| FR-005, SC-003 | privacy/scope: misma sesión/cursor tras revocar teacher/admin; usuario/membership/institución inactivos |
| FR-006, SC-005 | privacy: own my-grades vacío antes y propia publicada después; student/assistant 403, superadmin ajeno 404; seguimiento en suites existentes |
| FR-007, SC-004 | scope: snapshots completos cursos/pesos/notas/recibos/eventos e intentos idénticos tras lecturas; alumno revocado conserva sección histórica |
| FR-008, SC-001 | scope/audit-read: legacy before/after, secretos/respuestas/pauta y resultados no grade filtrados por allowlist |
| FR-010, SC-001–005 | regresión roja antes de fix y aceptación verde después; cobertura/contrato/consumidor se registran debajo |

## Checks de cierre

- Backend lint/build PASS; coverage **174/174 PASS**, cero omitidos, 848.35 s.
- Cobertura total: 99,54 % líneas/statements, 95,66 % ramas, 99,27 % funciones.
- AuditService: 100 % líneas/funciones, 97,46 % ramas. LCOV: backend/coverage/lcov.info.
- `pnpm docs:api:test`: **4/4 PASS**, incluye build backend posterior a coverage.
- OpenAPI lint PASS con tres avisos existentes (localhost y probes sin 4xx).
- Frontend api:generate/api:check/typecheck/lint PASS; focalizadas consumidor **8/8 PASS**.
- Longitud/self-test/enlaces y whitespace PASS; versión exacta arriba.
Coverage incluye unitarias e integración completa, incluidas todas las suites del
quickstart, negativos RLS y seguimiento assistant. No se omiten pruebas ni se
bajan umbrales. El código validado coincide con el commit funcional citado.
Los logs de desarrollo locales `/tmp/academix-e2-*.log` no son entregables ni
sustituyen la evidencia versionable. No contienen credenciales o tokens.

Extensión de evidencia SC-008: `3d18f45afc786283d3a5a890c40f1a0e598de080` modifica solo pruebas de permisos
y role en UC/UTFSM; focalizadas 2/2 PASS. c8 acumulado con --clean=false conserva
la suite completa y suma esa ejecución: 99,54 % líneas, 95,67 % ramas.
Código de producto validado sigue siendo el del commit funcional citado.
