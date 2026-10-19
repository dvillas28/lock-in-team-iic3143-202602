# Authorization: Alcance académico e historia

Cada petición revalida User, Institution, membership y Enrollments persistidos.
JWT/URL nunca conceden rol. Superadmin solo delega; flags de otro tenant no aplican.

| Operación | Permiso |
| --- | --- |
| GET grade-items | Teacher o assistant activo en curso; admin sin teacher no basta |
| PUT pesos | Teacher activo de alguna sección + is_admin + created_by=actor |
| POST publicación | Teacher activo; owner admin amplía a todas las secciones del curso |
| GET libro/listado de intentos | Teacher en su alcance o assistant en sus secciones activas |
| GET my-grades | Student activo; identidad de sub; solo propias publicadas |
| GET audit-events | Admin dueño, aun sin teacher, o teacher de sección; assistant/student no |

Teacher ordinario solo secciones con Enrollment teacher activo. Assistant no
hereda alcance global por tener is_admin: la ampliación académica requiere teacher.
Roles se unen por acción, no por un perfil global: assistant de S1 + teacher de S2
puede leer ambas, publicar solo S2 y ver pauta solo donde el predicado de autoría
lo permite. Cualquier campo de corrección requiere permiso de pauta del recurso.
La lectura assistant permite puntaje/nota de seguimiento, no answers corregidas,
isCorrect/pointsAwarded ni alternativas correctas. No exponer pauta vía errores.

Libro agrupa por estudiante/sección histórica; cambio de sección no mueve resultados.
Alumnos revocados conservan expediente para staff autorizado, pero no acceso propio.
Publicar no exige membership vigente del destinatario; sí sección histórica incluida,
Grade calificada, ausencia de activo y autorización vigente del actor en todo el lote.
No excluir silenciosamente un ID ajeno, una sección no autorizada o una Grade faltante.

Historial: owner ve sectionId=NULL y todas las secciones de su curso; teacher
ordinario solo eventos de secciones teacher activas. Eventos institucionales
course_id=NULL no aparecen. sectionId filtro no aumenta permisos.
Sanitizar changes al leer, incluidos eventos históricos; mantener identificadores,
fechas y campos académicos permitidos, nunca secretos, claves o pauta.
Revocar rol/flag retira permisos inmediatamente en la siguiente petición y en replay.

Errores: 401 identidad inválida/inactiva; 404 tenant/recurso/filtro de sección no
visible; 403 recurso visible sin acción permitida. No incluir detalles de terceros.
Lecturas/éxitos usan Cache-Control:no-store; no sumar caché de permisos o resultados.
