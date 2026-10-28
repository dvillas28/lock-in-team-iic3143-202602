# Interfaz académica y lector Markdown

Fecha: 2026-10-25. Rama: `feat/interfaz-academica-markdown`, base `dev`.

## Historias independientes

1. Estudiante/ayudante encuentra cursos, módulos y material publicado mediante
   navegación contextual, teclado y móvil, con estados reales de consulta.
2. Docente organiza contenido compartido usando toolbars y editores desplegables
   que conservan borradores y bloqueo de escrituras inciertas en memoria.
3. Cualquier lector autorizado consume Markdown semántico y GFM sin HTML activo,
   recursos remotos ni URLs peligrosas; solo HTTP(S) absolutos y fragmentos.
4. Administración configura cursos propios y secciones con la capacidad existente;
   notas, quizzes, intentos y auditoría conservan reglas y reciben composición común.

## Requisitos y aceptación

- Sidebar, identidad única, tema y breadcrumbs; navegación activa desde ruta real.
- Curso → módulos → material prioritarios; formularios compactos sin pérdida al cerrar.
- Limpiar altas solo tras respuesta confirmada; mantener borradores en rechazo/incertidumbre.
  Mensajes específicos por recurso y operación, con éxito explícito en el estado de mutación.
- Resumen presenta accesos académicos; Secciones y participantes concentra la gestión.
  Ambas vistas explican su propósito. La configuración del curso aparece solo en gestión.
- Secciones de gestión solo por capacidad; estudiante ve su sección en Resumen sin acciones.
- Selector filtrable de secciones con altura estable y un solo panel activo; sin tarjetas acumuladas.
  Participantes en tabla acotada, encabezados fijos, acciones plegables y paginación vigente.
- Un h1 de página; encabezados Markdown desplazados un nivel, máximo h6.
- Listas anidadas, tablas y código con scroll interno; sin overflow de página a 375 px.
- URLs verificadas con URL, sin credenciales, controles, espacios, barras inversas,
  rutas relativas/protocol-relative ni esquemas ejecutables. Imágenes como alt inerte.
- React genera elementos, sin dangerouslySetInnerHTML ni rehype-raw.
- Sesión, capacidades, publicación independiente y validación de ambos padres intactas.
- Lecturas tardías no restauran datos al cambiar identidad, tenant o recurso.
- Landing, selección y acceso por dominio conservados; sin llamadas adicionales N+1.
- Verificar con fixtures automatizados y navegador 375/1280/1440, claro/oscuro.
  Distinguir explícitamente fixtures de comprobación con API real.

## Gates y trazabilidad

Tenant: Session.request y API tipada mantienen slug autorizado y ámbito del recurso.
Permisos: capabilities, canAuthorContent y gradebookCapabilities son autoridad UI;
admin institucional no sustituye teacher para autoría. Backend autoriza cada operación.
Historia: no cambiar auditoría ni registros; edición/publicación usa contratos actuales.
CU-02–06/10–14/16; RF13/14/16/21–26/29; RNF1–4/7/9; FE-08–10/15–20.
Dependencias: misiones frontend de cursos, contenido, quizzes, intentos y notas.
Excluye backend, DB, storage, infraestructura, DNS, deploy, PR y merge.
Commits locales autorizados por el usuario tras revisar la interfaz; sin push ni creación de PR.
