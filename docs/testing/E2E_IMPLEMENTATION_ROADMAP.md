# Roadmap y backlog de implementación posterior

Ejecución iniciada: F1 bloqueada; las fases restantes no se consideran completadas.
Consultar [evidencia y ledger](execution/IMPLEMENTATION_STATUS.md), separado de estimaciones.

El plan original se conserva. La implementación inicial vive en `test/e2e-implementation`,
basada en `test/e2e-master-plan`; F1 todavía no supera su gate. Los siguientes paquetes serán pequeños. Correcciones del producto se separan en ramas fix/feat;
no ocultar cambios funcionales dentro de tests ni ampliar MVP para completar catálogo.

| Fase / backlog | Objetivo | Horas persona | Complejidad | Dependencia |
| --- | --- | --- | --- | --- |
| [F1 — Infraestructura y datos](roadmap/F1.md) | Entorno fail-closed, seed reproducible y harness que no modifique producción. | 48–72 | Alta | Ninguna; baseline auditado |
| [F2 — Smoke de entrada](roadmap/F2.md) | Login/navegación reales, catálogo estático y primer reporte; smoke académico se completa en F4/F5. | 24–40 | Media | F1 + fases anteriores pertinentes |
| [F3 — Seguridad funcional](roadmap/F3.md) | Permisos/tenant exhaustivos y revocación con token/cursor/key vigentes. | 48–72 | Alta | F1 + F2 |
| [F4 — Cursos y contenido](roadmap/F4.md) | CRUD vigente, participantes y publicación Markdown con persistencia real. | 44–64 | Alta | F1 + fases anteriores pertinentes |
| [F5 — Evaluaciones notas e historia](roadmap/F5.md) | Ciclo académico completo, cálculo independiente, terminales y publicación atómica. | 60–88 | Alta | F1 + fases anteriores pertinentes |
| [F6 — Fallos bordes y compatibilidad](roadmap/F6.md) | Errores deterministas, concurrencia, combinaciones y accesibilidad funcional. | 36–56 | Alta | F1 + fases anteriores pertinentes |
| [F7 — CI/CD y estabilización](roadmap/F7.md) | Gates revisables, presupuesto de ejecución, métricas y mantenimiento. | 24–40 | Media/Alta | F1 + fases anteriores pertinentes |

Total **284–432h persona** (~35.5–54 jornadas de8h).
Incluye harness, datos, 248 fichas con variantes, revisión y primera estabilización.
No incluye corregir defectos del producto descubiertos, cambios de requerimientos o incidentes de proveedor.
Con una persona a20h/semana son14.2–21.6semanas; no prometer terminar toda extended para próxima entrega.
Priorizar slice estableP0/P1 y medir throughput tras primer paquete de10–15fichas; reestimar con evidencia.
Trabajo entre personas puede dividirse por módulo después de acordar F1, sin compartir DB mutable.

## Orden inicial de implementación (no dependencia entre ejecuciones)

1. OPS-008: guard contra producción, antes de cualquier seed/migración; luego OPS-001/004/009.
2. PUBLIC-001 y AUTH-001/002/010: portal, login verdadero y contrato de sesión en memoria.
3. AUTH-011, TENANT-001/002/008/009/010: logout, identidad multiinstitución y frontera backend.
4. RBAC-001/003/005/006/009/010 y AUDIT-003: flags/ownership, pauta, notas e historial privado.
5. COURSE-006, ENROLL-007/010/012, CONTENT-008/009: setup académico/persistencia y visibilidad.
6. QUIZ-005/014/016 y ATTEMPT-001/011/018: autoría a autocorrección real sin revelar nota.
7. GRADE-014/021/003/004/018/029: pesos, publicación, promedio, freeze y replay incierto.
8. ATTEMPT-024, GRADE-028, TENANT-014: carreras, integridad y contextoRLS.

El [catálogo](E2E_TEST_CATALOG.md) resuelve cadaID a ficha. El smoke final tiene22fichas,
pero algunas son parametrizadas en múltiples pruebas; no confundir con22requests o22instancias.

## Asignación completa de fichas

F1=OPS; F2=PUBLIC/CATALOG y AUTH básico; F3=TENANT/RBAC/ADMIN y seguridad AUTH/audit;
F4=COURSE/SECTION/ENROLL/CONTENT; F5=QUIZ/ATTEMPT/GRADE y restoAUDIT; F6=NETWORK/A11Y.
Listados exactos deIDs por fase en anexosF1–F6, sin caso huérfano. F7 automatiza todos sin agregar casos nuevos.
Fronteras ya definidas se implementan con su módulo, no se difiere seguridadP0 a F6.
F6 agrega/estabiliza variantes de red/compatibilidad/concurrencia de esas mismas fichas,
sin contar dos veces su esfuerzo funcional ni crear dependencias de ejecución entre tests.

## Condiciones comunes de aceptación por tarea

- ID estable, vínculo a requisito/evidencia y manifest; diferencia B/M/H/O clara en reporte.
- Setup independiente, nueva variante/retry sin estado de otro test; secretos ausentes de diff/artifacts.
- Operación del usuario real, aserción UI/API y persistencia requerida; denegación sin efectos.
- Cleanup con propiedad de infraestructura; sin eliminar historia para restaurar fixture.
- Una ejecución limpia y repetida, luego incorporación al acumulado de estabilidad; no declarar madurez por dosruns.
- Review equipo de flujo/permiso; las tareas de seguridad aplican guía lms-reviewer.
- No merge/push automático por terminar tarea; seguir autorización/proceso del equipo.
