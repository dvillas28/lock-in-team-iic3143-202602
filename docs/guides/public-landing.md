# Landing pública y entrada por dominio

Cambio de producto: 2026-10-25. Rama: `feat/landing-acceso-por-dominio`.
La [ADR](../adr/frontend-domain-routing.md#entrada-pública-por-dominio--2026-10-25)
amplía FR-009 y agrega FR-021 de la [spec de acceso](../../specs/20261021-141348_frontend-acceso-multitenant/spec.md).
Trazabilidad: CU-01/02, RF1–9/25, RNF1–4/7/9, FE-01–04/20; referencia visual: mockup 01.

## Comportamiento

| Origin exacto | `/` | `/login` y rutas privadas |
| --- | --- | --- |
| `https://academix-frontend-2ixy.onrender.com` | Landing pública | Rechazo sin formulario/login/contexto |
| `https://uc.academix.dvillasc.me` | Replace a `/login` | Acceso institucional UC existente |
| `https://utfsm.academix.dvillasc.me` | Replace a `/login` | Acceso institucional UTFSM existente |
| Desconocido, esquema/puerto distinto | Rechazo | Rechazo sin tenant por defecto |

El servidor entrega un estado neutro; cliente resuelve `window.location.origin`
mediante SessionProvider, sin destellos de landing o credenciales en otro dominio.
HTTP 200 en `/` permite el healthcheck de Render aun sin JavaScript o backend.
Sin JavaScript se mantiene el estado neutro; no hay login ni directorio de fallback.

La landing incluye presentación, seis funciones reales y dos enlaces de documento
completo a los login institucionales. No usa prefetch privado, `/institutions`,
`/me` ni `/health`. Query params no pueden elegir destinos.
El listado no acredita pertenencia ni concede roles. La API conserva JWT, memberships
y RLS como autoridad; sesiones independientes, solo en memoria, sin SSO.
`/institutions` continúa redirigiendo a `/courses`, sin selector autenticado.
No cambia historial/auditoría de registros académicos.

La redacción pública usa lenguaje cotidiano: «Elige tu universidad», «Ingresar a
UC/UTFSM» y «evaluaciones». Las acciones no dependen de flechas; las explicaciones
de dominios, sesiones y permisos quedan en documentación técnica. La ayuda visible
solo aclara que se necesita una cuenta con acceso a la universidad elegida.

Login y rutas privadas en direcciones no habilitadas muestran «Elige tu universidad
para continuar», sin hosts locales ni instrucciones de desarrollo, en todos los entornos.
El botón «Elegir universidad» abre el portal público validado en `/#instituciones`.
Si la configuración del portal o sus destinos es inválida, no se ofrece ese enlace.
Tampoco se ofrece selección institucional dentro de una sesión autenticada.
No hay redirección automática, formulario, selección de tenant ni consultas privadas.
Las instrucciones para desarrolladores permanecen en esta guía y `.env.example`;
no se usa `NODE_ENV` para exponerlas en la interfaz.

## Configuración al construir

- `NEXT_PUBLIC_PORTAL_ORIGIN`: único origin del portal, separado de instituciones.
  Ausente usa Render; presente vacío/inválido bloquea portal, sin fallback.
- `NEXT_PUBLIC_INSTITUTION_ORIGINS`: tabla exacta existente, defaults UC/UTFSM HTTPS.
  Inválida bloquea instituciones y directorio. La landing exige ambos slugs.
- Colisión portal/institución invalida la tabla. Render y loopback desnudo no pueden
  adquirir tenant. Origins deben ser canónicos, sin path/query/hash/credenciales.
- HTTPS obligatorio salvo HTTP local explícito; esquema y puerto se comparan exactos.
- Dockerfile declara ambos build args; Render Blueprint agrega solo el portal.
  Compose exige ambos valores explícitos. Cambiarlos requiere reconstrucción.
- No añadir Render/portal a `CORS_ALLOWED_ORIGINS` ni a la tabla institucional.

Local, desde `frontend/` (Next no carga automáticamente el `.env` de la raíz):

```bash
NEXT_PUBLIC_PORTAL_ORIGIN=http://localhost:3000 \
NEXT_PUBLIC_INSTITUTION_ORIGINS='{"http://uc.localhost:3000":"uc","http://utfsm.localhost:3000":"utfsm"}' \
NEXT_PUBLIC_API_URL=http://localhost:3001 pnpm dev
```

Abrir `http://localhost:3000/` para el directorio y ambos subdominios para login.
Localhost nunca obtiene tenant. `.env.example` contiene la configuración equivalente
para Compose; rebuild con `docker compose up --build` tras configurar sus secretos.

## Validación local

Pruebas DOM/hidratación: landing exclusiva, enlaces UC/UTFSM, cero fetch con backend
caído, replace institucional, bloqueo portal login/privadas, orígenes adversariales
y configuración local. Pruebas de resolver: configuración inválida, colisiones,
puertos, esquema, destinos incompletos y ausencia de fallback.
La suite existente verifica sesión, logout/expiración, respuestas tardías, retornos
seguros y aislamiento. Los estilos reutilizan tokens/cards/botones/foco/reduced motion
canónicos, con Garamond, Inter y Lucide. El tema se mantiene solo en el documento.

Resultados de la implementación inicial (2026-10-25):

- `api:check`, `typecheck`, `lint`, `test:coverage` y `build`: PASS.
  286 pruebas; cobertura 92,74 % líneas / 86,97 % ramas, umbrales existentes intactos.
- Build optimizado con API apuntando a `http://127.0.0.1:1` (sin servicio): PASS.
- Navegador local, escritorio 1280×720 y móvil 375×812: hero, funciones y directorio
  legibles en ambos temas, sin desbordamiento horizontal. Garamond e Inter cargadas.
- Teclado: skip link enfoca main; Tab/Enter alcanzan CTA, tema, UC y UTFSM;
  foco visible de 2 px. Enlaces y ambas raíces llevan al login correcto.
- Portal `/login` sin inputs y `/courses` con rechazo; consola sin errores.
  Contraste de texto calculado sobre estilos: mínimo 5,27:1 claro / 5,03:1 oscuro.
  Reduced motion conserva la regla canónica, sin animaciones nuevas.
- `docker compose config`: PASS con ambos build args y CORS solo institucional.
  Fixture del smoke de Compose actualizado; sintaxis comprobada, sin ejecutar stack.
- Revisión `lms-reviewer`: sin hallazgos de aislamiento, autorización o regresión
  en el cambio. Longitud documental y `git diff --check`: PASS.

Revisión posterior de redacción: 48 pruebas de acceso/directorio, lint y tipos PASS.
Se simplificaron todos los textos y se retiraron las flechas de los accesos.
Sin cambios al enrutamiento ni reinicios de los servicios Docker del usuario.

Revisión de avisos de acceso: 288 pruebas, cobertura (92,77 % líneas / 86,96 % ramas),
lint, tipos, contrato API y build PASS. `lms-reviewer`: recuperación pública validada,
sin credenciales, consultas privadas, redirecciones automáticas ni cambios de permisos.

## Pendientes públicos

No se desplegó ni cambió DNS. Tras integrar, reconstruir frontend en Render con
`NEXT_PUBLIC_PORTAL_ORIGIN=https://academix-frontend-2ixy.onrender.com`; conservar
origins institucionales y CORS UC/UTFSM. Validar los tres dominios HTTPS, enlaces,
redirect cliente y rechazo portal login/privadas en el despliegue resultante.
Las pruebas locales no certifican producción ni reemplazan CI.
