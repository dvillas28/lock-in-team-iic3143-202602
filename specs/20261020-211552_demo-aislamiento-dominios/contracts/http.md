# HTTP Contract: API central, institución por path y CORS

## URLs y responsabilidades

| Componente | URL |
| --- | --- |
| Frontend UC | https://uc.academix.dvillasc.me |
| Frontend UTFSM | https://utfsm.academix.dvillasc.me |
| Backend compartido | https://api.dvillasc.me |
| Backend local | http://localhost:3001 |

El consumidor resuelve uc/utfsm desde su contexto/subdominio y lo incluye como parámetro de ruta.
Backend no necesita conocer el subdominio frontend para resolver tenant ni implementar su middleware.
El path solicita institución; JWT y pertenencia activa autorizan el acceso. Origin no es autorización.
Host, Forwarded/X-Forwarded-Host, Referer, query, body y claims no sustituyen el slug del path.
Mantener trust proxy=false; no introducir confianza en cabeceras de proxy para seleccionar institución.
Una persona con dos membresías puede elegir cualquiera mediante el path; nunca obtiene acceso por Origin.

## Rutas canónicas

Prefijo institucional: /api/v1/institution/{institutionSlug}, en singular por acuerdo del usuario.
El repositorio desplegado usa /institutions/{institutionSlug} plural: actualizar esa nomenclatura
sin eliminar el contexto del path. No introducir alias ni endpoints académicos sin slug.

| Operación | Ruta acordada |
| --- | --- |
| Login global | POST /api/v1/auth/login |
| Instituciones accesibles | GET /api/v1/institutions (global, plural) |
| Identidad contextual | GET /api/v1/institution/{institutionSlug}/me |
| Miembros | GET /api/v1/institution/{institutionSlug}/memberships |
| Delegación admin | PUT /api/v1/institution/{institutionSlug}/memberships/{id}/course-admin |
| Cursos, secciones y roles | /api/v1/institution/{institutionSlug}/courses/... y /sections/... |
| Contenido | /api/v1/institution/{institutionSlug}/modules/... y /materials/... |
| Evaluaciones | /api/v1/institution/{institutionSlug}/quizzes/... y /quiz-attempts/... |
| Salud y disponibilidad | /health y /ready, públicos sin tenant |

Aplicar el prefijo a TODOS los controllers y Location relativos; cuerpos y permisos no cambian.
InstitutionSlug se conserva en OpenAPI y firmas de cliente, incluidos enlaces de auditoría/notas.
El endpoint /api/v1/institution/{institutionSlug}/users sigue planificado: no implementarlo ahora.
Rutas antiguas plurales y rutas académicas sin slug no son aliases; responder 404 al no estar registradas.

Ejemplos de consumo:

```text
https://api.dvillasc.me/api/v1/institution/uc/courses
https://api.dvillasc.me/api/v1/institution/utfsm/courses
```

## Resolución central backend

AuthGuard valida JWT y User activo. TenantGuard valida request.params.institutionSlug
con las reglas de slug existentes y adjunta TenantRequest; globales no establecen tenant.
Un prefijo incompleto no debe coincidir con rutas académicas; slug malformado produce 400.
Institución inexistente/inactiva o sin membresía activa: 404; identidad inválida: 401.
Permiso insuficiente sobre un recurso visible: 403; ID ajeno no revela pertenencia ni registros.
withInstitution resuelve UUID/membership una vez y propaga context/client común a la operación.
Servicios y SQL no leen Host/Origin y no reciben institution_id arbitrario de body o query.
El mismo client recorre autorización, curso/sección, contenido, evaluación y auditoría.
Conservar locks write-time y revalidaciones; el contexto inicial no sustituye autorización concurrente.
Adaptar regex de main.ts al prefijo singular sin perder no-store, nosniff ni controles Content-Type.

## CORS

CORS_ALLOWED_ORIGINS es un array JSON de orígenes exactos por entorno.
Producción incluye https://uc.academix.dvillasc.me y https://utfsm.academix.dvillasc.me.
Desarrollo admite explícitamente http://localhost:3000 u otros puertos acordados; sin wildcard.
Una configuración en main.ts antes de guards/body checks:

- Métodos GET, POST, PUT, PATCH, DELETE, OPTIONS.
- Cabeceras Authorization, Content-Type, Idempotency-Key y Accept; exponer Location.
- credentials=false, Bearer; Vary: Origin. No introducir cookies ni sesiones.
- Preflight permitido: 204 sin JWT ni datos institucionales.
- Origin no autorizado no recibe Access-Control-Allow-Origin; no reflejar orígenes arbitrarios.
- Solicitud real conserva validaciones de slug, JWT, pertenencia y permisos.

Sin Origin, curl/servidores siguen sujetos a las mismas reglas; CORS no impide clientes no browser.
Origin UC no autoriza UTFSM: una cuenta exclusiva UC recibe 404 al pedir el path UTFSM.
Si una identidad pertenece a ambas, usar el path UTFSM es válido aunque su cliente parta de UC.

## Cliente y contrato

createApiClient.baseUrl=https://api.dvillasc.me (solo origen); cada operación ya incluye /api/v1.
getCurrentUser(client, institutionSlug) conserva el argumento y usa el prefijo institucional singular.
Cliente browser y server-side llaman al mismo backend con slug explícito; no hay DNS tenant para API.
Regenerar schema.d.ts y actualizar paths/ejemplos/servers en OpenAPI, wrappers y catálogo.
No diseñar navegación o middleware frontend; documentar únicamente este contrato de consumo.
