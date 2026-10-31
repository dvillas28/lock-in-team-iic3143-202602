# F2 — Entrada, navegación y catálogo

Corte 2026-10-31. **F2 aceptada localmente; trabajo detenido antes de F3 por petición del usuario.**
Checkout permanente `/Users/julian/lock-in-team-iic3143-202602`, rama `test/e2e-f2`.
Sin push, merge, producción ni cambios de frontend/backend/contrato.

## Evidencia reproducible

| Run | Código limpio | Alcance | Resultado |
| --- | --- | --- | --- |
| 11bddd2b9bf127be | 0eff642 | F2, Chromium + smoke Firefox/WebKit | 61 PASS; total134,697s |
| c5dd3c5cb8a88207 | 067eb7d | Revisión de transiciones/filtro | 6 PASS; total21,982s |
| a3061c99e107ad8b | 067eb7d | Regresión F1+F2, tres motores | 72 PASS; total140,230s |
| c41540ab4f22ea26 | 23d7ebb | Regresión F1+F2 y metadatos completos | 72 PASS; total155,634s |

Todos exit0, dirtyAtStart=false y dirty=false, sin fallidos/omitidos/flaky.
La última corrida tiene **51 instancias navegador y 21 complementarias**, no 72 fichas distintas.
Por proyecto: Chromium 58, Firefox 7, WebKit 7. Solo el smoke de entrada se expande a Firefox/WebKit;
la compatibilidad académica completa corresponde a F6.

Cobertura final: **31 de 248 fichas aprobadas**,21 navegador y 10 complementarias;217 pendientes.
F2 aporta 22 fichas (AUTH-001 ya existía): PUBLIC-001…007, CATALOG-001…004,
AUTH-001/002/004/005/006/010/012/013/014/015/022. OPS-001…009 conserva F1.
SHA final `23d7ebb6090be10403c2189c8e0ec7c8dc335185`, seed `academix-e2e-v1`, Playwright 1.64.1.
HTML/JSON/JUnit/run/coverage locales: `e2e/reports/c41540ab4f22ea26/`; latest.json apunta a ese run.

## Comandos para probar esta fase

```bash
cd /Users/julian/lock-in-team-iic3143-202602
pnpm test:e2e:f2
pnpm test:e2e:f2 --project=chromium --project=firefox --project=webkit
pnpm --dir e2e report
```

Primer comando: 47 instancias Chromium; segundo:61 de F2 incluyendo smoke de los otros motores.
Para ver Chromium: `pnpm test:e2e:f2 --headed`.
Regresión acumulada: `pnpm test:e2e --project=chromium --project=firefox --project=webkit` (72).
El runner detecta `e2e/.cache/browsers`; una variable PLAYWRIGHT_BROWSERS_PATH explícita prevalece.
Cada comando construye su stack propio y lo limpia; no deja un LMS de prueba sirviendo al terminar.

## Comprobaciones y correcciones del harness

- Login real, errores indistinguibles, validación local, normalización de correo y password exacta por bytes.
- Límites de email/password, Unicode, JSON, payload y media; recuperación con credenciales válidas.
- Sesión SPA frente a reload, deep links, allowlist, doble next, rutas legacy y login con sesión activa.
- Portal y hosts UC/UTFSM, anclas/historial, origen desconocido y 404 con recuperación.
- Catálogo sin API: 50 operaciones, filtro por rutas con resultados, enlace profundo, descarga/revisión,
  JSON500/malformado, bundle fallido, teclado/375px/zoom y build inválido sin sustituir release anterior.
- Rutas de compatibilidad usan el router existente de Next; se espera la transición antes del redirect.
- Se corrigieron rutas/selectores, esperas por respuesta y captura estructurada de diagnósticos de build.
- La revisión encontró un hook de metadatos limitado al primer archivo: ahora es fixture automática,
  validada en todas las instancias; coverage rechaza metadatos ausentes o inconsistentes.

Typecheck/lint y 11 unitarios PASS. Puertos 4320/4321 libres y ningún directorio PG/catálogo propio retenido.
Escaneo de los reportes finales sin patrones JWT ni URLs PostgreSQL; reportes ignorados por Git.
Los runs diagnósticos fallidos se conservaron; no se eliminaron aserciones ni se añadieron retries/skips.
Aún no se acredita estabilidad en 20 runs, seguridad completa, F3–F7 ni ejecución remota de CI.
