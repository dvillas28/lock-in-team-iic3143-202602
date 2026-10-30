# Estados y transiciones dirigidas

Referencia: servicios, migraciones y ADR enlazados por ficha. «Prohibida» exige ausencia de efecto,
no simplemente mensaje de error. Estados UI de incertidumbre se distinguen del estado persistido.

| Recurso / estado origen | Acción | Estado destino / restricción | Casos |
| --- | --- | --- | --- |
| Session anonymous | login válido + directorio confirmado |authenticated; contexto/me aún debe autorizar | AUTH-001/021 |
| authenticating | fallo credenciales/directorio |anonymous, password borrada | AUTH-002/021 |
| authenticated | navegaciónSPA |authenticated, mismo scope y borradores | AUTH-010/020 |
| authenticated | reload/pagehide/logout/exp/401 |anonymous, token/datos/drafts/keys fuera memoria | AUTH-010/011/016; NETWORK-001 |
| contexto válido | foco/me idéntico |Mismo objeto/scope; no reset de trabajo | AUTH-020 |
| contexto válido | me503 |warning lectura posible, writes bloqueados; recuperar explícito | NETWORK-003 |
| contexto válido | cambio roles/membership |Scope nuevo o error; desmontar datos privados anteriores | TENANT-005; RBAC-007/012 |
| membership activa | operador revoca |Contexto404 con JWT vigente; sin borrado académico | TENANT-005/006 |
| isAdmin true owner | SA revoca false |Pierde admin, mantiene Enrollment docente si existe | ADMIN-003; RBAC-007 |
| Course inexistente | create válido |Course+Section+teacher+3eventos en una transacción | COURSE-006 |
| Course existente | PATCH owner |Metadatos nuevos, owner inmutable; no-op no audita | COURSE-008/009 |
| Section existente | PATCHowner |Código/capacidad nueva; identidad/curso inmutables | SECTION-002/003 |
| Enrollment inexistente | POST rol |Activa; duplicado activo devuelve mismoID | ENROLL-007/008 |
| Enrollment activa | PATCHrole distinto |Predecesora false, sucesora activa o rol activo existente | ENROLL-010/011 |
| Enrollment activa/histórica | PATCHactive false/true |Revocada/reactivada; no borrar historia; conflicto unicidad | ENROLL-012/014 |
| Enrollment histórica | PATCHrole |409 sin cambio; no-op active es200 sin evento | ENROLL-016 |
| Module/Material oculto | publish sinbody |Publicado; repetición no-op | CONTENT-003/006/008 |
| Module/Material publicado | unpublish |Oculto; contenido/historia intactos | CONTENT-003/010 |
| Module oculto / Material publicado | lectura student |404 hasta ambos publicados; flags independientes | CONTENT-009 |
| Module orden actual | PUT colección completa |Permutación1..n atómica; omisión409/repetido422/ajeno404 | CONTENT-004 |
| Quiz draft | PATCH |Draft editado, UUID retenidas; destino permitido | QUIZ-006/011 |
| Quiz draft válido | publish |Published+GradeItem peso0+audit; irreversible | QUIZ-014 |
| Quiz draft vacío / curso frozen | publish |422/409 sin GradeItem ni evento | QUIZ-017 |
| Quiz published | PATCH/unpublish/DELETE |PATCH409; unpublish/DELETE inexistentes, no feature a implementar | QUIZ-016 |
| Quiz published | repetir publish |200 mismo recurso, sin ítem/evento extra | QUIZ-015 |
| Sin intento activo, Qpublished abierto | start |inProgress; número siguiente; máximo positivo o null | ATTEMPT-001/005/006 |
| inProgress | PUT answers válido |inProgress, conjunto completo reemplazado | ATTEMPT-011/012 |
| inProgress fuera ventana | start/save/submit nuevos |409 sin cambiar estado; cerrar ventana NO cancela | ATTEMPT-007/015/025 |
| inProgress | submit |submitted interno → graded en MISMA transacción | ATTEMPT-018; OPS-007 |
| inProgress | cancel autorizado |cancelled terminal, consume intento, sin Grade | ATTEMPT-028/029 |
| cancelled | cancel repetido |204 no-op; save/submit409 | ATTEMPT-030 |
| graded | submit keyoriginal |200 receipt original; otra key409; cancel409 | ATTEMPT-021/030 |
| graded/cancelled | update/delete DB |Historia inmutable; SQL rechaza | OPS-006 |
| Grade inexistente | primergraded |No publicada, apunta intento vigente | ATTEMPT-018 |
| Grade no publicada | graded número mayor |Reemplaza aunque peor nota; histórico intento intacto | ATTEMPT-020 |
| Grade no publicada + intento activo | publish |409 sin cancelar automáticamente | GRADE-023 |
| Grade no publicada elegible | publish selección completa |Publicada+receipt+audit+freeze atómicos | GRADE-021/022 |
| Grade publicada | otro intento/cambio/republicaciónK2 |Inicio409; inmutable; GRADE_ALREADY_PUBLISHED | ATTEMPT-008; GRADE-027 |
| Pesos abiertos | PUT completo suma100 |Confirmados; no-op sin audit;0 válido | GRADE-014/016/017 |
| PrimeraGrade publicada | freeze curso |Lock monotónico, no nuevos ítems ni cambios pesos | GRADE-017/019; QUIZ-018 |
| Sinpeso publicado | my-grades |partialAverage null, no0/NaN | GRADE-003/005 |
| Peso publicado<100 / =100 | my-grades |Promedio normalizado parcial/completo | GRADE-004 |
| Evento audit persistido | GET filtros/cursor |Solo proyección permitida, nunca muta | AUDIT-001–010 |

## Estados locales de mutación y carreras

| Operación | Cambio local permitido | Prohibido | Casos |
| --- | --- | --- | --- |
| Cualquier write |ready→sending→confirmed/error/uncertain |Éxito optimista sin respuesta; reenviar por foco | COURSE-011; NETWORK-011 |
| start/submit con key |uncertain→replay MISMA key/destino/cuerpo→confirmed |Key nueva automática o cambiar actor | ATTEMPT-004/026 |
| save PUT |uncertain mantiene edición/envío/cancel bloqueados |GET igual no prueba fin de PUT tardío | ATTEMPT-016 |
| cancel204 |confirmed, fecha pendiente si GET falla |Revocar éxito204 por lectura posterior fallida | ATTEMPT-032 |
| publication |Selección/key inmóviles mientras sending/uncertain |Publicar páginas ocultas; receipt inventado tras reload | GRADE-029/031 |
| pesos |unknown scan→editable o frozen |Asumir abierto por primera página o filtro vacío | GRADE-018 |
| submit vs cancel |Un terminal válido según lock |Ambos éxitos incompatibles o Grade de cancelled | ATTEMPT-024 |
| publication vs weights/newquiz |Orden serial compatible con freeze |Modificar pesos/insertar ítem después freeze | GRADE-019; QUIZ-018 |

No estados de borrado, archivado curso, timer de duración, autosubmit, background grading ni
publicación reversible están implementados. No convertirlos en backlog de ampliación del MVP.
