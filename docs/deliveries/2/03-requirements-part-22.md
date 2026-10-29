## Reglas de negocio y seguridad

- `institutions.id` es UUID interno; `slug` es legible y globalmente único.
- Las relaciones internas usan UUID, no slug.
- Un slug válido pero no visible para el User produce `404`.
- Un recurso de otra Institution produce `404` para no revelar su existencia.
- Una acción prohibida sobre un recurso visible produce `403`.
- JWT ausente, inválido o expirado produce `401`.
- Los códigos académicos son únicos dentro de su Institution cuando corresponda.
- Los cambios sensibles se auditan en la misma transacción y con
  `institution_id`.
- Las reglas de intentos, pauta, ponderaciones y publicación se mantienen como
  define el modelo de dominio.
- RLS/runtime sin bypass implementados; no reemplazan autorización académica.
- Jerarquías, alta general/invitaciones y restore lógico por institución fuera del MVP.
- Onboarding inicial operativo no equivale a alta general en institución existente.
