# Quickstart: Validar cursos y participación frontend

Frontend implementado y verificado con fixtures (2026-10-22); integración real pendiente.
Contrato: [courses-participation.md](contracts/courses-participation.md).
Modelo: [data-model.md](data-model.md). Dependencia: misión de acceso multitenant.

## Preparación

1. Checkout con acceso por dominio y backend cursos/roles implementados.
2. Node 24, pnpm 9.15.9 y dependencias frontend instaladas con lockfile.
3. Para integración real, seguir `docs/guides/login-session.md` y
   `docs/backend/courses-roles-validation.md`; no modificar datos productivos.
4. Configurar NEXT_PUBLIC_API_URL y orígenes UC/UTFSM según `.env.example`;
   CORS debe admitir ambos dominios locales exactos. Sin JWT en URL o storage.
5. Para búsqueda real US3, cerrar [DEP-FE-SEARCH-001](dependencies/participant-search.md)
   comprobando handler GET users autorizado: hoy falta en backend.
   Su ausencia bloquea aceptación real de búsqueda; fixtures no cierran esa dependencia.
6. Iniciar API siguiendo guía y frontend desde raíz:

```bash
pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend dev
```

Abrir `http://uc.localhost:3000/login` y `http://utfsm.localhost:3000/login`.
Login y navegación conservan dominio; recargar documento exige nueva sesión.

## Fixtures mínimas reproducibles

En `frontend/test/fixtures/courses.ts`, usar fetch inyectado y UUIDs deterministas:
UC con dos cursos, dos secciones por curso; UTFSM con curso propio y usuario sin cursos.
Admin dueño con/sin teacher, admin ajeno con teacher de una sección, teacher no admin,
assistant, student, multirol y isSuperAdmin=true/isAdmin=false sin Enrollment.
Incluir historial inactivo, rol destino existente, último teacher, persona/membership
inactiva, usuario multiinstitución y revocación mientras hay solicitudes pendientes.
No copiar credenciales ni datos reales. US2/US3 usan fixtures sin depender de alta US2.

## US1 — Cursos y secciones (MVP)

- Entrar por cada dominio y listar solo cursos autorizados; abrir detalle y secciones.
- Usuario sin cursos: vacío después de 200; retrasar o fallar fetch para distinguir estados.
- Probar enlace directo de curso ajeno, sección ajena y UUID inválido sin revelar datos.
- Multirol: mostrar roles por sección; admin ajeno con teacher conserva solo su alcance.
- Cambiar curso/sección con respuestas pendientes: resultado antiguo no reaparece.
- Expirar sesión, logout, cambio de usuario y revocación: cero datos anteriores visibles.

## US2 — Configuración propia

- Admin crea curso válido con sección inicial; consultar sección y `/me` después del 201.
- Verificar owner no editable y ausencia de payload que asigne owner/teacher arbitrarios.
- Dueño sin teacher edita configuración y secciones sin abrir contenido/pauta/notas.
- Teacher no admin, admin ajeno y superadmin aislado no reciben controles ni escrituras válidas.
- Probar capacidad null/0/límite, campos vacíos/largos, PATCH vacío y code/term duplicado.
- Simular 409/422/503, doble clic, isAdmin revocado y respuesta perdida tras commit:
  no éxito sin confirmación, no POST automático, consultar estado antes de repetir.
- Para alta de sección con respuesta perdida, comprobar GET listSections antes de
  permitir repetición; revisar código/capacidad y mostrar estado observado sin atribuir
  autoría al envío. Simular coincidencia creada por otro actor y fallo de consulta:
  mantener incertidumbre si no se resuelve, sin nuevo POST ni 409 convertido en éxito.

## US3 — Participantes

- Teacher lista/gestiona solo sección propia; dueño todas sus secciones.
- Assistant/student no montan gestión ni disparan GET de participantes desde esta UI.
- Buscar usuario existente con teacher y paginar; dueño sin teacher usa UUID conocido
  sin GET users ni GET memberships. Backend rechaza destino ajeno/inactivo.
- Conservar roles hermanos; POST 200 no duplica; cambio devuelve ID nuevo o destino
  existente y recarga historial manteniendo origen inactivo.
- Confirmar/cancelar revocación, incluido último teacher: conserva curso e historia.
- Paginar matrículas activas e inactivas y resetear cursor tras mutación.
- Autorevocar teacher: refrescar `/me`, cerrar gestión si pierde alcance; dueño mantiene
  administración sin adquirir docencia. Respuestas pendientes no reponen permisos.

## Checks automatizados durante implementación

