# Riesgos actualizados

## Riesgos principales

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Fuga entre Institutions | Exposición de datos académicos y daño reputacional | JWT global, Institution explícita, InstitutionMembership, autorización contextual, queries scoped, FK institution-aware y tests cruzados. |
| Query sin scope institucional | Una operación lee o modifica filas de otra Institution | Centralizar el contexto de aplicación, exigir `institution_id` y probar cada trust boundary. |
| Relación cruzada accidental | Section, Quiz, Grade u otra entidad referencia otra Institution | Unicidades y FK compuestas que incluyen `institution_id`. |
| Backfill mezcla Institutions | Corrupción de datos compartidos | Filtrar por Institution, procesar por lotes, diseñar idempotencia y validar conteos antes/después. |
| Mayor radio de impacto de la DB compartida | Una falla operacional afecta varias Institutions | Migraciones revisadas, cambios graduales, backup/PITR completo y observabilidad. |
| Restore individual no disponible | Error localizado no puede restaurarse con un restore físico aislado | Declararlo fuera del MVP; evaluar export/import lógico solo si aparece el requisito. |
| Slug tratado como autorización | Cliente cambia URL y obtiene acceso indebido | Resolver UUID interno y validar membership y permisos en cada request. |
| Auth mock demasiado largo | API académica queda sin identidad confiable | Limitarlo al walking skeleton; exigir JWT antes de habilitar datos académicos. |
| Railway indisponible o mal configurado | Frontend/backend no quedan accesibles | Healthchecks versionados, CI, imágenes Docker reproducibles y variables documentadas sin secretos. |
| Proveedor de archivos no definido | Material binario se retrasa | Mantener markdown primero; elegir storage solo con una implementación que lo consuma. |
| Sobrealcance funcional | No llegar a una demo usable | Mantener fuera admin, jerarquías, RLS, IA, chat, calendario, workers y microservicios. |
| Auditoría incompleta | Cambios académicos no trazables | Evento tenant-owned e inmutable en la misma transacción, con snapshots sanitizados. |

## Riesgos aceptados

- El aislamiento es lógico, no físico; exige disciplina de scope y tests.
- Backup y PITR recuperan la PostgreSQL compartida completa.
- RLS queda fuera del MVP; FK y constraints no reemplazan la autorización.
- Institution se expresa mediante slug en el path por legibilidad, mientras UUID
  permanece como identificador relacional.
- Railway es la plataforma de despliegue; el dominio no depende de sus APIs.
- UC y UTFSM se crearán por bootstrap idempotente cuando exista persistencia.
- El proveedor de object storage se decide al implementar archivos.

## Señales de alerta

- Una tabla académica nueva no incluye `institution_id`.
- Una FK tenant-owned referencia solo `id` sin justificar por qué no incluye
  Institution.
- Una query recibe Institution desde el body en vez del contexto validado.
- Un endpoint académico no está bajo `/institutions/{institutionSlug}`.
- Un recurso de otra Institution produce una respuesta que confirma su existencia.
- Un test usa una sola Institution y no prueba IDs cruzados.
- Una migración o backfill itera datos sin scope institucional explícito.
- Se promete restore por Institution sin un diseño de export/import lógico.
- Se agrega un servicio, proveedor u ORM antes de que un plan lo necesite.

## Riesgos retirados del diseño vigente

- coordinación de migraciones entre múltiples PostgreSQL;
- agotamiento de conexiones por pools por Institution;
- indisponibilidad de una base individual resuelta mediante registry;
- divergencia de schema entre UC y UTFSM;
- mantenimiento de URLs y credenciales de DB por tenant.

Estas referencias pueden permanecer en entregables y ADRs históricos, pero no
describen la arquitectura vigente.
