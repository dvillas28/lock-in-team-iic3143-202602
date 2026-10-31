# Implementación E2E: estado verificable

Corte: **2026-10-31**. **F1–F4 aceptadas localmente; suite del catálogo incompleta.**
[Validación F4](F4_VALIDATION.md) · [F3](F3_VALIDATION.md) · [F2](F2_VALIDATION.md) · [F1](F1_VALIDATION.md).

## Conservación y entorno

- Checkout permanente: `/Users/julian/lock-in-team-iic3143-202602`, rama `test/e2e-f4`.
- Código validado `6db954174f277f34194ae8a4e39e50a81c7f090e`; commits anteriores conservados.
- `dev`:90463059015e5045d011eadd12b6403b7b492615; `main`:294eb5b4642479772a921ce56ce860c2f329abb6.
- Sin push, merge, despliegue ni producción. La ejecución no necesita la copia temporal inicial.
- ENV-01/02 resueltos con PostgreSQL17 y navegadores locales autorizados.
- Next/Nest y migraciones reales, DB por caso/retry, runtime sin bypass RLS y cleanup con ownership.
- Dos fixes funcionales separados e incorporados localmente: NUL HTTP400 y publicación tras edición incierta.

## Evidencia vigente

Run `d014cf0385019d99`, SHA `6db9541`, seed `academix-e2e-v1`, checkout limpio al inicio/final, exit0.
**329 PASS, 0 FAIL/skip/flaky**: Chromium239, Firefox45 y WebKit45.
Son275 instancias navegador y54 complementarias, con actor/tenant/nivel en los resultados.
**139/248 fichas aprobadas**:117 navegador y22 complementarias; **109 pendientes**.
F4 cierra54 fichas de cursos, secciones, participantes y contenido. Su run independiente tiene126 PASS.
Typecheck/lint y unitarios pertinentes PASS; reportes y eliminación de recursos verificados.
No se relajaron aserciones ni aumentaron reintentos; diagnósticos y fixes están en[F4_VALIDATION](F4_VALIDATION.md).

## Continuidad

- **Detenerse antes de F5 para revisión del usuario. F5 no iniciada.**
- Retomar desde `test/e2e-f4` y crear `test/e2e-f5` solo tras nueva autorización.
- [Guía incremental](E2E_EXECUTION_JOURNAL.md): comandos por fase, todas, navegador visible e inspector.
- Pendiente: F5 ciclo académico y smoke completo; F6 errores/accesibilidad/compatibilidad; F7 CI/estabilidad.
- Q02 resuelto: HTTP400 para NUL en metadatos y sin persistencia parcial, fix5b9c242.
- CI remoto, protección de ramas y veinte runs elegibles no acreditados; no hay permiso de push/merge.
- Los329 resultados no representan248 fichas ni la suite completa. El timeout previo de F3 queda visible.

Las estimaciones del plan son históricas; no representan porcentajes de avance ni duración garantizada.
