# Frontend AcademiX: mapa de misiones

Fecha: 2026-10-21. Base revisada: `upstream/dev` en `ee4a329`, incluido login #124.
La [fundación](../../specs/20261021-135729_fundacion-frontend/spec.md) entrega seis
specs de producto; no implementa pantallas ni genera sus planes/tasks de código.

## Misiones

| Orden | Spec | Alcance | Dependencia runtime | Estado documental |
| --- | --- | --- | --- | --- |
| 1 | [Acceso y multitenancy](../../specs/20261021-141348_frontend-acceso-multitenant/spec.md) | Login, dominio, sesión, rutas limpias | Base existente | Validado para plan |
| 2 | [Cursos y participación](../../specs/20261021-141349_frontend-cursos-participacion/spec.md) | Shell, cursos, secciones y participantes | 1 | Validado para plan |
| 3 | [Módulos y material](../../specs/20261021-141350_frontend-modulos-material/spec.md) | Markdown, orden y publicación | 2 | Validado para plan |
| 4 | [Autoría de quizzes](../../specs/20261021-141351_frontend-autoria-quizzes/spec.md) | Configuración, preguntas y pauta | 2 | Validado para plan |
| 5 | [Rendición de quizzes](../../specs/20261021-141352_frontend-rendicion-quizzes/spec.md) | Inicio, guardado, envío y cancelación | 4 | Validado para plan |
| 6 | [Notas y seguimiento](../../specs/20261021-141353_frontend-notas-seguimiento/spec.md) | Pesos, publicación, resultados y auditoría | 5 | Validado para plan |

Redacción/revisión usa fixtures y no exige implementar otras misiones. Implementación:
`1 → 2 → {3,4}; 4 → 5 → 6`. No hay ciclos. Auditoría comparte spec con seguimiento;
cancelación se define una vez en misión 5 y se reutiliza desde revisión docente de misión 6.
Accesibilidad, errores, aislamiento y permisos forman parte de cada misión.

## Contrato común

- Frontend: `uc.academix.dvillasc.me/courses` muestra ruta limpia.
- Adaptación interna: dominio reconocido → `uc` → API central
  `https://api.dvillasc.me/api/v1/institution/uc/courses`.
- Login y directorio de instituciones propias conservan alcance global.
- El backend valida identidad, pertenencia activa, curso/sección y rol; Host/Origin
  no autorizan ni sustituyen el slug solicitado al backend. Sin acceso directo a DB.
- CORS permite orígenes exactos y headers contractuales; no concede acceso a datos.
- La [sesión en memoria vigente](../adr/browser-session-in-memory.md) se reutiliza:
  recarga, nueva pestaña y cambio de dominio requieren login; no SSO ni refresh.
- Desarrollo local usa dos hosts explícitos; misión 1 define equivalencia y rechazo
  de localhost sin contexto. Nunca se elige UC por defecto.

## Reutilización y transición

#124 ya implementó login, selector, sesión en memoria, protección por `/me`, descarte
de respuestas tardías y CORS. Sigue mostrando `/institutions/{slug}`; misión 1 adapta
rutas, retornos, links, hosts locales, pruebas y guías, conservando esas garantías.
Las otras cinco misiones conectan vistas académicas a contratos ya existentes.
Esta revisión documental no acredita despliegue ni ejecución de esas vistas.

## Criterio de aceptación por spec

Spec y checklist separados, CU/RF/RNF/backlog, fuentes, dependencias y exclusiones.
Éxito/rechazo, UC/UTFSM, revocación, multirol, carga/vacío/error y recuperación segura.
Teclado, foco, contraste 4.5:1, móvil, ambos temas y movimiento reducido.
Permisos efectivos e historial backend; notas/pauta sin exposición anticipada.
Cada documento <150 líneas; evidencia documental separada de pruebas de producto.
Los responsables JC/MA del backlog se conservan; no se crean ni cierran issues.

## Fuentes y siguiente paso

- [Cobertura y evidencia](coverage.md): CU-01–16, FE-01–20 y 16 vistas.
- [Backlog](../deliveries/2/08-work-plan-detail/08-work-plan-detail.md),
  [CU/RF/RNF](../deliveries/2/03-use-cases-and-requirements.md).
- [Mockups](../../mockups/README.md), [diseño](../../DESIGN.md),
  [permisos vigentes](../adr/institution-admin-and-course-ownership.md).
- [Contrato](../reference/openapi/openapi.yaml), [cliente](../guides/frontend-api-client.md),
  [login existente](../guides/login-session.md).

Después de completar la fundación, comenzar con `speckit-plan` de misión 1 usando
`SPECIFY_FEATURE_DIRECTORY=specs/20261021-141348_frontend-acceso-multitenant`.
No generar planes de seis misiones a la vez: resolver primero integración y contexto.
