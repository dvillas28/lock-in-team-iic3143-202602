# Matrices de cobertura planificada

Base: 18 páginas Next, 50 operaciones API y 34 familias de flujos, incluido catálogo estático fuera de App Router.
La matriz acredita trazabilidad documental; hoy ningún caso nuevo tiene PASS de ejecución.

| Matriz | Pregunta que resuelve |
| --- | --- |
| [Requisitos](matrices/REQUIREMENTS.md) | CU/RF/RNF → funcionalidad → flujo → caso → prioridad/estado |
| [Roles y permisos](matrices/ROLES.md) | Recurso/acción → flags, ownership y rol sección |
| [Aislamiento](matrices/TENANCY.md) | UC↔UTFSM, curso/sección, IDs/cuerpos/cursors/cachés |
| [Estados](matrices/STATES.md) | Estados/transiciones válidos y prohibidos, operaciones y pruebas |
| [Errores](matrices/ERRORS.md) | Códigos contractuales/reales y fallos sin respuesta HTTP |
| [Combinaciones](matrices/COMBINATIONS.md) | Exhaustivo en fronteras críticas y pares para resto |
| [API completa](audit/API.md) | Cobertura base de cada operación, sin endpoint sin clasificación |
| [Rutas completas](audit/ROUTES.md) | Página, comportamiento conectado/redirect y caso referente |

## Unidad de cobertura

Requisito implementado: al menos una aserción positiva pertinente y sus fronteras negativas.
Operación: método+path, no solo nombre de pantalla. Estado: transición dirigida con pre/postcondición.
Permiso: actor+tenant+curso+sección+acción+estado; permitir y denegar no se sustituyen entre sí.
Las matrices pueden compartir un caso que verifica varias reglas, sin duplicar conteos.
Las variantes parametrizadas por operación/rol/tenant deben aparecer individualmente en reportes.
No reducir `TENANT-008/009` a un único UUID porque haya una sola ficha en el catálogo.

## Estados de seguimiento

- Planificado: ficha definida y evidencia enlazada; estado inicial de este plan.
- Implementado: test versionado en rama posterior, fixtures y selector revisados.
- Ejecutado estable: evidencia real en entorno identificado, sin reintento que esconda defecto.
- Bloqueado: falta regla o infraestructura; registrar responsable, plazo e impacto; no computa cubierto.
- Excluido justificado: fuera MVP o nivel alternativo apropiado; revisar cuando cambie alcance.
- Retirado: conservar ID y razón; nunca reutilizar para otro comportamiento.

El requisito solo se considera cubierto al ejecutar aserciones pertinentes, no al tener ID o un archivo.
Coverage de código de c8/Sonar no reemplaza cobertura de permisos/flujos/estados ni viceversa.
