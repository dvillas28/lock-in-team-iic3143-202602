# Experiencia académica y casos borde del MVP

## Objetivo

Conservar trabajo al volver al navegador, recuperar fallos sin perder contexto y
hacer comprensibles las notas, el libro, la auditoría y la asignación de roles.
El usuario autorizó revisar todos los flujos existentes del MVP, sin ampliar su
alcance funcional ni cambiar reglas académicas.

## Historias independientes

- US1: cualquier usuario retoma la ventana conservando su trabajo; errores de
  recursos permanecen locales y una revocación confirmada elimina datos privados.
- US2: un docente busca personas de su institución y asigna roles en su alcance;
  sin resultados recibe una lista vacía, sin acceso recibe un error local.
- US3: un estudiante navega entre curso, material, quizzes y notas publicadas.
- US4: docentes consultan el libro y publican mediante selección y confirmación;
  docentes administradores propietarios configuran ponderaciones; ayudantes leen.
- US5: docentes consultan auditoría con filtros comprensibles y detalle seguro.
- US6: los flujos MVP tienen matriz de casos borde y verificaciones reproducibles.

## Reglas y aceptación

- Tenant derivado del path validado y membership activa, RLS sin bypass.
- Búsqueda requiere teacher activo; admin/superadmin aislados no conceden búsqueda.
- Conservar contexto idéntico y operación pendiente en foco/visibilidad; no reenviar.
- 401/expiración limpia sesión; 403/404 de recurso no elimina una institución válida.
- Fallo temporal de `/me`: lectura conservada, aviso y escrituras bloqueadas.
- Notas y publicaciones inmutables; cambios de rol/pesos conservan auditoría actual.
- Promedios calculados en backend; no anticipar notas ni acceder a pauta restringida.
- Publicación solo de selección explícita revisada, sin páginas ocultas, con clave
  estable durante incertidumbre. Rechazo definitivo permite nueva selección.
- Estados vacíos, error, conflicto y carga deben distinguirse; ambos temas,
  navegación por teclado y móvil 375 px son parte de la aceptación.

## Trazabilidad y dependencias

CU-01–CU-16 y RF/RNF de Entrega 2 según docs/deliveries/2/03-use-cases-and-requirements.md.
US2: CU-04, backlog FE-05–FE-07/20, DEP-FE-SEARCH-001.
US3–US5: CU-10–CU-13/CU-16, RF21–26/29, RNF1–4/7/9, FE-15–FE-20.
US1/US6: transversales a las misiones frontend existentes y sus contratos.
Dependencias: identidad, cursos/roles, módulos, quizzes, intentos, notas y auditoría
existentes; contrato `/users` documentado, implementación runtime pendiente.
Exclusiones: nuevos roles, invitaciones, analytics, corrección manual, uploads,
proveedores, polling y persistencia de datos privados en navegador.
