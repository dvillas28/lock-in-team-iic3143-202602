# Catálogo de endpoints: operación y evidencia

## Generar y consultar

Desde raíz, Node 24, pnpm 9.15.9 y Python 3 para servir localmente:

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
pnpm docs:api:lint
pnpm docs:api:test
pnpm docs:api:build
pnpm docs:api
```

Abrir **http://localhost:8080/**. `dist/api-catalog/index.html` es entrada estable.
No se requiere backend, PostgreSQL ni secretos para generar o leer el catálogo.
Se compila backend y se inspeccionan metadatos Nest, sin instanciar servicios.
El puerto local solo escucha loopback. Ctrl+C detiene el servidor.

Cada release contiene Swagger UI 5.34.0 con CSS/JS oficiales locales, licencias,
configuración y `openapi.json` dereferenciado descargable. JavaScript obligatorio
para el visor; descarga disponible sin JavaScript. No usa CDN ni validador remoto.
El nombre de release y `info.x-source-revision` combinan HEAD de Git y digest de
contrato, fuentes/compilación backend, generador, configuración y estilos.
Así se identifican también cambios locales; HEAD por sí solo no acredita el árbol.
La revisión exacta figura en portada y en la salida del build.

## Disponibilidad y permisos

Fuente única: [OpenAPI 3.1](openapi/README.md). No mantener otra lista manual.
El generador compara método/path de controllers registrados con las operaciones
del contrato; toda ruta sin contrato o contradicción público/Bearer bloquea build.
Operaciones presentes solo en contrato quedan **planificadas**, nunca disponibles.
`x-permissions` y descripciones documentan condiciones; no conceden permisos.

Sobre la base publicada `ad00b3b` (#98), se verificaron **49 operaciones
implementadas de 50 documentadas**. Solo `searchInstitutionUsers` sigue planificada.
Módulos, material markdown, quizzes, intentos y notas sí están registrados en esa
base. No se trasladó el snapshot antiguo del checkout original, que solo tenía 19.
Esto acredita registro en código compilado local, no disponibilidad de un deploy.
Rutas implícitas HEAD/OPTIONS no cuentan como operaciones de negocio adicionales.

JWT identifica User global; institutionSlug solicita contexto, no lo autoriza.
Membership activa y Enrollment/propiedad se validan server-side en cada operación.
Student, assistant y teacher son roles de sección. Admin requiere isAdmin vigente
y propiedad para configurar cursos. Superadmin delega isAdmin en su institución;
ningún flag concede acceso académico implícito. Auditoría y persistencia no cambian.

## Reproducir ejemplos fuera del portal

Usar backend y cuentas propias de prueba previamente provisionadas por PM.
Definir `API_URL` en terminal, copiar curl de login, sustituir email/password y
copiar accessToken de su respuesta a `TOKEN`. Seguir instituciones accesibles y
usar un slug devuelto en la consulta /me. Ejemplos de respuesta son sintéticos;
no contienen tokens válidos ni registros académicos. Swagger UI permite seleccionar
y copiar ejemplos; consultar schemas expandidos para restricciones exactas.
El filtro busca tags/dominios y rutas; las operaciones se expanden y enlazan con sus anclas.
Try it out está deshabilitado: el visor no ejecuta solicitudes académicas.

401 significa token inválido/expirado, ausente o User inactivo; 404 oculta institución
no visible, membership revocada o recurso ajeno; 403 indica permiso insuficiente
sobre alcance visible. Para reproducir rechazos, usar token inválido, slug ajeno
y cuenta student en una operación reservada a teacher. No se ejecutan desde HTML.

## Publicar y volver atrás

CI ejecuta lint, pruebas, build y adjunta artefacto `api-catalog`; incluye releases.
No despliega automáticamente. Descarga y revisa el artefacto antes de aprobar hosting.
La generación local valida en staging; solo una release completa se promueve con
rename atómico de la entrada. Referencias rotas, sintaxis inválida o falta de
cobertura dejan diagnóstico y conservan la entrada anterior y releases previas.
No copiar archivos sobre una release ya publicada.

Para rollback local, copiar el index.html de entrada anterior guardado a un temporal
y renombrarlo sobre la entrada activa. Alternativamente, generar una entrada con
enlace relativo a una release anterior que siga completa en releases/.
Para hosting: cargar primero release completa, comprobar HTML y descarga y luego
cambiar su entrada atómicamente según capacidades del hosting. Conservar release
anterior. La aprobación del despliegue externo sigue pendiente; no se configuró
proveedor ni se modificó infraestructura. [Decisión](../adr/static-api-catalog.md).

## Evidencia de la revisión Swagger UI (2026-10-19)

- Dependencia `swagger-ui-dist@5.34.0` fijada con pnpm; assets y licencias incluidos
  en cada release. Estilos oficiales sustituyen las fichas HTML propias.
- Portada breve: login/Bearer e institución. La guía detallada vive en este documento;
  los permisos, contexto y errores permanecen dentro de cada operación.
- `pnpm docs:api:test`: ejemplos sintéticos, escape, cobertura/seguridad de 49 rutas,
  referencias resueltas, estados/permisos por operación, descarga/revisión,
  assets locales y rechazo de contrato/referencia inválidos preservando entrada previa.
- `pnpm docs:api:build`: release completa con Swagger UI y descarga.
- Validación sintáctica individual de generador, preparación e inicializador.
- Playwright Chromium visible, backend detenido: 50 operaciones, filtro por tag/path,
  enlaces profundos de curso, ejemplos de login/errores y permisos, navegación por
  teclado con foco visible, descarga con revisión coincidente y Try it out ausente.
  Fallos HTTP 500 y JSON inválido muestran alert sin fichas parciales.
  Texto al 200 % y ancho móvil 375 sin desborde de página; tablas desplazables localmente.
  Contraste mínimo medido de etiquetas HTTP, versiones y Authorize: 4.75:1.
  Portada sin guía extensa ni línea de dialecto. Revisión exacta en la salida del build.
  Consultas solo a HTML/CSS/JS/JSON locales; sin llamadas académicas ni errores de página.
  Script: `/tmp/playwright-test-swagger-pr.js`; capturas: `/tmp/academix-swagger-desktop.png`,
  `/tmp/academix-swagger-mobile.png` y `/tmp/academix-swagger-200.png`.
- `pnpm audit --audit-level high`: misma deuda previa de Redocly, 2 críticas,
  2 altas y 2 moderadas transitivas; ninguna atribuida a swagger-ui-dist por el auditor.
  Redocly no se incluye en los assets publicados. Sigue pendiente actualizar su cadena de build.
- Evidencia del cliente sobre esta rama: api:check, typecheck y 30 pruebas pasan.
  Contrato y tipos regenerados; no cambia código de backend ni permisos.
- Redocly conserva dos warnings operation-4xx-response de health/ready; no se
  inventan respuestas para silenciarlos.

## Pendiente y límites

No ejecutados: login real, rechazos contra backend/DB, cinco lectores de SC-002/003,
CI remoto y despliegue externo. No se acredita auditoría WCAG completa ni lector
de pantalla; sí comprobaciones de teclado, foco y reflow indicadas arriba.
No cambia auth, aislamiento, permisos ni auditoría; no se evaluó producción.
