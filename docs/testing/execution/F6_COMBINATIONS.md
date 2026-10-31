# F6 — Pares y cruces de compatibilidad

[Validación](F6_VALIDATION.md) · [Matriz original](../matrices/COMBINATIONS.md).
Los pares visuales complementan los controles exhaustivos de tenant/roles/transiciones de F3–F5.
No sustituyen esas fronteras por una muestra combinatoria ni convierten su evidencia en regresión actual.

## Pares priorizados factibles

| Dimensiones | Pares factibles | Cubiertos | Evidencia |
| --- | --- | --- | --- |
| TenantUC/UTFSM × tres motores | 6 | 6 | A11Y-007/uc,utfsm y lost-publication |
| Rolstudent/teacher × tres motores | 6 | 6 | A11Y-007 recorridos y author-mobile |
| Viewport1440/375 × tres motores | 6 | 6 | A11Y-005 y A11Y-007 |
| Temalight/dark × tres motores | 6 | 6 | A11Y-005, ambos temas en cada test |
| Rolstudent/teacher × dos temas | 4 | 4 | A11Y-005/ST1,AO; AO tiene rol docente académico |
| Rolstudent/teacher × dos viewports | 4 | 4 | A11Y-005 y recorridos A11Y-007 |
| Tenant × dos viewports | 4 | 4 | UC:A11Y-005; UTFSM:uc/utfsm y author-mobile/lost-publication |
| Tenant × dos temas | 4 | 4 | UC:A11Y-005; UTFSM:recorrido y utfsm-teacher-dark/lost-publication |
| **Total de pares de dimensiones priorizadas** | **40** | **40** | Runs citados en F6_VALIDATION |

Se cuentan pares de dimensiones, no pruebas ni todas las combinaciones de tres o más dimensiones.
UTFSM en el recorrido normal usa1440/light; las variantes compactas/oscuras declaran esos cambios.
Los fallos de red se cubren por familia/read/write con casos específicos de idempotencia, como permite
la matriz original; no se repite cada timeout en cada endpoint/motor. Esa expansión no entra en40/40.
No se afirma cobertura del producto cartesiano de todos los estados ni de todos los dispositivos.

## Cruces iniciales obligatorios de la matriz

| Cruce propuesto | Evidencia real de la semántica y configuración |
| --- | --- |
| AUTH-001/ST1, UC/Chromium/1440/light | A11Y-001/keyboard-login, run c5e6893301dac070 |
| AUTH-001/teacher, UTFSM/Firefox/1440/dark | A11Y-007/utfsm-teacher-dark; FT1 es el docente del tenantUTFSM |
| PUBLIC-001/portal, WebKit/375/light | A11Y-007/portal-compact |
| TENANT-008/reverse, UTFSMteacher/UCajeno/Chromium/375/dark | A11Y-007/foreign-mobile |
| RBAC-009, TS-SAME/Firefox/1440/light | Evidencia histórica F4:d014cf0385019d99, SHA6db9541; no repetida |
| RBAC-010, TS-CROSS/WebKit/375/dark | A11Y-007/cross-role-mobile |
| CONTENT-009/01, UCstudent/Chromium/1440/dark | A11Y-007/hidden-module-dark; materialpublicado bajo módulooculto |
| CONTENT-008, UTFSMteacher/Firefox/375/light | A11Y-007/author-mobile; crear, editar, publicar y leer como estudiante |
| ATTEMPT-016, UCstudent/WebKit/1440/light | A11Y-007/lost-save, commit real y respuesta descartada |
| GRADE-029, UTFSMteacher/Chromium/375/dark | A11Y-007/lost-publication, replay exacto y recibo único |
| AUDIT-003, UCownerstudent/Firefox/375/dark | A11Y-007/owner-student-dark; Grade ausente y dos eventos reales conservados |
| NETWORK-008, ST1→ST2/WebKit/1440/light | a8da79e3e69bd6aa, login SPA y401 tardío |

Las nueve variantes adicionales de A11Y-007 se ejecutaron en los tres motores en600966c85750d479.
No se renombran fichas históricas ni se suman estas variantes como casos nuevos del catálogo.
La fila RBAC-009 conserva su evidencia anterior por la restricción de no repetir F1–F5.
Los alias de actores se resuelven por tenant; no se usa un usuario de UC como docente de UTFSM.

## Exclusiones y límites

- Configuraciones imposibles de roles/estados continúan excluidas por dominio; se prueba su rechazo.
- No se extrapola40/40 a cada versión de navegador, zoom físico, lector de pantalla o contraste total.
- El reflow720px equivale al espacio CSS de una ventana1440px al200%; no simula todos los navegadores/sistemas.
- CI remoto y ventana de veinte ejecuciones permanecen fuera de esta aceptación local y pendientes en F7.
