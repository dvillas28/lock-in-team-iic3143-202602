# Revisión y evidencia — 2026-10-25

Rama local: `feat/interfaz-academica-markdown`, base `origin/dev` `1a6130b`.
Árbol inicial limpio. Identidad Git: Jbcleon. Tras la revisión visual, el usuario autorizó
commits locales y pidió el texto de la PR; sin push, PR ni merge. Sin servicios ni datos reales modificados.
Skills aplicadas: lms-ui-ux y lms-reviewer, disponibles en .agents/skills/.
CodeGraph se intentó primero; comando no instalado. Inspección directa como alternativa.

## Verificación ejecutable

Desde la raíz, `pnpm --dir frontend <script>`, salvo documentación/diff:

| Comando | Resultado |
| --- | --- |
| api:check | PASS, cliente generado coincide con OpenAPI |
| typecheck | PASS |
| lint | PASS, sin errores ni advertencias |
| test:coverage | PASS, 312 pruebas, 0 fallos; incluye toda la suite existente |
| build | PASS, Next 16.4.1, rutas académicas e institucionales compiladas |
| python3 .github/scripts/check-doc-length.py --self-test | PASS |
| python3 .github/scripts/check-doc-length.py | PASS, documentos nuevos y modificados |
| git diff --check | PASS |

Cobertura final: 93,10 % líneas; 87,56 % ramas. Umbrales 80/80 y exclusiones intactos.
Base medida antes de editar: 288 pruebas PASS; 92,77 % líneas y 86,96 % ramas.
La última cobertura se ejecutó sola: ejecuciones simultáneas de c8 comparten temporales.
Logs: /private/tmp/academix-interface-{api,typecheck,lint,build}.log y
/private/tmp/academix-feedback-coverage.log (última ejecución). LCOV: frontend/coverage/lcov.info.
SonarQube: no hay análisis nuevo de estos cambios sin commit/push ni ejecución CI.
Configuración y gate existentes no modificados; no se atribuye un gate remoto aprobado.
Build mantiene advertencia preexistente por lockfiles múltiples.

## Navegador de la primera implementación con entorno aislado

Navegador integrado de Codex, inspección DOM/CSS y capturas reales; motor no identificado.
Next local en 3000 + API de fixtures exclusiva en 127.0.0.1:4011, sin DB.
Fixture temporal: /private/tmp/academix-interface-fixture.ts; usa datos de frontend/test.
No hay fallback de producción, mock de autorización en la aplicación ni credenciales reales.
Una copia de HEAD extraída con git archive en /private/tmp/academix-interface-before
corrió en 3002 con los mismos fixtures para comparación antes/después a 1440×1000.
Se abrió el mockup 12 a 1440×1000, y se inspeccionaron referencias 03/04/07/11 y CSS canónico.
Dev Turbopack no pudo iniciar FSEvent en sandbox; se usó webpack con WATCHPACK_POLLING.
El build de producción con Turbopack sí pasó. No se cambió next.config ni infraestructura.

| Perfil fixture / área | Comprobación visual |
| --- | --- |
| Docente UC | Cursos, detalle, módulos, filas de material y lector; 1440 claro/oscuro |
| Estudiante UC | Cursos, detalle, módulos sin editores, lector; 375 claro/oscuro |
| Ayudante UC | Detalle, libro y revisión sin columna de corrección docente; 1280 claro |
| Administración UC | Alta plegable de curso, curso propio, secciones y auditoría; 1280 claro |
| Docente UTFSM | Acceso institucional, módulos, edición plegable; 375 claro/oscuro |
| Público | Landing 375 claro/oscuro, selección UTFSM y login del subdominio |

Sin overflow horizontal de página en vistas medidas; scrollbar consume 10 px del viewport.
Código móvil: scrollWidth 301 > clientWidth 289 dentro de pre con overflow-x:auto.
Tablas GFM tienen contenedor propio enfocable. Listas computadas disc/circle.
Un h1 de página; fuente Markdown #/## se convierte en h2/h3. Cero img de contenido.
Contraste medido sobre lector/breadcrumbs/identidad: mínimo 5,66:1 claro y 5,99:1 oscuro.
Enter abre navegación; foco pasa a Mis cursos. Escape cierra y devuelve foco al botón.
Retorno del lector abre el módulo del hash y enfoca su encabezado con outline visible.
Borrador docente con espacios conservado al plegar/reabrir y actualizar materiales.
Consolas revisadas sin errores de implementación. Recursos Markdown no generan DOM remoto;
las pruebas verifican además que fetch de contenido no solicita destinos externos.
Reduced-motion conserva la regla canónica global, sin nuevas animaciones.

## Capturas locales, fuera del repositorio

