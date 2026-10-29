# Validación local del feedback E2

Fecha: 2026-10-29. Versión de partida: `7f4334a03cc9b2245a169fd56b9a1c99942030f0`.
Versión funcional validada: `395e26746fb05e238403fb2575add74ddc273549`, rama `fix/polish-feedback-e2`.
No se ejecuta despliegue ni se acredita disponibilidad remota.

## Fuente y conservación

Se leyó la planilla original de Downloads mediante ZIP/XML estándar: E2 es
sheet4 y sus comentarios son comments4.xml. Equipo Lock In, fila 6; C6/D6/E6
contienen cinco frentes y F6/G6 dos valoraciones positivas. SHA-256 comprobado:
`af4dbab066c7b03c6b6d353fd7eaca7d65c1f4373c9fb22819d1f3993f128404`.
La propuesta informal de superadmin global en E6 se responde con la decisión
institucional vigente; no se incorpora ese rol. AUD-PRIV es hallazgo propio.
El corte de [la matriz](../deliveries/2/15-feedback-e2.md) permanece intacto.
Git confirmó cero diferencias previas en backend/src, migraciones y render.yaml.
Borrados de entrega 0 y cambios locales ajenos se conservaron, sin incorporarlos.
Respaldo previo de estado/diff/feature en `/tmp/academix-e2-baseline` (no entregable).

## Revisión de línea base y acciones

| ID/celda | Existente al corte | Acción posterior / responsable de referencia |
| --- | --- | --- |
| E2-ARCH/C6 | Render app/API/DB en configuración; relato Railway/HA desactualizado | POL-05 documentación; DOC-16/19 |
| E2-DOM/D6 | UML con multiplicidades; TeX y catálogo desalineados | POL-02 documentación/validación; DOC-16 |
| E2-ROLE/E6 | varchar+CHECK y validación de aplicación | POL-03 documentación/validación; backend, BE-31 |
| E2-ADMIN/E6 | Flags independientes, creación con ownership, delegación institucional | POL-04 documentación/validación; PREP-05/BE-02 |
| E2-ACCOUNTS/E6 | Bootstrap/onboarding inicial y seed académico separado | POL-04 documentación/validación; cursos-roles |
| E2-RISKS/F6 | Matriz valorada positivamente | POL-07 conservar; responsables vigentes |
| E2-PLAN/G6 | Backlog y semanas valorados positivamente | POL-07 conservar; responsables vigentes |

POL-01 documenta trazabilidad (equipo, DOC-17/19). POL-06 corrige AUD-PRIV
(funcional/validación, BE-30/31 y DOC-15). No hay nueva implementación de roles,
creación, delegación, RLS ni provisión atribuida al feedback. La presencia de
pruebas históricas no se usa como resultado de ejecución nueva.

## Límites y decisiones diferidas

Sin alta general/invitaciones en institución existente, superadmin global,
nuevo enum SQL, migraciones, dependencias ni infraestructura HA. Necesitan
otra misión si se requieren; onboarding inicial no las sustituye.
Resultados posteriores se detallan debajo; no sustituyen evidencia del corte.

## Validación nueva de capacidades preexistentes

PostgreSQL 17-alpine en contenedor exclusivo `academix-e2-polish-test`, base
`academix_polish_test`; operador separado de academix_runtime sin bypass.
Node 24.14.0, pnpm 9.15.9. Backend lint/build PASS.
Comando: backend `node --test --test-concurrency=1` sobre courses-write,
membership-admin, onboarding, enrollments y demo-migration (`test/integration/*.test.mjs`).
Resultado: **6/6 PASS**, 0 omitidos, 24.56 s. Incluye cruces/privilegio insuficiente,
replay concurrente, hashes/identidades, revocaciones y rollback.
Nuevo caso en enrollments: role=superadmin rechazado por HTTP 400 y SQL 23514,
sin cambios en matrículas. Lo demás reutiliza pruebas existentes.
Catálogo revisado: 14 tablas académicas, 122 columnas, 25 FK reales; incluye
ledger ya existente, flags y opcionalidad operativa. No cambia DDL.

Revisión adicional contra pg_constraint: 11 asociaciones transitivas con
institutions no eran FK directas. Se retiraron del ER físico/XLSX/tabla FK;
la relación conceptual tenant-owned se conserva con su regla transitiva.

## Exportaciones y comprobación documental

TeX Live 2026/pdfTeX 1.40.29, latexmk 4.88; comandos desde raíz:
`latexmk -pdf -interaction=nonstopmode -halt-on-error -cd` sobre
`docs/deliveries/2/{report,ppt}/main.tex`, con `-outdir=/tmp/academix-e2-{report,ppt}`.
Se copiaron solo PDF finales: informe 3 páginas y presentación 19.
Mermaid CLI 12.0.0, Chrome 150: comandos del README del catálogo, con
`-p /tmp/academix-e2-puppeteer.json` (Chrome local); PDF `--size 4949`.
Una opción de CLI inicialmente incorrecta falló; se usó la opción documentada.
Sin dependencias añadidas al proyecto ni auxiliares TeX versionados.

