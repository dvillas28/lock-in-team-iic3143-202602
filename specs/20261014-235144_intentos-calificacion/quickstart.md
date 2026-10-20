# Quickstart: Validación posterior a implementación

Estado actual: implementación en feat/intentos-calificacion, basada en PR #94.
Resultados ejecutados: docs/backend/attempts-grading-validation.md.

## Prerrequisitos

Node 24, pnpm 9.15.9, PostgreSQL 17; entorno de identidad/cursos operativo.
Autoría de PR #94 y gate T001 comprobados; no suplirlos con producción fake.
Usar TEST_DATABASE_URL de DB exclusiva; fixtures/migraciones pueden escribir datos.
Credenciales/JWT desde entorno local, nunca versionar ni registrar valores.
Comandos desde raíz; para API configurada usar DATABASE_URL y AUTH_JWT_SECRET.

```bash
pnpm --dir backend install --frozen-lockfile
pnpm --dir backend build
pnpm --dir backend db:migrate
pnpm --dir backend lint
pnpm --dir backend test
pnpm --dir backend test:integration
pnpm --dir backend test:coverage
pnpm --dir frontend api:check
pnpm --dir frontend typecheck
pnpm --dir frontend test
python3 .github/scripts/check-doc-length.py
```

Migración runtime usa DATABASE_URL; integración usa TEST_DATABASE_URL según
backend/test/integration/helpers.mjs. Preparar ambas sin apuntar a datos compartidos.
Checks específicos, tras build y configuración de DB exclusiva:

```bash
node --test --test-concurrency=1 backend/test/integration/attempt-*.test.mjs
```

## US1 independiente

Fixtures SQL: UC/UTFSM, teacher dueño/admin y teacher ordinario, assistant,
student, dos secciones, quiz publicado y GradeItem del esquema real de autoría.
No requiere envío HTTP ni US2 para completar:
1. Start con clave A: 201/Location, inProgress y número 1, sin corrección.
2. Replay A conserva respuesta original; clave B concurrente produce 409.
3. PUT respuestas; GET devuelve elegidas, nunca isCorrect ni puntajes.
4. Guardar [] reemplaza todo; datos inválidos no alteran respuestas anteriores.
5. Cancelar explícito: 204, terminal, ningún Grade; repetir no añade evento.
6. Nuevo start consume número 2 y respeta máximo, incluidos cancelados.
7. Cancelar por teacher sección histórica permitido; assistant/admin solo denegado.
8. Borde opensAt incluido/closesAt excluido; fuera de ventana no muta y cancel sí.

## US2 independiente

Crear intentos inProgress/graded y Grade previa directamente con fixtures; no
invocar rutas de US1 para preparar estos escenarios:
1. Submit califica answers, deja un Grade no publicado y recibo sin resultado.
2. Replay con clave original mantiene recibo, IDs, fechas y eventos; otra clave
   libre o de otro destino produce 409 sin cambios. Probar A→éxito, B→409 sobre
   ese graded, A→409 sobre otro intento; B puede usarse en otro intento porque
   fue rechazada, nunca aceptada como alias.
3. Intento posterior peor reemplaza Grade; anterior y su corrección se conservan.
4. Cancelled no se envía; Grade publicada bloquea nuevos resultados, no replay.
5. Probar 0/60/100 → 1.0/4.0/7.0, omisiones, porcentajes fronterizos, HALF_UP
   de porcentaje y nota; calcular referencia decimal independiente en assertions.
6. Inducir fallo al insertar cada evento: intento/Grade/clave se revierten juntos.
7. Ejecutar save-submit/cancel y submit-cancel con barreras de DB explícitas.

## Negativos y entrega

- Repetir GET/start/PUT/cancel/submit con IDs de UTFSM en UC y otro student;
  incluir FK compuestas y quiz/sección/GradeItem/Attempt cruzados por SQL.
- Revocar User/Institution/membership/Enrollment y repetir con mismo JWT;
  adquirir acceso a pauta bloquea rendición aunque subsista student.
- Mover sección conserva historia; teacher solo de nueva sección no obtiene intento.
- GET assistant no incluye isCorrect/pointsAwarded; student nunca obtiene resultados.
  Validar el anyOf GET real con las tres vistas, incluidos docente/assistant con
  answers [] y resultados NULL, y graded sin respuestas; no exigir rama exclusiva.
- Dos inicios con misma/diferente clave; start vs edición de pauta; saves simultáneos;
  submit/save/cancel; publicación SQL controlada con start/submit/cancel.
- Publicación SQL toma lock Course, comprueba activos, publica Grade y audita;
  demostrar órdenes alternativos sin sleeps arbitrarios. HTTP real queda en notas.
- Instalar desde vacío y migrar DB con cursos/quizzes/GradeItem/datos existentes;
  repetir migrador, reiniciar y verificar integridad/readiness sin borrar historia.
- Registrar comandos, resultados y pendientes en docs/backend/attempts-grading-validation.md.

No cerrar misión con negativos omitidos. Lista académica, pesos y publicación HTTP
quedan fuera; su misión debe repetir carreras y validar flujo completo real.

DB usada en validación: contenedor exclusivo academix-attempts-test, PostgreSQL 17;
base academix_attempts_test, puerto local 55437. Ningún servicio compartido.
