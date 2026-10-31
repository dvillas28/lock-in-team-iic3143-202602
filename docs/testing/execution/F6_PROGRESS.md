# F6 — Registro incremental

Rama `test/e2e-f6`, acumulativa desde `83d9fd7` (F5 aceptada).
Autorizado continuar con la siguiente fase; conservar avance si se agotan los créditos.
Solo se ejecutarán pruebas nuevas y correcciones dirigidas; F1–F5 conservan su evidencia histórica.

## Alcance y estado

F6 aceptada por evidencia incremental:NETWORK-001–013 y A11Y-001–008.
[Resultado final y límites](F6_VALIDATION.md) · [Pares ejecutados](F6_COMBINATIONS.md).

- Red:401 real, denegaciones locales,503 de contexto, DTO malformado, timeout15s,
  offline,401 antiguo, errores de escritura,4096 bytes, respuesta perdida y CORS real.
- Accesibilidad: teclado, foco y diálogos;375px, dos temas, reflow equivalente200%,
  reduced-motion, recorrido crítico UC/UTFSM en tres motores y avisos/recibos persistentes.
- NETWORK-010/012 son complementos HTTP; los demás casos usan navegador real.
- Las respuestas inyectadas se marcan como fallos simulados de UX; no prueban un defecto real del backend.
- No se ofrece certificación WCAG completa ni contraste total a partir de estas pruebas funcionales.

## Ejecutar

```bash
pnpm test:e2e:f6
pnpm test:e2e:f6 --project=chromium --project=firefox --project=webkit
pnpm test:e2e:f6 --headed --grep E2E-A11Y-004
pnpm test:e2e:f6 --grep E2E-NETWORK-003
pnpm --dir e2e report
```

Los comandos seleccionan solo network.spec.ts y accessibility.spec.ts.
No producción, push, despliegue ni merge. F7 no iniciada.

## Cierre incremental

- 77e3b56:implementación inicial; c5e6893301dac070:27 PASS/5 FAIL del harness.
- efb5e26:selectores/foco/offline;9857b799abf6aba6:solo cinco corregidas,5 PASS.
- c687c8b:barreras y timing;3d3df7e4ea93af21:3 PASS/1 FAIL de preparación de barrera.
- 96f704c:aislar escritores y375px/temas;8a7a6c9ab9edbfa1:1 PASS;cfc1c51117db3bf8:4 PASS.
- a1384ea:cruces obligatorios;600966c85750d479:27 PASS;a8da79e3e69bd6aa:1 PASS.

21 fichas/68 variantes-motores aceptadas,41 Chromium/13 Firefox/14 WebKit.
74 ejecuciones totales,68 PASS distintos y seis fallos diagnósticos corregidos, todos conservados.
Cada run inició y terminó limpio; no se repitieron aprobadas ni F1–F5. No hay un único run68 PASS.
Siete stacks propios eliminados, puertos locales cerrados. F7 no iniciada; detenerse para revisión.

## Revisión final de artefactos

NETWORK-008 pausa la traza durante su segundo login SPA y la reinicia tras autenticar,
para excluir credenciales también en ese recorrido. Se repetirá solo ese caso en Chromium/WebKit.
El cierre de evidencia se actualizará después; el código funcional del flujo no cambia.
