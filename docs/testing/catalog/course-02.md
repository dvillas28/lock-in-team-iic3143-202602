# Fichas COURSE · 02

[Índice COURSE](COURSE.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-course-006"></a>

## E2E-COURSE-006 — Crear curso sección y teacher inicial atómicos

- Módulo / flujo: COURSE; [FL-COURSE-02](../audit/FLOWS.md#fl-course-02).
- Requisito: CU-03/04; RF12/26; RNF3/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Crear curso sección y teacher inicial atómicos; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,persistencia,integridad.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{CNEW}`; `createCourse; updateCourse`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir Crear curso.
2. Completar code E2E-NEW name Curso E2E term 2026-2 sección 1 capacidad 0.
3. Crear; abrir tarjeta y sección.

- Interfaz esperada: Curso confirmado con metadatos y sección 1; actor teacher inicial.
- API esperada: POST 201 Location; GET cursos/detail/sections/enrollments coherentes.
- Persistencia / consistencia: Una course, una sección, teacher actor y 3 audit eventos asociados; ownership servidor.
- Denegación: No aceptar createdBy cliente.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; smoke (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-course-007"></a>

## E2E-COURSE-007 — Crear duplicado por code y periodo

- Módulo / flujo: COURSE; [FL-COURSE-02](../audit/FLOWS.md#fl-course-02).
- Requisito: CU-03/04; RF12/26; RNF3/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Crear duplicado por code y periodo; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: negativo,integridad.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{CNEW}`; `createCourse; updateCourse`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Crear E2E-DUP term 2026-2.
2. Reenviar misma combinación con otro nombre.
3. Crear mismo code con term 2027-1.

- Interfaz esperada: Duplicado rechazado, nueva combinación permitida.
- API esperada: 409 duplicado institution/code/term; 201 otro term.
- Persistencia / consistencia: Sin sección/enrollment/eventos huérfanos del rechazo.
- Denegación: No éxito optimista.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-course-008"></a>

## E2E-COURSE-008 — Editar metadatos con PATCH mínimo

- Módulo / flujo: COURSE; [FL-COURSE-02](../audit/FLOWS.md#fl-course-02).
- Requisito: CU-03/04; RF12/26; RNF3/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Editar metadatos con PATCH mínimo; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,persistencia.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{CNEW}`; `createCourse; updateCourse`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir Configurar curso C1.
2. Cambiar solo name a Curso editado.
3. Guardar; abrir otra vista y volver.

- Interfaz esperada: Nombre nuevo; code/term intactos.
- API esperada: PATCH 200 solo campo modificado; GET refleja nuevo nombre.
- Persistencia / consistencia: Un evento course.updated con before/after; no cambia createdBy.
- Denegación: No payload owner/tenant.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-course-009"></a>

## E2E-COURSE-009 — No-op no duplica auditoría

- Módulo / flujo: COURSE; [FL-COURSE-02](../audit/FLOWS.md#fl-course-02).
- Requisito: CU-03/04; RF12/26; RNF3/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: No-op no duplica auditoría; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: idempotencia.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{CNEW}`; `createCourse; updateCourse`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Leer metadatos C1 y eventos.
2. Guardar sin cambios o PATCH idéntico.
3. Consultar detalle/historial.

- Interfaz esperada: Sin falso cambio ni borrado de campos.
- API esperada: 200 no-op autorizado.
- Persistencia / consistencia: Mismo contenido y ningún evento adicional.
- Denegación: N/A actor autorizado.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-course-010"></a>

## E2E-COURSE-010 — Límites metadatos y body estricto

- Módulo / flujo: COURSE; [FL-COURSE-02](../audit/FLOWS.md#fl-course-02).
- Requisito: CU-03/04; RF12/26; RNF3/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Límites metadatos y body estricto; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: borde,validación.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{CNEW}`; `createCourse; updateCourse`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Intentar code 32/33, name 200/201 y term 16/17 caracteres.
2. Enviar espacios solos, objeto vacío y owner extra.
3. Corregir formulario.

- Interfaz esperada: Errores locales; acepta límites válidos; no cambia lo previo al fallar.
- API esperada: 400 por máximo/tipo/campo extra y vacío; 413 si JSON >4096.
- Persistencia / consistencia: No filas ni eventos por rechazos.
- Denegación: No cambios parciales.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
