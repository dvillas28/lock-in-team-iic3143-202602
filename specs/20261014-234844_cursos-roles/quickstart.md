# Quickstart: Validar cursos, roles y admin institucional

Guía de ejecución de [tasks.md](tasks.md). Evidencia detallada en
[validación](../../docs/backend/courses-roles-validation.md).
Requisitos: Node 24, pnpm 9.15.9, PostgreSQL 17 y dependencia identidad-acceso operativa.
Exportar DATABASE_URL, AUTH_JWT_SECRET y DEMO_*_PASSWORD sin registrarlos.
TEST_DATABASE_URL debe ser exclusiva, nombre terminado en _test: los helpers
eliminan schema public. Nunca ejecutar integración contra DB demo o compartida.

## Preparación

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
pnpm --dir frontend install --frozen-lockfile
pnpm --dir backend build
pnpm --dir backend db:migrate
pnpm --dir backend db:seed
pnpm --dir backend start
```

Comandos no cargan .env automáticamente. PostgreSQL debe estar disponible.
Tras migrar, memberships previas tienen is_admin=false. Seed no los promueve.
El PM ejecuta la migración de datos versionada descrita en contracts/onboarding.md
para una institución nueva y su primer superadmin; usar fixtures separados para
UC/UTFSM existentes. Credenciales iniciales solo en entorno seguro.
No usar SQL manual para saltar el historial. Guardar token solo en memoria.

## US1: Encontrar mis cursos

Fixtures SQL exclusivos crean dos owners, dos secciones por curso, teacher,
assistant, student y múltiples roles. No requieren endpoints de gestión US2.
Probar mismo User con admin UC y no-admin UTFSM, más cursos de otro owner.

1. GET /me: isAdmin refleja cada institución y sectionMemberships roles vigentes.
2. Listar cursos como teacher/assistant/student: solo los de inscripción activa.
3. Consultar secciones: solo propias; admin dueño ve todas las de su curso.
4. Admin sin Enrollment ve metadata de su curso; no obtiene permisos académicos.
5. Revocar Enrollment: siguiente consulta pierde ese acceso, conserva filas;
   otros roles vigentes mantienen su acceso correspondiente.
6. Admin ajeno sin Enrollment, tenant ajeno y UUID inventado: 404 uniforme.
7. Revocar membership/User/institución, aun con token vigente: 404/401 según contrato.

## US3: onboarding y delegación

1. Migración de datos nueva: Institution+User+membership con ambos flags y evento.
2. User global existente: reutilizado sin modificar credenciales ni duplicarlo.
3. Repetir migración: alreadyApplied; no cambia flags/credenciales/timestamps.
4. Fallo de evento: rollback de todas las altas; slug/email conflictivos fallan.
5. GET /memberships como superadmin: solo activos de su institución, paginados.
6. PUT /memberships/{membershipId}/course-admin con {isAdmin:true}: 200 y evento;
   verificar flag persistido sin crear cursos. Revocar preserva Enrollment e historia.
7. Admin ordinario/teacher no delegan; ID de UTFSM no puede modificarse desde UC.
8. Body con isSuperAdmin se rechaza; repetir PUT es no-op sin evento nuevo.
9. Ejecutar set-superadmin según contracts/set-superadmin.md: revocar con reemplazo
   atómico, recuperar con cero responsables y repetir sin reponer flags; PUT del
   revocado da 403 y del reemplazo funciona. Sin reemplazo, último no se revoca.
10. Concurrencia y fallo de auditoría no producen cambios parciales ni secretos.

## US2: Administrar cursos propios

1. Admin UC POST /courses: 201, Location, Course+Section+teacher+eventos presentes.
2. Misma cuenta no-admin UTFSM: 403 creando curso; repetir código/term UC: 409.
3. Otro admin con curso visible por Enrollment: no configura ni crea secciones (403).
4. Owner admin crea/actualiza secciones; capacity negativa y código repetido fallan.
5. Teacher sin admin modifica participantes propios; otra sección invisible 404;
   sección visible por student no permite escritura ni listado de participantes (403).
6. Asignar student y assistant; repetir uno: misma fila y ningún evento nuevo.
7. Cambiar role conserva origen inactivo; desactivar solo afecta rol solicitado.
8. Dos altas simultáneas: un rol activo. Fallo de AuditEvent: rollback completo.
9. Fixture revoca is_admin y COMMIT: siguiente creación/configuración falla; teacher sigue.
10. Teacher sin admin ve eventos de sus secciones; admin dueño+teacher ve todo
    el curso, incluidos eventos con sectionId=null; student/assistant sin admin no.
11. Provocar UPDATE/DELETE de eventos en DB exclusiva: rechazado; sin secretos.
12. Desactivar último teacher conserva curso, creador e historial.
US2 usa admin/roles de fixtures; no exige ejecutar endpoints de delegación US3.

## Integración después de US1, US3 y US2

PM provisiona destinatarios existentes como indica contracts/onboarding.md;
fixtures cumplen esa precondición en pruebas. Unir onboarding→delegación→creación
real de curso→revocación: verificar creación/configuración rechazadas después,
conservando roles docentes e historia. Aquí se valida el cruce de historias.

## Checks y evidencia

```bash
pnpm --dir backend lint
pnpm --dir backend test
pnpm --dir backend test:integration
pnpm --dir backend test:coverage
pnpm docs:api:lint
pnpm --dir frontend api:check
pnpm --dir frontend typecheck
pnpm --dir frontend test
python3 .github/scripts/check-doc-length.py
```

Probar migración sobre DB vacía y copia de fixtures institucionales poblados;
no cambia identidad, passwords o pertenencias anteriores salvo default nuevo.
Actualizar asserts de conteo de migraciones y readiness existentes.
Registrar resultados reales en docs/backend/courses-roles-validation.md.
No declarar deployment ni cierre de specs posteriores; sin UI ni transferencia.

US1: PostgreSQL 17, foundation/lecturas/persistencia/contexto: 5 pruebas PASS.
OpenAPI lint PASS (warning público /ready), generación, typecheck y 21 pruebas frontend PASS.

Alcance: CU-03/04, RF8–12/25–26 y RNF1–4; PREP-10, BE-09–14.
Baseline identidad-acceso antes de editar: lint, 11 unitarias y 16 integración PASS.

Tras correcciones de auditoría: backend 13 unitarias + 34 integración; coverage 47/47,
líneas 99,41 %, ramas 92,86 %. Frontend 24/24; contratos, tipos, lint/build y Compose PASS.
Trivy corresponde a ejecución anterior; limitaciones de audit/Sonar en documento de validación.