Revisión visual: páginas completas de informe/presentación, detalle del modelo,
actores y arquitectura; ER PDF y SVG renderizado en Chrome. Sin cortes de nodos,
cardinalidades o texto. ER es una lámina vectorial grande, requiere
zoom/impresión grande; no se presenta como legible a tamaño carta.
Figura conceptual compartida `domain-overview.tex` mantiene informe/PPT iguales;
UML/tabla completa explica opcionalidad y asociaciones omitidas en el resumen.

Autocomprobación ZIP/XML: XLSX y tablas Markdown idénticos fila por fila,
14/122/25; rangos de filtros/tablas y estilo wrap preservados. Mermaid tiene
14 entidades/25 relaciones con ambos extremos y opcionales contrastados.
Requisitos divididos en 22 partes <150 líneas, sin pérdida de CU/RF/RNF,
con índice y anclas históricas conservadas. Links locales revisados al cierre: 299, 0 rotos.
Longitud y git diff --check PASS (repetidos al cierre).

## Contrato y consumidor

OpenAPI lint PASS, tres avisos existentes: localhost y probes sin respuesta 4xx.
Frontend: instalación frozen-lockfile recuperó dependencias declaradas ausentes;
api:generate/api:check, typecheck y lint PASS. Cliente generado cambia únicamente
comentario descriptivo de auditoría, sin modificación estructural de DTO.
Consumidor focalizado audit-api/audit-ui/gradebook-capabilities: **8/8 PASS**,
0 omitidos. Incluye vacío, escape, filtros/cursor, respuestas tardías y limpieza
tras denegar continuación. Sin cambio de UI, dependencias o configuración.

## Cobertura de requisitos documentales

| FR / SC | Evidencia posterior |
| --- | --- |
| FR-011/019, SC-006 | Fuente/hash y corte contrastados; matriz inicial intacta; versión/fecha de pruebas separados |
| FR-012/020, SC-006/010 | Siete IDs, POL-01–07, F6/G6 y responsables conservados; hallazgo propio separado |
| FR-013, SC-007 | Tabla relación/mínimo/máximo/regla, 25 FK contra DDL; XLSX/MD/MMD/TeX y exportaciones revisadas |
| FR-014, SC-008 | CHECK enumerado declarado y nuevo rechazo HTTP/SQL sin cambios de datos |
| FR-015, SC-008 | Matriz de seis actores; creación/delegación y negativos UC/UTFSM en 6/6 pruebas |
| FR-016, SC-009 | Guía de dataset/provisión; replay conserva identidad/hash/estados/revocaciones, alta general explícitamente excluida |
| FR-017, SC-010 | Arquitectura Render contrastada con Blueprint; HA/proveedor binarios diferidos, sin validación remota |
| FR-018, SC-007/010 | Fuentes y exportaciones actualizadas, catálogo coherente y checks de longitud/enlaces |

FR-001–010/SC-001–005: [evidencia de privacidad](audit-grade-privacy-validation.md).

Contraste final con information_schema: tres columnas binarias propuestas no
existían en DDL y markdown_body es NOT NULL. Se retiraron del modelo físico,
conservando la extensión binaria como diferida: catálogo final 122 columnas.
No se agregó una migración para satisfacer el dibujo anterior.

## Cierre de pruebas y revisión

Backend coverage: **174/174 PASS**, 0 omitidos; 99,54 % líneas, 95,66 % ramas,
99,27 % funciones. AuditService 100 % líneas, 97,46 % ramas. Contratos **4/4 PASS**
tras terminar coverage (builds y PostgreSQL en serie); consumidor **8/8 PASS**.
Validación final PostgreSQL/XLSX: 122 columnas con tipos y nulabilidad idénticos,
25 FK reales; tablas Markdown idénticas y MMD coherente. Preservados exactamente
68 diffs ajenos y bloque histórico de matriz byte a byte.
Revisión lms-reviewer: filtro SQL/scope/cursor/sanitización/historia correctos;
los hallazgos documentales de FK transitivas y binarios especulativos se corrigieron.
Sin hallazgos funcionales pendientes dentro de alcance.

Reanálisis SC-008 encontró cobertura positiva UTFSM insuficiente: se ampliaron
membership-admin/enrollments sin cambiar producto. Pruebas focalizadas **2/2 PASS**
(7,06 s), repetidas con c8 --clean=false sobre datos V8 de la suite completa.
Cobertura acumulada: 99,54 % líneas y 95,67 % ramas; no sustituye el resultado
174/174 de la suite original. Commit de extensión de pruebas: `3d18f45afc786283d3a5a890c40f1a0e598de080`.
Casos: superadmin UTFSM sin is_admin no crea; delega al miembro, este crea con
ownership; revocar retira edición; IDs UC no se delegan en UTFSM; role inválido
HTTP/SQL rechazado sin cambios en ambas instituciones.
Revisión lms-reviewer y speckit-analyze final (solo lectura): sin hallazgos
pendientes, 20 FR + 10 SC cubiertos, 28 tareas; sin conflictos constitucionales.
Hooks git opcionales omitidos; commits locales selectivos, sin push/PR/despliegue.
