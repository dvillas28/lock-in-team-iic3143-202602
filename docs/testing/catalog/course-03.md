# Fichas COURSE · 03

[Índice COURSE](COURSE.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-course-011"></a>

## E2E-COURSE-011 — Creación incierta no se repite automáticamente

- Módulo / flujo: COURSE; [FL-COURSE-02](../audit/FLOWS.md#fl-course-02).
- Requisito: CU-03/04; RF12/26; RNF3/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Creación incierta no se repite automáticamente; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: red,idempotencia.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE+LOST-RESPONSE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{CNEW}`; `createCourse; updateCourse`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Enviar curso válido y perder solo respuesta después de commit.
2. Observar aviso y pulsar consulta disponible.
3. Navegar al listado explícitamente.

- Interfaz esperada: No segundo POST ni afirmación de fracaso definitivo; curso descubierto una vez.
- API esperada: POST aplicado una vez; GET confirma curso; no clave idempotente inventada.
- Persistencia / consistencia: Un curso y tres eventos, sin duplicado por reintento implícito.
- Denegación: Bloqueo mientras resultado no confirmado.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-course-012"></a>

## E2E-COURSE-012 — Dos creaciones simultáneas con misma clave natural

- Módulo / flujo: COURSE; [FL-COURSE-02](../audit/FLOWS.md#fl-course-02).
- Requisito: CU-03/04; RF12/26; RNF3/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Dos creaciones simultáneas con misma clave natural; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: concurrencia,integridad.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{CNEW}`; `createCourse; updateCourse`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Dos contextos AO envían mismo code/term con barrera.
2. Esperar ambas respuestas.
3. Consultar listado y SQL.

- Interfaz esperada: Uno confirma, otro informa conflicto.
- API esperada: Un 201 y un 409; sin errores 500 aceptados.
- Persistencia / consistencia: Un curso y una sección inicial; sin huérfanos.
- Denegación: Sin overwrite del ganador.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador + comprobación API/SQL; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-course-013"></a>

## E2E-COURSE-013 — Metadatos con NUL

- Módulo / flujo: COURSE; [FL-COURSE-02](../audit/FLOWS.md#fl-course-02).
- Requisito: CU-03/04; RF12/26; RNF3/4; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [courses.service.ts](../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../frontend/src/components/courses/course-form.tsx).
- Objetivo: Metadatos con NUL; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: seguridad,borde.
- Rol / institución: AO; UC por defecto, UTFSM en escenarios cruzados según pasos.
- Precondiciones / fixtures: WRITE; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `/courses; /courses/{CNEW}`; `createCourse; updateCourse`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. POST curso con nombre que contiene U+0000.
2. Consultar listado/SQL.
3. Registrar respuesta sin datos sensibles.

- Interfaz esperada: N/A navegador; verificación de estado API/SQL: No éxito ni texto truncado; código queda por aclarar Q02.
- API esperada: Bloqueado: definir 400/422 normativo; no fijar error 500 como esperado.
- Persistencia / consistencia: Sin fila parcial ni eventos.
- Denegación: Entrada inválida no llega a estado persistido.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F4](../roadmap/F4.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento HTTP de integración; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto / aclaración Q02; sin implementar.
