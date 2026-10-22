# Quickstart: Validar rendición frontend de quizzes

Guía para la implementación futura; estos recorridos no se ejecutaron al planificar.
Ver [contrato](contracts/quiz-attempts.md) y [modelo](data-model.md).

## Prerrequisitos

- Node 24/pnpm 9.15.9; instalar dependencias con `pnpm --dir frontend install --frozen-lockfile`.
- API local funcional, PostgreSQL de pruebas migrado y fixture UC/UTFSM según
  `docs/backend/demo-tenant-bootstrap.md`; no usar datos productivos para pruebas.
- Dominios uc.localhost:3000/utfsm.localhost:3000, NEXT_PUBLIC_API_URL y API_URL
  configurados según setup existente; credenciales fuera de los artefactos.
- Quiz publicado fixture con preguntas/opciones, ventanas null y acotadas, máximo
  null y positivo; estudiantes, teacher de sección histórica, teacher admin dueño,
  teacher ajeno, assistant y multirol con acceso a pauta.
- Intentos activos/graded/cancelled conocidos, student revocado y sección histórica
  distinta de matrícula actual. Fixtures permiten validar sin editor/libro frontend.

## Comandos de validación

Desde raíz, tras implementar las tareas:

```bash
pnpm --dir frontend api:check
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend test
pnpm --dir frontend test:coverage
pnpm --dir frontend build
python3 .github/scripts/check-doc-length.py
pnpm --dir frontend dev
```

Backend, con DB de pruebas y variables requeridas por sus fixtures:

```bash
pnpm --dir backend test:integration
```

No basta un suite verde que omita integraciones por falta de DB: registrar skips.
Pruebas existentes attempt-contract/lifecycle/window/permissions/integrity/concurrency/
grading y gradebook-publication prueban invariantes reutilizadas. Verificar también
runtime RLS, omisión de predicado, conexión reutilizada y contexto route frente a
headers/body con integraciones existentes; no agregar migraciones por esta misión.

## US1 — Iniciar, guardar, reanudar (MVP)

1. Login UC student; abrir listado/detalle fixture publicado sin consultar /authoring.
2. Iniciar: doble clic manda una operación, misma clave y destino. Perder respuesta
   y repetir con clave original devuelve mismo ID; GET posterior carga estado actual.
3. Responder y guardar: muestra pending/saving/saved real; colección completa llega
   a PUT. Controles congelados evitan dos snapshots concurrentes. [] pide confirmación.
4. Recargar enlace `/attempts/{id}`; login vuelve al ID conocido y GET restaura solo
   respuestas confirmadas. No restaura cambios locales ni claves perdidas.
5. Simular replay start después de graded/cancelled: la vista sigue terminal tras GET.
6. Fallar/retardar PUT: conserva borrador, no afirma guardado ni envía otro PUT/submit
   mientras no se confirme resolución. GET aislado no desbloquea un PUT incierto.
7. Sin ID ni clave tras recarga: explica límite; no promete descubrir intento activo.

## US2 — Envío seguro con intento guardado fixture

1. Cambiar respuesta, confirmar envío; observar PUT exitoso antes de POST submit.
2. Rechazar PUT: no aparece POST submit. Cancelar diálogo no muta nada.
3. Perder respuesta de submit: consultar GET o repetir solo POST con misma clave;
   no repetir PUT. Doble confirmación no produce otro intento ni calificación.
4. Comprobar recibo id/graded/submittedAt sin grade/score/puntos/porcentaje/corrección.
5. Cerrar ventana/publicar después de submit confirmado y repetir clave original:
   backend revalida permisos y conserva resultado sin recalcular ni auditar otra vez.
6. Otra clave, sesión vencida o conflicto no fuerzan éxito. inProgress observado
   durante petición tardía conserva incertidumbre; no habilita nueva escritura.

## US3 — Cancelación independiente

1. Desde ID activo fixture, student confirma: consume máximo, termina sin nota.
2. Teacher histórico cancela fuera de ventana con student revocado; teacher admin
   dueño amplía alcance. Assistant/teacher ajeno/admin solo no muestran control.
3. Repetir POST cancel devuelve 204 sin evento duplicado; no parsear JSON vacío.
4. GET fallido tras 204 conserva cancelación confirmada y permite reintentar lectura.
5. Intento graded rechaza cancelación; nota publicada queda intacta. Cancelar no
   constituye calificación requerida para publicar.

## Matriz transversal FR-019

- UC/UTFSM: cruzar slug/IDs, destino start, quizId e intento ajeno; sin filtraciones.
- Multirol/pauta, revocación, sección histórica y administración sin ownership.
- 401/403/404/409/413/422/503/red; carga/vacío; logout/cambio de usuario/contexto
  durante request; ninguna respuesta vieja repuebla vista ni opera con clave anterior.
- submit/cancel/publicación concurrentes: API conserva locks y auditoría atómica;
  frontend nunca afirma éxito sin respuesta confirmada o GET terminal autorizado.
- Retorno login: UUID válido aceptado; URL externa, //host, backslash, query/hash,
  parámetros next duplicados y doble codificación rechazados.
- Teclado/radios, aria-live, foco/Escape, móvil 375 px, temas claro/oscuro,
  contraste ≥4.5:1, reduced motion. Usar contenido académico realista.
- Regresión: listado/edición/publicación docente, destinos login existentes y
  fixtures de sesión/cursos conservan comportamiento.

## Evidencia a entregar

Registrar resultados, comandos, skips y límites en `docs/guides/frontend-quiz-attempts.md`.
Distinguir mocks DOM de API/DB real; verificar número de intentos, Grade e historial
backend para no duplicación. No declarar seguridad RLS a partir de mocks frontend.