```bash
pnpm --dir frontend api:check
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend test
pnpm --dir frontend test:coverage
pnpm --dir frontend build
python3 .github/scripts/check-doc-length.py
```

Tests por historia en los paths de plan/tasks; umbral c8 existente 80 %
lines/branches. Sin cambios backend, reutilizar evidencia DB/RLS existente;
los mocks frontend no demuestran aislamiento de base de datos.

## Comprobación de navegador y evidencia

Recorrer US1–US3 por teclado en 375 px y escritorio, claro/oscuro y movimiento reducido.
Comprobar foco inicial/cierre/Escape de confirmación, errores anunciados, labels,
aria-current, scroll de tabla y contraste ≥4.5:1. jsdom no valida layout ni foco modal real.
Registrar resultados FR-001–016 y SC-001–004 aquí al implementar, con comandos,
fecha y límites; no marcar pendiente como aprobado ni desplegar por ejecutar esta guía.

## Evidencia local — 2026-10-22

- T001: acceso por dominio, Session.request y `/me` disponibles en checkout; cubre
  CU-03/04, RF10–12/25–26, RNF1–4/7/9, FE-05–07/20 sobre la misión de acceso.
- T002: revisados AppModule y backend/src: sigue ausente el handler `/users`.
  DEP-FE-SEARCH-001 permanece abierta; no hay cambios backend ni permisos nuevos.
- Suite completa: 165/165 pruebas aprobadas (`pnpm --dir frontend test`).
  Incluye roles multirol/históricos, sucesor nuevo/existente, POST 200/201,
  paginación, 409/422/503, destinos inactivos, autorevocación, sesión/tenant,
  navegación y 403 tardío; mocks de fetch, sin tráfico privado a API real.
- `api:check`, lint, typecheck, test:coverage y build: aprobados.
  Cobertura final: 91.75 % líneas / 88.23 % ramas (umbral 80/80).
  check-doc-length.py y git diff --check aprobados.
- Alta curso: solo Course confirmado; luego GET secciones y `/me`.
  Altas inciertas consultan estado; coincidencia no prueba autoría y el envío
  queda bloqueado. Sin éxito optimista, retry automático ni cambios backend/DB.

### Navegador real con API fixture

Chromium visible vía playwright-skill; script `/tmp/playwright-test-academix.js`.
Servidor dev local con NEXT_PUBLIC_INSTITUTION_ORIGINS explícito para UC/UTFSM;
intercepción de `/api/v1/**`, sin credenciales ni escrituras reales.
Cuatro recorridos aprobados: 1280×900 y 375×900, claro/oscuro, reduced motion.
Se ejecutaron login, directorio, detalle, alta/configuración de curso, alta de sección,
búsqueda, asignación y revocación por controles de teclado.
Diálogo: Cancelar con foco inicial, Tab/Shift+Tab confinados, Escape y retorno al
botón; cancelar no escribe. Se corrigió escape de foco detectado en navegador.
Sin overflow horizontal de página; tabla desplazable. Avisos role=status/alert,
labels, aria-current y campos inválidos asociados comprobados con DOM/navegador.
Contraste calculado sobre estilos visibles: mínimo 5,66:1 claro y 5,74:1 oscuro;
botón principal 11,50:1/7,10:1. Transición reducida 0,00001 s; cero pageerrors.
Capturas: `/tmp/academix-{light,dark}-{1280,375}.png` (artefactos locales temporales).

### Trazabilidad y límites de aceptación

| Criterios | Evidencia y alcance |
| --- | --- |
| FR-001–007, SC-001 | API/DOM de capacidades, UC/UTFSM, owner y perfiles; fixture |
| FR-008–011 | Participantes, multirol, historia, UUID/búsqueda y diálogo; fixture |
| FR-012/013, SC-003/004 | Errores, altas inciertas, sesiones, secuencia y 403 tardío |
| FR-014, SC-002 | Chromium, cuatro recorridos; diálogo y formularios por teclado |
| FR-015/016 | Suite, OpenAPI vigente; sin cambios DB/auditoría ni certificación RLS |

US1/US2 y frontend US3 verificables localmente. T033 permanece pendiente para
aceptación real: DEP-FE-SEARCH-001 sigue sin handler y sin evidencia API autorizada.
No se ejecutó integración privada real de cursos, secciones o matrículas.
Fixtures no certifican autorización backend; historial/auditoría backend sin cambios.
Hooks git pre/post opcionales omitidos durante implementación. El PR posterior incluye
solo spec/frontend y contexto de agente; sin deploy, publicación ni issues nuevos.
