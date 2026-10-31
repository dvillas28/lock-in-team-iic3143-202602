# F6 — Registro incremental

Rama `test/e2e-f6`, acumulativa desde `83d9fd7` (F5 aceptada).
Autorizado continuar con la siguiente fase; conservar avance si se agotan los créditos.
Solo se ejecutarán pruebas nuevas y correcciones dirigidas; F1–F5 conservan su evidencia histórica.

## Alcance y estado

NETWORK-001–013 y A11Y-001–008 escritos; validación real pendiente.
No declarar F6 aceptada por colección, logs o typecheck.

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
