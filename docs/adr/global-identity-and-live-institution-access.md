# Identidad global JWT y autorización institucional vigente

Fecha: 2026-10-15. Estado: aceptado como diseño; implementación pendiente.
Plan: [identidad-acceso](../../specs/20261014-234744_identidad-acceso/plan.md).

## Contexto

AcademiX tiene usuarios globales y pertenencias institucionales persistidas.
La base almacena hashes Argon2id pero todavía permite emails normalizados
repetidos. El contrato usa JWT Bearer y contexto institucional por slug.
Una sesión no debe conservar permisos después de revocar una pertenencia.

## Decisión

Login demo con email normalizado lower(btrim(email)), garantizado por un índice
único nuevo. No modificar automáticamente usuarios existentes en caso de colisión.
Verificar Argon2id existente y emitir HS256 por 900 segundos, issuer academix-api,
audience academix-clients, sub UUID. @nestjs/jwt evita criptografía propia.
Secreto base64 aleatorio de ≥32 bytes obligatorio; sin default, refresh ni SSO.

Guard global valida firma/claims y User activo; solo login y sondas son públicos.
Cada lectura institucional consulta User, InstitutionMembership e Institution
activas en PostgreSQL. No codificar tenant/roles en el JWT ni cachearlos.
Contexto invisible → 404, identidad inválida → 401; 403 queda reservado a acciones
prohibidas sobre recursos visibles. Sin cursos, sectionMemberships está vacío.
El slug HTTP conserva el patrón persistido, incluidos guiones consecutivos, sin renombrar instituciones.
No inferir administración del curso desde identidad global o parámetros de URL.

Limitar login con @nestjs/throttler: cinco solicitudes por IP/60000 ms, memoria
local y una instancia demo. Ignorar X-Forwarded-For con trust proxy deshabilitado.
El proxy puede compartir cuota y reiniciar restablece contadores; validar y
revisar esta política antes de uso público o múltiples instancias.

## Alternativas y consecuencias

Passport no aporta estrategias adicionales para este login demo. Sesiones
persistidas, Redis y proveedores externos agregan infraestructura sin necesidad
actual. JWT largo o con roles congelados impide revocación institucional inmediata.

El usuario repite login cada 15 minutos. Rotar secreto invalida todos los tokens.
Caída de DB impide autorizar (503); no usar permisos anteriores como fallback.
No se crean escrituras académicas, endpoints de revocación ni historial de roles.
Su gestión productiva debe diseñar auditoría en la misión correspondiente.
Fuentes y límites verificables: [research](../../specs/20261014-234744_identidad-acceso/research.md).
