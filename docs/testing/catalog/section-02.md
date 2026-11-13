# Fichas SECTION · 02

[Índice SECTION](SECTION.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-section-006"></a>

## E2E-SECTION-006 — Capacidad no es cuota de inscripción vigente

- Módulo / flujo: SECTION; [FL-SECTION-01](../audit/FLOWS.md#fl-section-01).
- Requisito: CU-03/04; RF12/25/26; RNF3; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [sections.service.ts](../../../backend/src/sections/sections.service.ts); [sections-panel.tsx](../../../frontend/src/components/courses/sections-panel.tsx); [section-form.tsx](../../../frontend/src/components/courses/section-form.tsx).
- Objetivo: Capacidad no es cuota de inscripción vigente; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: caracterización,borde.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses/{C1}/sections`; `listSections; getSection; createSection; updateSection`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear sección con capacidad 1.
2. Asignar ST1 como Estudiante (ocupa el único cupo) y ST2 como Ayudante.
3. Intentar un segundo Estudiante (AS1) y consultar sección y participantes.

- Interfaz esperada: «Cupos de estudiantes: 1» visible; ST1 y ST2 en el listado.
- API esperada: 201 para ST1 y ST2; 409 `SECTION_FULL` para el segundo Estudiante.
- Persistencia / consistencia: dos matrículas activas (Estudiante y Ayudante), capacidad 1; el rechazo no escribe.
- Denegación: la capacidad solo limita Estudiantes ([ADR](../../adr/section-capacity-student-seats.md)).
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../E2E_MASTER_PLAN.md#fases); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Validado localmente; ver [evidencia](../execution/VALIDATION.md).
