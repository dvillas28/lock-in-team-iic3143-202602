## Requisitos no funcionales

RNF1. Aislamiento: ninguna lectura, escritura, relación o proceso debe mezclar
datos de Institutions distintas.

RNF2. Seguridad: autenticación, InstitutionMembership y permisos contextuales
son obligatorios. El slug del path no constituye autorización.

RNF3. Integridad: notas, respuestas, ponderaciones y auditoría usan
transacciones cuando cambian juntas.

RNF4. Integridad relacional: constraints, unicidades y FK compuestas incluyen
`institution_id` cuando expresan una relación tenant-owned.

RNF5. Recuperabilidad objetivo: respaldo de la base compartida completa; Render
free actual no acredita backups/PITR. Operador debe resolverlo en otra misión.
Restore lógico por institución fuera del MVP.

RNF6. Mantenibilidad: backend como monolito modular, sin microservicios.

RNF7. Portabilidad: Render es la plataforma configurada; dominio independiente
de sus APIs. Configuración no acredita despliegue o disponibilidad remota.

RNF8. Binarios diferidos fuera del MVP markdown; futura extensión externa con
namespace institucional y proveedor por decidir. No se acredita object storage.

RNF9. Observabilidad mínima: healthcheck, logs de errores y estado de despliegue
sin secretos ni datos de otra Institution.

RNF10. Persistencia: existe una sola secuencia de migraciones. Backfills futuros
son institution-scoped, idempotentes cuando corresponda y por lotes si su
volumen lo exige.
