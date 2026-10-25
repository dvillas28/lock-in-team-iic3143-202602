# ADR: Cursos demo en el seed operativo

Fecha: 2026-10-25. Estado: implementado; ejecución en producción pendiente.
Petición: extender el seed existente para probar cursos también en producción.
Trazabilidad: CU-01–04, RF1–9, RNF1–4/7/9; depende de acceso por dominio,
ownership académico y esquema multi-tenant existentes. Conserva sus reglas de autorización.

## Decisión

- Extender `db:seed` con `DEMO_ACADEMIC_DATA_ENABLED=true`, desactivado por defecto.
  Solo el comando manual lo consume; predeploy y arranque HTTP no cargan cursos.
- Reusar identidades legacy: demo-uc y demo-utfsm son docentes de una sección demo
  en su institución. Demo-multi es estudiante en ambas. No crear administradores
  ni superadmins, no promover flags y no matricular cuentas revocadas/inactivas.
- Crear un curso `DEMO-UC-101` y otro `DEMO-UTFSM-101`, período `DEMO`, sección 1,
  capacidad 30, con cuatro matrículas activas en total. Tenant explícito en cada FK.
  El docente de cada sección es el creador inmutable de su curso.
- No crear módulos, material, quizzes, intentos, calificaciones ni publicaciones.
  Docente sin flag admin conserva el alcance de su sección; no se promete gestión
  administrativa del curso ni capacidad de crear otros cursos.
- Una transacción y el advisory lock del seed cubren identidades y ambos cursos.
  Fallo de validación, colisión o registro operativo revierte todos los inserts.
- Reservar UUIDs y códigos demo en un manifiesto versionado. Conflictos iniciales
  no adoptan ni sobrescriben recursos existentes, aunque compartan código o UUID.
- Exigir `DEMO_OPERATOR_REF` sin secretos y las cinco contraseñas legacy del seed.
  No cambiar hashes existentes ni imprimir credenciales, emails o URLs de conexión.

## Historia, auditoría y repetición

La tabla operativa existente `demo_data_runs` registra versión `demo-academic-v1`,
fingerprint del manifiesto, operador, fecha y grafo inicial completo: instituciones,
cursos, secciones, creadores, roles y matrículas. Este registro se guarda en la misma
transacción; el runtime no tiene acceso a él. No se atribuyen eventos HTTP a docentes
que no ejecutaron la carga ni se debilitan las restricciones de actor de auditoría.
La auditoría académica posterior conserva sus eventos reales y su API vigente.

Repetir valida la procedencia y los vínculos inmutables; no ejecuta UPDATE ni vuelve
a insertar recursos. Conserva cambios de nombre/capacidad, contraseñas, estados,
permisos revocados e historial. Nunca reactiva una matrícula ni completa una carga
con marcador inconsistente. Faltar recursos, cambiar el fingerprint o borrar el
marcador con recursos presentes produce conflicto; requiere revisión operativa.
Una nueva versión de datos exige una nueva decisión/migración, no editar el v1 aplicado.

## Producción y límites

Usa exclusivamente `MIGRATION_DATABASE_URL` con validación de TLS existente.
Funciona en Docker/Render sobre esquema migrado, con ejecución explícita del operador.
No depende de hosts frontend ni necesita CORS adicional. No se habilita por defecto
en `render.yaml`, no se despliega ni se ejecuta en producción como parte de este cambio.
No modifica DNS, JWT, RLS, autorizaciones HTTP, grants o restricciones del esquema.

Los datos demo son duraderos y no son un reset: las tablas académicas protegen su
historia contra borrado. No ofrecer limpieza automática ni recomendar borrar volúmenes
o marcadores para repetir. [Operación y validación](../guides/demo-academic-seed.md).
