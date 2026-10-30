# Discrepancias, riesgos y decisiones pendientes

Hallazgos estáticos, sin nuevas ejecuciones runtime. Severidad es impacto potencial,
no afirmación de vulnerabilidad explotada. Un test bloqueado no equivale a PASS ni skip silencioso.

| ID | Observación y evidencia | Consecuencia / resolución para el plan |
| --- | --- | --- |
| D01 | [render.yaml](../../../render.yaml) y ADR Render reemplazan Railway histórico | Entorno E2E local/CI; no ligar pruebas a proveedor ni probar deploy real |
| D02 | [scope](../../deliveries/2/02-scope.md) difiere de mockup PDF/Entrega 1 | Binarios, entregas manuales, recorrecciones, chat, IA, calendario, avisos: excluidos |
| D03 | [ownership](../../adr/institution-admin-and-course-ownership.md) elimina coordinador | Tres roles académicos; super/admin son flags independientes, sin acceso académico automático |
| D04 | [ADR quiz](../../adr/quiz-authoring-integrity.md) y `requireDraft` congelan al publicar | RF/CU que hablan de primer intento son menos restrictivos; esperar PATCH publicado 409 desde publicación |
| D05 | [ADR cancelación](../../adr/close-abandoned-quiz-attempts.md) aún nombra coordinador | Aplicar ADR ownership posterior y `attemptView`; no crear ese actor |
| D06 | [sesión](../../../frontend/src/lib/auth/session.ts) solo memoria | Reload pierde token; no exigir persistencia de login ni usar storageState como autenticación |
| D07 | Logout solo cliente, JWT stateless sin revocación API | Limpiar UI/peticiones; token copiado puede seguir válido hasta exp o User inactivo; no esperar 401 por logout local |
| D08 | `safeReturnPath` no conserva detalle curso/material/autoría | Deep links restringidos retornan solo a allowlist; documentar fallback `/courses`, no inventar retorno universal |
| D09 | [main](../../../backend/src/main.ts) 4096 bytes vs validadores Markdown/instrucciones 10000 caracteres | Límite HTTP domina; separar límites de dominio de payload alcanzable; body exacto UTF-8 |
| D10 | Throttler en [app.module](../../../backend/src/app.module.ts), trust proxy false | Más de 5 logins por IP/min bloquea incluso válidos; entorno por test/proceso o cola por API |
| D11 | No pnpm workspace ni E2E instalado | Diseño propone paquete aislado; no agregar tooling en esta rama |
| D12 | [helpers integración](../../../backend/test/integration/helpers.mjs) DROP SCHEMA / HTTP 180 s | No reutilizar servidor/helper reset para suite larga ni DB compartida |
| D13 | [seed presentación](../../../backend/src/seeds/presentation-data.ts) preserva ediciones; ficticios sin password utilizable | Seed E2E propia, namespace y credenciales efímeras; no demo productiva |
| D14 | [precisión temporal](../../adr/quiz-attempt-lifecycle-and-grading.md) acepta pérdida <1 ms | Probar ventanas ms con margen; boundary exacto en integración SQL controlada, sin sleeps frágiles |
| D15 | [ParticipantsPanel](../../../frontend/src/components/courses/participants-panel.tsx) solo `manage`, backend permite assistant leer | Consulta participantes assistant: disponible API, sin panel UI. No inventar pantalla |
| D16 | [institutions/page](../../../frontend/src/app/institutions/page.tsx) redirige cursos | Directorio privado accesible API; landing es directorio público estático de destinos, no memberships |
| D17 | [membership controller](../../../backend/src/institutions/membership-admin.controller.ts) sin UI general | Delegación superadmin se cubre HTTP real + efectos en UI del usuario objetivo |
| D18 | [capacidad](../../../backend/src/sections/sections.service.ts) metadata, sin conteo de cupos al enrolar | No afirmar rechazo por sección llena; aclarar si se exigiera cupo como regla futura |
| D19 | No DELETE en controladores; historia inmutable | No planificar borrado de módulos/cursos/materiales como feature pendiente del MVP |
| D20 | [privacidad auditoría](../../adr/grade-audit-visibility.md) corrige acceso de owner sin teacher | P0: owner+student sin teacher no obtiene grade vía historial, aunque sea su curso |
| D21 | CI push main; release dev solo etiqueta | Nueva propuesta debe añadir regresión dev en otra rama; no asumir gate actual E2E |
| D22 | OpenAPI enum incluye submitted; servicio corrige dentro de misma transacción | No esperar estado durable submitted ni worker; verificar no queda pendiente tras éxito/error |
| D23 | Reanudación desde ID conocido, sin endpoint propio de descubrimiento | Registrar attemptId en test; no inventar listado de intentos del estudiante |
| D24 | [render](../../../render.yaml) portal Render; origen público del contexto inicial difiere | Infra E2E usa portal.local/test configurado; disponibilidad de dominios reales queda sin verificar |
| D25 | API de [pesos](../../../backend/src/gradebook/gradebook.service.ts) no expone freeze directamente | UI recorre libro global paginado al abrir editor; test publicación en página oculta y carrera 409 |
| D26 | No scheduler ni límite por duración de intento | Fecha de cierre bloquea start/save/submit, no cancela; cancelación explícita resuelve abandono |
| D27 | Contrato histórico onboarding aún usa base plural `/institutions/{slug}` | Prevalece OpenAPI/controller singular `/institution/{slug}`; no copiar ruta histórica al runner |

## Aclaraciones precisas antes de automatizar escenarios bloqueados

| ID | Pregunta técnica | Responsable sugerido / salida |
| --- | --- | --- |
| Q01 | ¿Se exige precisión exacta inclusivo/exclusivo bajo ms? ADR acepta ms | Backend/PM; conservar deuda actual y no bloquear MVP por µs |
| Q02 | ¿400/422 de NUL o valor gigante en metadatos es contrato estable? validadores `text` no excluyen NUL explícitamente | Backend/contrato; caracterizar en base efímera, no fijar 500 como correcto |
| Q03 | ¿Se requiere navegador Firefox/WebKit sobre `*.localhost` o usar /etc/hosts CI? | Infra; probar resolución durante F1, fijar estrategia compatible |
| Q04 | ¿Qué check requerido y presupuesto Actions tiene el repo? | Maintainer; propuesta concreta CI, sin cambiar protección remota aquí |
| Q05 | ¿Qué prueba de restauración/backups existe operativamente? | Operador; RNF5 no puede acreditarse con E2E ni con Render free |

Estas aclaraciones no impiden diseñar el resto de la suite. Casos que dependen de Q02
se marcan «propuesto / aclaración» con requisito esperado y sin código HTTP inventado.
No se detectó otro endpoint documentado ausente en el barrido de 50 operaciones;
no equivale a verificación exhaustiva de conformidad runtime de todos los DTO/códigos.
Los 413/415 transversales no están declarados en todas las operaciones OpenAPI.
Registrar expansión de documentación contractual como seguimiento, sin modificar contrato ahora.
