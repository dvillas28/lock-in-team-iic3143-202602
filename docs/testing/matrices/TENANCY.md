# Matriz UC ↔ UTFSM y scope académico

Aplicar ambas direcciones UC→UTFSM y UTFSM→UC; intercambiar IDs del manifest.
API path define tenant solicitado; membership activa y permisos definen acceso efectivo.
Un token global MULTI puede operar legítimamente ambos tenants según su rol: no exigir401 al cambiar path.

| Origen / actor / cambio | Recurso | Resultado y dato que nunca cruza | Casos |
| --- | --- | --- | --- |
| UC-only token → path UTFSM | /me, courses y todo académico |404 institución inaccesible, no nombres/cursos | TENANT-001/004 |
| UC token con membership ambos → UUID UTFSM en pathUC | Course/section/module/material/quiz/attempt |404 recurso ajeno; no metadata/pauta | TENANT-008 |
| UC docente → PATCH/POST/PUT recursos UUID UTFSM bajoUC | Todas las escrituras inventario |404, snapshot otros tenant estable, cero audit/recibos del fallo | TENANT-009 |
| UC secciónS1 → user solo UTFSM | Enrollment POST |404 target membership invisible; no enrolar | TENANT-010 |
| UC cursoC1 → sectionFS1/body | Quiz create/destino, order |404, sin relaciones compuestas ajenas | TENANT-010 |
| UC gradebook → item/sección/student UTFSM | Weights/publication |422 colección pesos o404 item/sección o409 student sin Grade según flujo; nunca publicar | TENANT-010/GRADE-015 |
| Host/Origin UTFSM, pathUC | Lecturas/escrituras autorizadasMULTI |Solo UC; headers no sobrescriben contexto | TENANT-003 |
| x-tenant/query/body intentan imponer tenant | Toda operación |Ignorado como autoridad o400 por shape; path vigente | TENANT-003 |
| MULTI: student UC, teacher UTFSM | UI, /me, authoring |Solo capacidades del tenant/curso actual | TENANT-002/RBAC-010 |
| Membership UC revocada, UTFSM activa | Token vigente |UC404, UTFSM conserva200, sin datos cacheados UC | TENANT-005/006 |
| CursorUC en UTFSM/otro actor/filtro | users/memberships/enrollments/attempts/book/audit |400 por scope; no cursor como grant | TENANT-013 |
| RespuestaUC posterior a logout/cambio | UI/cache/drafts/selection/receipt |Descartada por generation/context; nunca mostrar al nuevo actor | TENANT-015/NETWORK-008 |
| Backend pool alterna instituciones |12 tablas con RLS |No fuga tras COMMIT/ROLLBACK; sin contexto cero filas | TENANT-014/OPS-006 |
| RolteacherUC cursoC1 → cursoC3/sectionS2 | Recursos mismo tenant |404 cuando sin scope;403 acción si visible sin permiso | TENANT-011/RBAC-008 |
| Ruta UI padreC2 y materialC1 permitido | Validador relaciones |Error seguro aunque cada GET individual autorizado200 | TENANT-012 |
| Historial navegador entre subdominios | Datos privados en BFCache |Pagehide limpia; reautenticación si corresponde | TENANT-007 |

## Expansión exhaustiva por familia de recursos

| Familia | Lecturas a probar con ID ajeno | Escrituras / IDs de cuerpo a probar |
| --- | --- | --- |
| Instituciones/contexto | institutions, me | Sin alta HTTP; slug manipulado /me |
| Membership | GET memberships/cursor | PUT course-admin membershipId target |
| Directorio | GET users search/cursor | Sin POST users; no función inventada |
| Course | GET list/detail | POST code/name/term no puede inyectar institutionId; PATCH IDajeno |
| Section | GET list/detail | POST parentcourse ajeno; PATCH sectionIDajena |
| Enrollment | GET section/list/cursor | POST userId ajeno; PATCH enrollmentIDajena, pathsection incoherente |
| Module | GET course/list/module | POST course, PATCH module, PUT order array, publish/unpublish |
| Material | GET module/list/material | POST module, PATCH material, publish/unpublish |
| Quiz | GET list/detail/authoring | POST course/destino, PATCH quiz/destino, publish |
| Attempt | GET quiz/list/attempt | POST start section+quiz, PUT answers questionId, cancel/submit ID |
| Grade/book | GET items/book/my-grades | PUT weights IDs, POST publications item/section/student y key |
| Audit | GET course/events y filtros/cursor | Sin escritura pública; verificar audit actor/tenant de cada mutación |

Las50 operaciones incluyen públicos health/ready/login sin tenant; sus payloads no llevan datos institucionales.
No forzar aislamiento por Origin en API directa: CORS no es autorización. Ver NETWORK-013.
Para cada rechazo de escritura comparar before/after por IDs+conteos+publishedAt+eventos+recibos
en ambos tenants; no conformarse con un status correcto si hubo efecto persistido.
Fuentes: [DatabaseService](../../../backend/src/database/database.service.ts),
[RLS](../../../backend/migrations/20261020000200_tenant_isolation.sql),
[constraints](../../../backend/migrations/20261016000100_courses_roles.sql), [API](../audit/API.md).
