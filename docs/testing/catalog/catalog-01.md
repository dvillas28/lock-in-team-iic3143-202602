# Fichas CATALOG · 01

[Índice CATALOG](CATALOG.md) · [Convenciones](../E2E_TEST_CATALOG.md) · [Datos](../E2E_TEST_DATA.md)

Las variables se resuelven desde el manifest del test, nunca IDs o credenciales de producción.

<a id="e2e-catalog-001"></a>

## E2E-CATALOG-001 — Consultar filtrar y abrir ficha profunda sin backend

- Módulo / flujo: CATALOG; [FL-CATALOG-01](../audit/FLOWS.md#fl-catalog-01).
- Requisito: CU-01–16 transversal; RNF9; catálogo-endpoints FR-001–013; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [api-catalog.mjs](../../../scripts/api-catalog.mjs); [api-catalog-render.mjs](../../../scripts/api-catalog-render.mjs); [api-catalog-init.js](../../../scripts/api-catalog-init.js); [api-catalog.md](../../../docs/reference/api-catalog.md).
- Objetivo: Consultar filtrar y abrir ficha profunda sin backend; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: happy,navegación.
- Rol / institución: ANON; N/A institución, catálogo público estático.
- Precondiciones / fixtures: STATIC-CATALOG; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `http://localhost:8080/ → releases/{revision}/index.html; openapi.json`; `assets/JSON estáticos; sin requests académicos`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Preparar release estática con comandos docs:api:build y docs:api en loopback, API detenida.
2. Abrir catálogo y filtrar cursos/login, expandir operación.
3. Copiar enlace profundo de ficha y abrir nueva pestaña.

- Interfaz esperada: Swagger UI estándar, métodos/paths/parámetros/permisos/errores visibles; misma ficha por ancla; sin Try it out.
- API esperada: Solo HTML/CSS/JS/JSON locales; ningún request /api/v1 ni validador remoto.
- Persistencia / consistencia: N/A lectura sin DB; versión de entrada y ficha coherentes.
- Denegación: No necesita sesión ni debe solicitar credenciales reales.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-catalog-002"></a>

## E2E-CATALOG-002 — Descarga revisión y disponibilidad coherentes

- Módulo / flujo: CATALOG; [FL-CATALOG-01](../audit/FLOWS.md#fl-catalog-01).
- Requisito: CU-01–16 transversal; RNF9; catálogo-endpoints FR-001–013; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [api-catalog.mjs](../../../scripts/api-catalog.mjs); [api-catalog-render.mjs](../../../scripts/api-catalog-render.mjs); [api-catalog-init.js](../../../scripts/api-catalog-init.js); [api-catalog.md](../../../docs/reference/api-catalog.md).
- Objetivo: Descarga revisión y disponibilidad coherentes; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: contrato,seguridad.
- Rol / institución: ANON; N/A institución, catálogo público estático.
- Precondiciones / fixtures: STATIC-CATALOG; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `http://localhost:8080/ → releases/{revision}/index.html; openapi.json`; `assets/JSON estáticos; sin requests académicos`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Abrir release de catálogo y Descargar descripción OpenAPI3.1.
2. Parsear descarga y comparar revisión x-source-revision con portada.
3. Verificar50operationIds/disponibilidad de esa build y ejemplos sintéticos.

- Interfaz esperada: Enlace descarga usable sin JavaScript; permisos distinguen admin/teacher/assistant/student.
- API esperada: JSON dereferenciado parseable; assets locales; sin JWT válido/password real ni datos institucionales.
- Persistencia / consistencia: Artefacto corresponde al mismo SHA/contrato; sin consultaDB.
- Denegación: Disponibilidad se deriva de controllers, no de pantalla; no exigir pendientes si todas50implementadas.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; regression (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-catalog-003"></a>

## E2E-CATALOG-003 — Errores de JSON o JavaScript y reflow accesible

- Módulo / flujo: CATALOG; [FL-CATALOG-01](../audit/FLOWS.md#fl-catalog-01).
- Requisito: CU-01–16 transversal; RNF9; catálogo-endpoints FR-001–013; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [api-catalog.mjs](../../../scripts/api-catalog.mjs); [api-catalog-render.mjs](../../../scripts/api-catalog-render.mjs); [api-catalog-init.js](../../../scripts/api-catalog-init.js); [api-catalog.md](../../../docs/reference/api-catalog.md).
- Objetivo: Errores de JSON o JavaScript y reflow accesible; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P2 / Media; categorías: red,a11y,compatibilidad.
- Rol / institución: ANON; N/A institución, catálogo público estático.
- Precondiciones / fixtures: STATIC-CATALOG+FAULT; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `http://localhost:8080/ → releases/{revision}/index.html; openapi.json`; `assets/JSON estáticos; sin requests académicos`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. Fallar carga openapi.json con500 o JSONinválido y comprobar alerta, cada variante aislada.
2. Fallar bundleSwagger en otra variante y recuperar.
3. Teclado y zoom200%/375px sobre release válida.

- Interfaz esperada: Error explícito sin catálogo parcial como válido; foco visible y contenido alcanzable; descarga alternativa.
- API esperada: Fallos inyectados solo estáticos; no requests académicos ni credenciales.
- Persistencia / consistencia: Sin cambios a release o datos académicos.
- Denegación: No enviar esquema a validador remoto.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: E2E navegador real; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.

<a id="e2e-catalog-004"></a>

## E2E-CATALOG-004 — Build inválido conserva publicación estática anterior

- Módulo / flujo: CATALOG; [FL-CATALOG-01](../audit/FLOWS.md#fl-catalog-01).
- Requisito: CU-01–16 transversal; RNF9; catálogo-endpoints FR-001–013; [fuente normativa](../../deliveries/2/03-use-cases-and-requirements.md).
- Evidencia: [api-catalog.mjs](../../../scripts/api-catalog.mjs); [api-catalog-render.mjs](../../../scripts/api-catalog-render.mjs); [api-catalog-init.js](../../../scripts/api-catalog-init.js); [api-catalog.md](../../../docs/reference/api-catalog.md).
- Objetivo: Build inválido conserva publicación estática anterior; verificar las aserciones siguientes, sin inferir éxito solo por carga.
- Prioridad / criticidad: P1 / Alta; categorías: integridad,contrato.
- Rol / institución: OPERATOR; N/A institución, catálogo público estático.
- Precondiciones / fixtures: STATIC-CATALOG; [diccionario](../E2E_TEST_DATA.md); manifest validado y namespace exclusivo.
- Entrada / operación: `http://localhost:8080/ → releases/{revision}/index.html; openapi.json`; `assets/JSON estáticos; sin requests académicos`; [inventario](../audit/API.md).
- Preparación: resolver variables del manifest; actor de UI hace login real en origen institucional (ANON no); navegar por Link tras login, salvo reload explícito.

1. En directorio temporal propio generar release válida desde contrato vigente con buildCatalog output explícito.
2. Copiar contrato a temporal y romper referencia, ejecutar buildCatalog con source/output temporales.
3. Comparar entrada anterior y releases tras fallo.

- Interfaz esperada: N/A integración de publicación estática; entrada pública sigue apuntando release válida.
- API esperada: Comando rechaza contrato/ref inválida; no backend/DB requerido ni deploy remoto.
- Persistencia / consistencia: Index de entrada anterior idéntico; staging propio limpiado; no editar contrato del repositorio.
- Denegación: No publicar parcialmente ni modificar dist/contrato de otro proceso.
- Limpieza: cerrar contextos y cancelar interceptores; datos históricos quedan en namespace del test; destruir solo stack/DB propiedad runId al finalizar suite.
- Dependencias: F1 entorno/seed listo; [fase F2](../roadmap/F2.md); fixture independiente, sin depender de ejecutar otro caso.
- Nivel / suite: Complemento operativo/SQL; sin navegador; extended (regression incluye smoke; extended incluye regression).
- Estado del test: Propuesto; sin implementar ni ejecutar.
