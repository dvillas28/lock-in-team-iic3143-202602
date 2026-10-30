# Calidad, métricas y mantenimiento

Las métricas distinguen inventario planificado, test implementado y ejecución estable por variante.
Baseline de este trabajo: cobertura documental definida; tests nuevos implementados0/ejecutados0.
No sumar tests existentes c8/jsdom/integración al numerador E2E navegador.

| Indicador | Cálculo verificable | Meta inicial / entrega |
| --- | --- | --- |
| Trazabilidad requisitos |RFimplementados con ficha o exclusión justificada / RFimplementados |100% documental; luego100% P0/P1 relevantes ejecutados |
| Flujos E2E |Familias con recorrido comportamiento+persistencia aprobado / familias con UI integrada |100% críticos;>=90% restantes al declarar madurezMVP |
| Operaciones API |Métodos/paths con permiso+denegación+tenant ejecutados / operaciones pertinentes |100% institucionalesP0; públicos positivos/negativos pertinentes |
| Permisos |Celdas válidas A/C/D ejecutadas con actor+scope / celdas factibles de ledger |100% fronterasP0; no basta un caso por rol |
| Aislamiento |Dirección×recurso×read/write×path/body/cursor cubierto / factibles |100% críticosUC↔UTFSM, cero filtraciones |
| Transiciones |Aristas críticas aprobadas / críticas válidas y prohibidas |100% intentos/Grade/freeze/publicación/rol/sesión |
| Éxito primerintento |Instancias passed sin retry / instancias ejecutadas |100%P0 y>=98% total en20runs elegibles |
| Duración |p50/p95 job/test/setup/login por proyecto |Objetivo trasoptimizar: smoke<=12min,regression<=30min |
| Flakiness |Instancias failed→passed en retry / ejecutadas; revisar porID/causa |0P0;<=1%global ventana20runs; no ocultar con retries |
| Omitidos/bloqueados |IDs skip/todo/quarantine/bloqueo por severidad/edad |0P0 omitido; P1block requiere plan y evidencia alternativa |
| Defectos detectados |Issuesproducto reales vinculadosID/SHA y causa, separandoinfra |Registrar count/severidad/tiempoderesolución, sin meta artificial de muchos bugs |
| Recurrentes |Bug reabierto/misma causa tras cierre / bugs cerrados |Tendencia decreciente; todo recurrente requiere regresión pertinente |
| Datos/cleanup |Recursos huérfanos porrun y fallospreparación / runs |0 recursos sinownership; TTL y cleanup diagnosticado |
| Pares no críticos |Pares factibles aprobados / ledger de pares |>=95%pares priorizados; resto exclusión revisada |

Una corrida elegible tiene setupválido, stack aislado, SHA conocido, navegador/seed fijos y todas
las variantes requeridas seleccionadas. Infra fallida no esPASS ni entra como producto flaky;
informar aparte tiempo/perdida de señal y permitir rerun explícito. Retry success sigue flaky.
Los conteos se publican por ficha y por instancia variante; no inflar cobertura sumando navegadores.
Denominadores son los del commit actual, no una lista congelada si se añaden endpoints o permisos.

## Madurez suficiente para la entrega

1. Smoke final22fichas y variantes críticas implementadas, veinte runs elegibles con100%P0 primerintento.
2. CU-01–16 implementados con recorrido real; RFimplementadosP0/P1 y fronteras/estados críticos al100%.
3. Cero defectosP0 abiertos conocidos; P1 centrales sin bloqueo; resto con decisión explícita/owner/plazo.
4. Evidencia end-to-end material→quiz→graded→publicación→promedio enUC yUTFSM, por rol correcto.
5. Chromiumregression y smokecrítico Firefox/WebKit/375px; a11y funcional por teclado/diálogos/tabla.
6. CI requerido verificado, artifacts útiles sin credenciales, teardownowned, tiempos medidos y runbook.
7. ExclusionesQ02/RNF5/binarios y deuda<1ms visibles; nada pendiente presentado comoPASS.

Si el calendario no permite todo catálogoextended, entregar sliceP0/P1 estable con denominador
y huecos explícitos. No rebautizarlo suite completa ni bajar prioridades para aparentar cobertura.
E2E no garantiza ausencia de errores, seguridadcompleta ni conformidadWCAG. Mantener revisión
estática, tests unitarios, contratos, integraciónSQL, accesibilidad especializada y operaciónbackup.

## Actualización con cambios del producto

En cada PR que modifique requisito/endpoint/permiso/estado:

1. Comparar inventario rutas/API/DTO con base y asignar IDs nuevos solo si comportamiento nuevo.
2. Revisar requisito y ADR; registrar discrepancia antes de cambiar expected de un test que denuncia fuga.
3. Actualizar FLOWS, matrizREQUERIMIENTOS/ROLES/TENANCY/STATES/ERRORS y perfiles de datos afectados.
4. MantenerID para misma regla; si se divide, conservar predecesor con enlaces; nunca reciclarID retirado.
5. Añadir variante para nueva celda de permisos/tenant y su negativo con JWT/cursor/key previo si aplica.
6. Implementar en misma rama funcional o PRtest vinculado antes de cerrar seguridad/integridad del cambio.
7. Ejecutar subsetimpactado+smoke; integrar a regression/nightly y actualizar ledger de combinaciones.
8. Registrar SHA,seedversion,browser y resultado; recalcular denominadores/conteos desde fichas y reportes.

Semanalmente, responsableQA rotativo y dueño del módulo revisan flaky/skips/tiempos/defectos recurrentes.
Mensualmente o antes de entrega, PM valida exclusiones y metas; cambios de madurez quedan en docs/testing.
Cambios en auth,tenant,owner/roles,publicación o migraciones disparan revisión de seguridad transversal.
PRtemplate futuro debe pedir IDs/celdas afectadas y evidencia, sin modificar template en esta rama.

## Gestión de flakiness y defectos

Primer fallo: conservar metadata segura; reproducir con mismo SHA y namespace nuevo; clasificarcausa.
Producto: issue conID/variant/expected/actual y fix separado, sin ajustar test para esconder defecto.
Fixture/selector/tiempo: reparar causa mínima, demostrar que sigue probando comportamiento, no añadir sleeps.
Quarantine excepcional<=7d con owner/issue/alternativa;P0 no puede excluirse del gate por inestabilidad.
Fallo500/timeout en write se analiza con estado persistido; no asumir rollback porque browser no recibió200.
Nunca aceptar dump de Authorization/passwords como costo inevitable de diagnóstico.

## Verificación documental futura

Comprobar IDs únicos, enlaces locales, ficha completa, todos los50operationIds trazados y18rutas;
verificar conteos por módulo/prioridad/nivel y que ninguna ficha quede sin fase.
Usar check-doc-length delrepo para cadaMarkdown (<150líneas), gitdiffcheck y revisión de permisos.
El script generador usado para redactar esta documentación no es un runner ni test versionado;
las fichasMarkdown son fuente revisable. Un validador de catálogo puede proponerse en F1 sin código de producto.