Directorio: /private/tmp/academix-interface-evidence/.
Pares 1440 claro: courses-before / courses-after, course-before / course-after,
modules-before / modules-teacher, reader-before / reader (sufijo -1440-light.jpg).
Otros: reader-1440-dark.jpg, reader-375-{light,dark}.jpg,
modules-student-375-light.jpg, editor-teacher-375-{light,dark}.jpg,
course-assistant-1280-light.jpg, attempt-assistant-1280-light.jpg,
sections-admin-1280-light.jpg, audit-admin-1280-light.jpg,
landing-375-{light,dark}.jpg y login-utfsm-375.jpg.

## Revisión y límites

lms-reviewer: contratos, capacidades y Session.request conservados; ambos padres del
material se validan antes del renderer. Sin escrituras optimistas ni consultas N+1 nuevas.
Publicación independiente y descartes asíncronos cubiertos por suite existente y nueva.
Selects traducidos mantienen valores contractuales; solo labels cambian al español.
CSS de tablas compartido actualizado también en mockups/assets/app.css.
Pruebas nuevas cubren semántica GFM, URL adversarial, HTML literal, imágenes inertes,
capacidad de navegación, identidad única, tema, Escape, foco, hash y borradores.

No había backend en localhost:3001 ni daemon Docker. No se validaron contra API real
RLS, persistencia, auditoría SQL, cuentas provisionadas ni mutaciones concurrentes reales.
Los fixtures no certifican esos controles. T026 del plan de contenido sigue pendiente.
Quizzes, rendición, notas y estados de red/validación tienen regresión automatizada;
no se afirma revisión manual exhaustiva de cada pantalla/estado ni auditoría axe/Safari/Firefox.
No se corrigieron reglas de negocio ni se añadieron métricas, uploads o permisos ficticios.
Runtime usado: Node 24.9.0, pnpm 9.12.2 disponible en el equipo.
Los servidores de fixtures, referencia y Next quedaron detenidos al terminar.

## Ajustes posteriores por revisión del usuario

Altas confirmadas limpian formulario (módulo, material, curso, sección, participante y quiz).
Errores e incertidumbre conservan el texto; actualizar un recurso conserva valores editados.
Una creación confirmada limpia incluso si el refresh posterior falla; no repetir el alta.
Los mensajes nombran recurso/operación; el hook expone éxito explícito para status/alert,
sin inferirlo comparando textos traducibles. La búsqueda de participantes también se limpia.
Resumen presenta accesos académicos y participación, con una explicación de su propósito.
Secciones y participantes concentra configuración, secciones y matrículas según capacidades;
el docente abre solo las secciones gestionables. No se duplica la gestión en Resumen.
El estudiante no ve pestaña/botón de gestión ni capacidad: su sección aparece como contexto
personal en Resumen, filtrada por membresías del curso. Sin nuevas llamadas API.
Pruebas: creation-reset, courses-ui, participantes y expectativas de feedback actualizadas.
Altas y feedback se verificaron con DOM automatizado, tipos, lint, build y cobertura completa.
Las capturas anteriores documentan la primera revisión de la interfaz.
Logs finales: /private/tmp/academix-feedback-{api,typecheck,lint,build,coverage}.log.
Sin cambios backend, push ni reinicios de contenedores del usuario; commits locales autorizados al cerrar.

## Gestión de muchas secciones

Selector nativo filtrable por código, limitado a las capacidades actuales; un panel activo.
El filtro conserva la selección hasta elegir otra opción y no agrega consultas por sección.
Cambiar de sección descarta lecturas tardías. Tabla con scroll interno acotado y cabeceras
fijas; filas compactas con acciones en details. Escape cierra y retorna foco al summary.
Paginación por cursor, historial, confirmación de revocación y bloqueos inciertos conservados.
Pruebas nuevas: 100 secciones con una sola lectura de participantes, filtro sin consultas,
cambio de selección, respuesta tardía y acciones plegables sin desbloquear escrituras inciertas.
Navegador con fixtures locales: Next 3010 y API 4011, sin DB ni datos reales.
100 secciones y 20 matrículas: selector de altura estable; una tabla de 510 px a 1440×1000.
Scroll interno comprobado: encabezado permanece a 1 px del borde con scrollTop de 500 px.
375×812 oscuro: tabla de 410 px; scroll horizontal interno de 640 px sobre ancho de 321 px.
Página sin overflow: 365/365 px en móvil y 1280/1280 px en escritorio. Consola sin errores.
Se probó elegir sección 99, abrir con Enter y cerrar con Escape con retorno de foco.
Capturas: /private/tmp/academix-sections-evidence/sections-{1440-light,375-dark}.png.
Entorno temporal y pestaña cerrados; Docker del usuario no se modificó.
Logs de esta revisión: /private/tmp/academix-sections-{api,typecheck,lint,coverage,build}.log.
