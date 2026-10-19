# Quickstart: Validación tras implementar

Guía ejecutable; resultados y pendientes en docs/backend/gradebook-validation.md.

## Preparación

Node 24, pnpm 9.15.9, PostgreSQL 17. Integrar primero identidad, cursos, módulos,
autoría y envío/calificación reales, incluidas migraciones; no usar fakes de producción.
Usar DATABASE_URL y TEST_DATABASE_URL exclusivas para pruebas; fixtures escriben datos.
AUTH_JWT_SECRET/credenciales desde entorno local sin versionarlas ni imprimirlas.
La ejecución usa contenedor exclusivo `academix-gradebook-test`, DB `gradebook_test`.
Migraciones reales terminan en `20261019000200_attempts_grades.sql`; la nueva
`20261019000300_grade_publication.sql` va después. No ejecutar suites que resetean
esquema en paralelo ni compilar mientras una suite usa dist. Prefijar comandos con
`rtk` según instrucciones del entorno. DATABASE_URL debe ser la misma DB exclusiva
que TEST_DATABASE_URL antes de ejecutar db:migrate.
Desde raíz, con dependencias instaladas:

```bash
pnpm --dir backend build
pnpm --dir backend db:migrate
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

Suite focalizada, después del build y configuración DB:

```bash
node --test --test-concurrency=1 backend/test/integration/gradebook-*.test.mjs
node --test --test-concurrency=1 backend/test/integration/academic-flow.test.mjs
```

## US1 independiente

Fixtures SQL en esquema real: UC/UTFSM, owner teacher, teacher ordinario,
assistant, student, dos secciones, ítems, Grade graded y abandonos inProgress.
No depende de US2 ni de ejecutar endpoints de intento para preparar datos.

1. GET grade-items; PUT colección completa a 100: 200 y un evento before/after.
2. Total 99.99/100.01, IDs repetidos/faltantes/ajenos, >2 decimales: rechazo íntegro.
3. Publicar listas explícitas con alumno sin Grade o intento activo: 409 sin cambios.
4. Cancelar abandono explícitamente mediante intento; publicar: 200 y timestamp común.
5. Replay misma clave y arrays reordenados: recibo idéntico incluso tras reinicio.
6. Otra selección/curso con clave repetida u otra clave sobre Grade publicada: 409.
7. Tras primera publicación, PUT pesos y alta de GradeItem fallan; notas inmutables.
8. Forzar fallo en evento/recibo antes de commit: rollback total y clave reutilizable.
   Capturar stdout/stderr: error observable sin sentinelas de claves, JWT, pauta,
   respuestas ni datos identificables/notas de UC o UTFSM (RNF9).
9. Teacher ordinario publica solo su sección; assistant/admin sin teacher no publican.

## US2 independiente

Crear Grades publicadas/no publicadas y eventos directamente con fixtures, sin US1.

1. My-grades solo propias publicadas, nunca nota de otra identidad ni no publicada.
2. Datos SC-002 (6.5×15,6.8×15,5.1×25,7.0×10): 6.1 y 65%, parcial true.
3. Cero publicados o solo peso cero: null/0/true; probar HALF_UP exacto en empate.
4. Libro teacher/assistant incluye notas publicadas/no publicadas solo de su alcance;
   consultas estudiantiles nunca muestran no publicadas. Paginación sin duplicados ni pauta.
5. Listar intentos con filtros: assistant sin corrección, teacher solo pauta permitida.
6. Historial por fecha/acción/recurso/sección sanitiza también payloads históricos.
7. Teacher no ve eventos globales; owner sí aun sin teacher; student/assistant 403.
8. Cambiar sección conserva notas/eventos originales; revocación deniega nuevo acceso.

## Carreras e integración

Barreras de DB deterministas, conexiones separadas, ambos órdenes; no sleeps arbitrarios:
- Publicación vs start/submit/cancel HTTP reales; activo bloquea sin cancelación implícita.
- Publicación vs pesos/alta de ítem; primer commit define freeze, nunca suma parcial.
- Dos publicaciones con igual clave, claves distintas solapadas y misma clave otro curso.
- Revocar permisos mientras mutación espera lock: revalidar antes de confirmar.
- Instalación vacía, upgrade con notas/eventos, repetición y readiness tras reiniciar.
- Reutilizar readiness.test.mjs para /health: status/version/commit/deployedAt/timestamp,
  sin secretos ni datos académicos; registrar evidencia de health/logs/despliegue (RNF9).
- Flujo completo identidad→institución→curso→quiz→intento→Grade→publicación en ambos tenants.
- Matriz 16 CU, con cobertura de requisitos según docs/deliveries/2/03-use-cases-and-requirements.md.
- Identificadores cruzados, flags insuficientes, roles acumulados y curso ajeno: cero fugas.

Registrar comandos, resultados y pendientes en docs/backend/gradebook-validation.md;
no cerrar misión con negativos pendientes. Contratos/detalles: contracts/ y data-model.md.

Migración adicional `20261019000400_validate_publication_history.sql`: valida
publicaciones preexistentes (pesos, resultado graded, último intento y ausencia
de activos), falla sin reparar historia inválida. Se añade después de 003 para
conservar la migración ya ejecutada en la DB exclusiva durante desarrollo.
