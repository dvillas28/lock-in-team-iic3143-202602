# Stack draft de módulos y material

Repositorio: dvillas28/lock-in-team-iic3143-202602. Stack nativo GitHub #88.
La solicitud posterior autorizó publicar el trabajo sobre el PR de planificación #87.

| Capa | Título | Rama | Base |
| --- | --- | --- | --- |
| Foundation | feat: preparar módulos y material compartido | feat/modulos-material-foundation | docs/modulos-material-plan (#87) |
| API | feat: implementar módulos y material markdown | feat/modulos-material-api | feat/modulos-material-foundation (#89) |

[PR Foundation #89](https://github.com/dvillas28/lock-in-team-iic3143-202602/pull/89).
Ambos PRs se publican en draft; dependen del stack anterior #85 → #86 → #87.
Los cuerpos siguen Issues relacionados / Descripción del problema / Qué entrega
este PR / Screenshots / Cómo probar, sin cierres de tarjetas ajenas.

## División y comprobación

Foundation incluye DDL, acceso/validación compartidos, whitelist audit, contrato,
tipos, fixtures y registro compilable sin rutas. Suite propia 51/51 PASS;
frontend 25/25, OpenAPI y typecheck PASS.
API completa US1/US2, todas las rutas y sus pruebas negativas/concurrentes,
auditoría atómica, lectura publicada y cierre T001–T032. Código completo validado
63/63 backend y 25/25 frontend; [evidencia](modules-material-validation.md).
No se agregan binarios, renderer HTML, dependencias ni pantallas.

## Integración futura

Fusionar desde la base hacia arriba. Los checks locales no acreditan CI/Sonar.
Si algún predecesor se fusiona por squash, revisar rebase antes de cambiar bases:
transportar solo commits propios y comprobar que no reaparezca el diff anterior.
Cambios locales anteriores y worktrees conservados; publicación desde
/tmp/academix-modulos-stack. Sin despliegue ni cambios de estado del backlog.
