# Contrato de entrega: seis specs frontend

## Artefactos y alcance

Cada US produce un directorio reservado por [plan.md](../plan.md), con `spec.md`
y `checklists/requirements.md`. Ejecución entrega `docs/frontend/README.md`
y `docs/frontend/coverage.md`. No se modifican APIs, UI, despliegues ni datos.

Índice: orden, alcance, dependencias, links y estado documental real.
Cobertura: CU, RF/RNF, tareas FE y vistas/acciones; responsables JC/MA del backlog.
No se presupone estado actual de issues remotas.

## Mapa obligatorio

| US / misión | CU | Backlog | Vistas y alcance |
| --- | --- | --- | --- |
| US1 acceso/multitenancy | 01–02 | FE-01 reuso, FE-02 transición, FE-03–04 | 01 parcial, 02, 10 |
| US2 cursos/participación | 03–04 | FE-05–07 | 03, 07, 11 |
| US3 módulos/material | 05–06, 14 | FE-08–10 | 04 parcial, 12; 09 excluido |
| US4 autoría | 07 | FE-11 | 13 |
| US5 rendición | 08–09, 15 | FE-12–14 | 05 intento, 14, 16 cancelación |
| US6 notas/seguimiento | 10–13, 16 | FE-15–19 | 06, 08, 15, 16 consulta; 05 notas |

FE-20: transversal en seis specs; US6 consolida cobertura. FE-21: excluido (binarios).
Vista 01: acceso a login, no landing comercial nueva. Vista 04: lectura markdown;
vista 09: lector PDF excluido hasta archivos. Vista 16: consulta de US6 y cancelación
especificada una vez en US5.

RF por misión: US1 RF1–9; US2 RF10–12/25–26; US3 RF13–14(markdown)/16/25–26;
US4 RF17–18/25–27; US5 RF19–20/25–28; US6 RF21–26/29.
RNF1–4/7/9: transversales según acción. RF15/RNF8 y parte binaria de RF14 excluidos.
RNF5/6/10 y persistencia RF3/7–9 se reutilizan del backend, sin reimplementarlos.

## Requisitos comunes de cada spec

- Actores, valor, historias priorizadas, aceptación independiente, rechazo y límites.
- Dependencias explícitas y fixtures para revisión sin UI implementada.
- Vistas/acciones, operaciones del OpenAPI vigente y estados de carga/vacío/error.
- Permisos por institución/curso/sección, sin conceder por URL/perfil.
- Pruebas futuras UC/UTFSM, revocación, multirol y ausencia de datos cruzados.
- Teclado, foco, labels, contraste 4.5:1, móvil, temas y movimiento reducido.
- Historial/auditoría para cambios sensibles y visibilidad correcta de notas/pauta.
- CU/RF/RNF, backlog, fuentes, responsables, exclusiones y checklist separado.
- <150 líneas por archivo; dividir anexos solo si hace falta y enlazarlos.
- Distinguir evidencia ejecutada de pruebas propuestas; no simular integración real.

## Requisitos específicos de acceso

- UC/UTFSM: dominio reconocido → slug → `/api/v1/institution/{institutionSlug}/...`.
- Rutas frontend limpias, incluidos enlaces, navegación directa y retorno tras login.
- Login `/api/v1/auth/login` y directorio `/api/v1/institutions` siguen globales.
- Validar `/api/v1/institution/{institutionSlug}/me`; el backend siempre autoriza.
- Orígenes conocidos: `https://uc.academix.dvillasc.me`,
  `https://utfsm.academix.dvillasc.me`; API central `https://api.dvillasc.me`.
- Definir equivalencia local de ambos dominios, alias y puertos; sin tenant por defecto.
- Definir selector/cambio de institución sin slug visible, credenciales en URL
  ni asumir sesión entre dominios; rechazar retornos externos no autorizados.
- Definir persistencia, recarga, logout, JWT expirado (15 min actuales), revocación,
  pestañas paralelas, ausencia de refresh actual y respuestas 401/403/404/429.
  Reutilizar la ADR de memoria y #124 ya integrado: no reinventar login ni asumir SSO.
- CORS: orígenes exactos, preflight Authorization/Content-Type según operación,
  permitido/denegado/local; diferenciar consumo browser/servidor.
- Sin DB directa; Host/Origin no autorizan; no elegir proxy/SSO aquí.
- Inventariar reemplazo de rutas actuales, `institutionHomePath`, shell, tests
  y guías; no modificar esos archivos de producto al redactar specs.

## Reconciliación de permisos

Prevalecen OpenAPI y [ADR admin/ownership](../../../docs/adr/institution-admin-and-course-ownership.md).
Coordinador en FE-07/11 no crea un rol. isAdmin requiere ownership para administrar
curso; docente no admin conserva su alcance académico.
Admin sin Enrollment docente no obtiene pauta/notas/contenido docente.
isSuperAdmin solo delega isAdmin; administración institucional general queda excluida.
Registrar contradicciones históricas del README de mockups y FE-02, sin copiarlas.
Brechas reales del contrato se resuelven antes del plan hijo; no alterar backend
como efecto lateral de esta misión.

## Criterio de entrega final

Seis specs/checklists revisados, cero ciclos, CU-01–16 y FE-01–20 clasificados,
16 pantallas cubiertas/excluidas y evidencia en `docs/frontend/coverage.md`.
Una duda que impida aceptar un spec mantiene su checklist pendiente.
El cierre documental no necesita backend levantado, navegador ni producción.
