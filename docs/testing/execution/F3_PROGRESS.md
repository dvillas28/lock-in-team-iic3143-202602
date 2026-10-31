# F3 — Registro incremental de implementación

F3 **en implementación, sin aceptación**. Rama `test/e2e-f3`, basada en F2 validada.
Este registro no reemplaza los criterios de aceptación de roadmap/F3.md.

## Incremento de identidad

Se escribieron AUTH-003/007/008/009/011/016/017/018/019/020/021.
Cubren identidad inactiva, cuota real, ausencia de membership, headers públicos, logout,
expiración cliente, JWT inválidos, headers ambiguos, pestañas, foco/borrador y directorio fallido.
Las pruebas emplean login/API/DB reales; solo AUTH-021 inyecta fallos específicos del directorio.
El reloj cliente se instala antes de construir Session, para controlar también su Date.now capturado.
El cliente HTTP conserva Authorization duplicado e incluye Host válido, evitando un400 del parser
antes de que el guard reciba la solicitud. No se relajó la aserción401.

Run diagnóstico a02f540a225ed672:11 PASS/6 FAIL, problemas de fixture/expectativa local.
Tras corregirlos, eec5df6864bca3a2:17 PASS/0 FAIL (checkout con cambios locales).
AUTH-007/009/020 se añadieron después de ese run; no atribuirles esos17 resultados.

Run `8108476f612f48ed`, commit `c4ffa102cd25c2e37c6c5ec2ff664acf71ee690a`: **20 PASS**, exit0,
dirtyAtStart=false y dirty=false. AUTH-007/009/020 pasan también en34e712e53c5288b0.
AUTH-020 se reforzó para esperar GET me200 y exigir exactamente una revalidación: run08f752880ad15431,
1 PASS (cambio local posterior al commit del run de20). Typecheck/lint y11 unitarios PASS.
Esto valida un incremento de11 fichas AUTH, no las54 fichas asignadas a F3 ni la regresión acumulada.

## Ejecución y demostración

Consultar E2E_EXECUTION_JOURNAL.md: guía incremental, comandos por fase, navegador visible,
inspector y evidencia para evaluación. Sus instrucciones se consolidarán en E2E_README al cierre F7.
`pnpm test:e2e:f3` ejecuta únicamente los escenarios escritos; no acredita F3 completa.

## Pendiente para aceptar F3

- Validar y repetir el incremento desde commit limpio y ejecutar la regresión F1/F2.
- TENANT-001…015: matriz de recursos/operaciones, ambas direcciones, cursor y pool RLS.
- RBAC-001…013: matrices por operación, multirol y revocación con sesión/cursor vigentes.
- ADMIN-001…011: delegación HTTP y operaciones de onboarding/recuperación/reemplazo/concurrencia.
- AUDIT-003/004/005/008: privacidad histórica y snapshots sin credenciales/pautas.
- Revisión lms-reviewer; cero fronteras críticas fallidas; reporte y limpieza verificados.

No se inició F4. Sin push/merge ni conexiones a producción.
