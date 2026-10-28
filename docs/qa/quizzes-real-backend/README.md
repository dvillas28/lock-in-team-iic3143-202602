# Quizzes con frontend, API y PostgreSQL reales

Validación: 2026-10-28. Rama: `feat/quizzes-experiencia-usuario`.
Entorno local nuevo autorizado por el usuario; sin respuestas API simuladas.
[Resultados y comprobación SQL](evidence.json).

## Entorno

- PostgreSQL 17.10, instancia separada en `127.0.0.1:55432`.
- Base `academix_quizzes_dev`; migraciones y bootstrap del repositorio aprobados.
- API NestJS compilada en `http://localhost:3001`; `/health` y `/ready` aprobados.
- Frontend Next.js en `http://uc.localhost:3000`, con CORS institucional real.
- Directorio de datos y runtime PostgreSQL: `.cache/quizzes-local/`, ignorado por Git.
- Credenciales en `.env`; orígenes públicos del frontend en `frontend/.env.local`.
- El motor de Docker Desktop no estaba disponible; la instancia local usa los binarios
  PostgreSQL 17 descargados fuera de las dependencias de la aplicación.

## Recorrido de navegador

Chrome de Windows, 1440 px y creación móvil a 375 px. Se verificaron 14 condiciones
positivas y siete solicitudes inválidas enviadas independientemente a la API.

1. Login real de docente, carga del curso y listado autorizado.
2. Creación de quiz con dos preguntas en un POST 201; UUID generados por backend.
3. Bloqueo local de preguntas sin respuesta correcta, antes de realizar el POST.
4. Lectura del detalle desde persistencia, sin `isCorrect` en la proyección segura.
5. Edición de título con PATCH mínimo; reordenamiento con UUID y pauta conservados.
6. Publicación con foco inicial, navegación por teclado y Escape en el diálogo.
7. Repetición de publicación idempotente; PATCH de publicado rechazado con 409.
8. Estudiante: listado publicado, sin creación ni pauta; acceso a autoría retorna 403.
9. Estudiante: inicio 201, guardado 200 y envío 200 de un intento real.
10. Ayudante: consulta de intentos permitida; creación y pauta rechazadas con 403.
11. Docente UC sobre un recurso solicitado bajo UTFSM: acceso rechazado.

Sin errores JavaScript observados. La nota no publicada se mantiene oculta al
estudiante; el docente consulta el resultado autorizado por la API.
Esto no equivale a validar todas las pantallas o a una auditoría WCAG completa.

| Solicitud inválida | HTTP real |
| --- | --- |
| Título vacío | 422 |
| Cero intentos | 422 |
| Fecha imposible | 400 |
| Cierre anterior a apertura | 422 |
| Ninguna alternativa correcta | 422 |
| Puntaje con más de dos decimales | 422 |
| JSON UTF-8 superior a 4096 bytes | 413 |

El listado conservó su cantidad de registros tras estos siete rechazos.

## Comprobación en PostgreSQL

El quiz publicado tiene dos preguntas, un elemento de nota con peso inicial cero
y exactamente un evento `quiz.published`. El intento quedó `graded`, con 100 % y
nota 7; su nota permanece sin publicar. El rol `academix_runtime` no ve ese quiz
cuando consulta sin contexto institucional. Se conservó el borrador de una
comprobación anterior; no se borraron registros para obtener los resultados.

## Corrección detectada durante la integración

El control nativo `datetime-local` elimina segundos `:00` al exponer su valor.
La comparación anterior lo interpretaba como un cambio y reenviaba fechas al
editar solo el título. Ahora se normaliza esa representación antes de comparar,
conservando exactamente zona y microsegundos originales cuando no hay edición.
Dos nuevas pruebas cubren el parser y el PATCH de la vista; 50 pruebas de quizzes
y creación aprobadas. TypeScript y ESLint aprobados; backend build aprobado.

## Reanudar en este equipo

Usar Node 24 y pnpm. Primero iniciar la base si está detenida:

```bash
bash .cache/quizzes-local/start-db.sh
```

Backend, desde la raíz del repositorio:

```bash
node --env-file=.env backend/dist/commands/start.js
```

Frontend, en otra terminal; Next.js carga `frontend/.env.local` automáticamente:

```bash
pnpm --dir frontend dev
```

Cuentas: `demo-uc@academix.example` (docente), `demo-multi@academix.example`
(estudiante) y `assistant.uc@academix.example` (ayudante). Sus contraseñas están
en `DEMO_UC_PASSWORD`, `DEMO_MULTI_PASSWORD` y `DEMO_UC_ASSISTANT_PASSWORD` del `.env`.
La cuenta `ana@example.test` pertenecía únicamente al simulador anterior.
