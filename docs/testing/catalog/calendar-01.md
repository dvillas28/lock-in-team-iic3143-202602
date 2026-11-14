# Fichas CALENDAR · 01

[Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test y nunca usan credenciales de producción.

<a id="e2e-calendar-001"></a>

## E2E-CALENDAR-001 — Plazos desde el calendario flotante y la vista completa

- Módulo / flujo: CALENDAR; consulta transversal de plazos.
- Requisito: CU-26 (propuesto); visibilidad estudiantil por sección y aislamiento por institución.
- Objetivo: verificar el botón flotante, el mini calendario por teclado, Escape con retorno de foco, la vista completa, los filtros por tipo y el enlace al quiz.
- Rol / institución: T1 publica por API; ST1 consulta en 390 px; UC por defecto.
- Precondiciones / fixtures: BASE; curso C1, sección S1 y quiz publicado con cierre en dos días.
- Nivel / suite: E2E navegador real; regression.
