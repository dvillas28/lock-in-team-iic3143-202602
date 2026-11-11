# Issue: USR-08 Verificar trazabilidad, aislamiento y aceptación integrada de usuarios

Estado: en progreso; pendientes externos o de evidencia indicados abajo. [#237](https://github.com/dvillas28/lock-in-team-iic3143-202602/issues/237).
Registro: 2026-11-06; publicación: 2026-11-07. Responsable: Matías (matiaraos).
Objetivo: Semana 5 E4, 2–8 de noviembre de 2026, America/Santiago; estimación aún preliminar.

Cerrar evidencia integrada de requisitos de perfiles, seguridad, altas y CSV. No sustituye pruebas propias de cada entrega; se completa cuando existen las funcionalidades.

## Trazabilidad

- ID: USR-08; área principal: BE; tipo: test; prioridad: P1.
- Estimación: 8 horas-persona; no es compromiso de calendario.
- CU: CU-17–21.
- RF: RF30–56.
- RNF: RNF11–20.
- Dependencias: [USR-02](USR-02.md), [USR-04](USR-04.md), [USR-05](USR-05.md).

## Criterios de aceptación

- [x] Matriz requisito → tarea/issue → prueba/evidencia con resultados reales y pendientes explícitos.
- [x] API/DB reales prueban actor propio, admin/superadmin, UC/UTFSM, revocación, grants/RLS y owner no superusuario; SQL arbitrario sigue bloqueado.
- [x] CSV con fallo de fila/auditoría no aplica parcialmente; replay/carreras no duplican; perfiles/contraseñas no se pisan mediante altas.
- [x] Migración desde datos poblados, readiness, seeds insert-only y regresión de courses/enrollments/attempts/grades.
- [x] Recorridos de interfaz aceptados manualmente por Matías; Playwright omitido por instrucción expresa; catálogo/modelo y guías actualizados.
- [ ] Registrar resultados desglosados de teclado, 375 px y ambos temas; no se atribuyen al reporte manual general.
- [ ] Completar validación integrada de S3 real con Daniel (#234).
- [x] Resend simulado: cuota/rate, respuesta incierta, commit sin correo, pérdida del resultado y pausa/reanudación CSV; ningún código en logs/DTO administrativos.
- [x] Prueba real local opt-in con enlace localhost y dominio verificado, sin envíos reales en CI; GET/scanners no consumen activación.
- [x] Cortes 7/30, solicitudes sin primera emisión, concurrencia e idempotencia del mantenimiento: sin PII residual, altas/envíos por replay ni pérdida de recibos/FK/historia académica.

## Límites

User es global y los permisos son institucionales. Altas por formulario/CSV no crean
Enrollment ni conceden isAdmin/isSuperAdmin. No editar credenciales ajenas ni revelar
otras instituciones. Sin cambio de correo, borrado de cuenta, recuperación de
contraseña olvidada o importación de matrículas.

Las pruebas propias acompañan la implementación de cada historia; USR-08 verifica
la integración y no permite posponer controles de aislamiento o integridad.

## Referencias

- [Requisitos](../requisitos.md)
- [Backlog y matriz](../backlog.md)
- [Modelo de datos](../modelo-datos.md)
- [Contrato CSV](../importacion-csv.md)
- [Plan Resend](../correo-resend.md)

La publicación no acredita implementación, despliegue ni validación externa.

## Validación manual aceptada — 2026-11-08

Matías reporta prueba manual de Resend e interfaz y solicita no ejecutar Playwright.
Se registra como reporte del usuario, no ejecución del agente ni validación de
variantes no desglosadas. [Evidencia y checks finales](../evidencia.md).
