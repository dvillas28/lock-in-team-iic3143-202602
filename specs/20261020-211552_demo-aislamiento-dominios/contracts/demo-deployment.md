# Demo & Deployment Contract

## Variables y comandos previstos

| Variable | Uso |
| --- | --- |
| DATABASE_URL | Conexión runtime sin bypass; también permite validar credencial provisionada |
| MIGRATION_DATABASE_URL | Conexión privilegiada solo para comandos operativos |
| DEMO_DATA_ENABLED | true/false exactos; ausente=false; carga automática opt-in |
| DEMO_ADOPT_LEGACY | true solo para adopción inicial explícita del seed UC/UTFSM reconocido |
| DEMO_OPERATOR_REF | Identificador técnico no secreto, obligatorio al aplicar |
| DEMO_UC_SUPERADMIN_PASSWORD | Secreto inicial UC; solo si esa identidad falta |
| DEMO_UC_ADMIN_PASSWORD / DEMO_UC_TEACHER_PASSWORD | Miembros UC iniciales |
| DEMO_UC_ASSISTANT_PASSWORD / DEMO_UC_STUDENT_PASSWORD | Miembros UC iniciales |
| DEMO_UTFSM_*_PASSWORD | Mismos cinco sufijos para UTFSM |
| API base | https://api.dvillasc.me; contexto por path, sin mapa host→tenant |
| CORS_ALLOWED_ORIGINS | Array JSON: frontend UC/UTFSM HTTPS; desarrollo local explícito |
| AUTH_JWT_SECRET | Se conserva el secreto actual, sin rotación implícita |

No guardar passwords en manifiesto, argumentos, código, logs, CI artifacts ni documentación.
Contraseñas iniciales de 8–30 caracteres Unicode; hash Argon2id existente.

Comando único previsto de predeploy: node dist/commands/predeploy.js.
Orden: validar config → migrate → provision-runtime → demo si enabled → validar conexión runtime.
Si demo está disabled, no exigir sus secretos ni DEMO_OPERATOR_REF.
Preservar db:migrate y db:seed manuales, pero usando credencial operativa explícita.
La primera provisión de contraseña runtime es idempotente; replay verifica, no rota secretos.

## Carga v1

1. Validar manifiesto, operador y configuración antes de cualquier alta.
2. BEGIN operativo; advisory lock único del dataset; buscar demo_data_runs v1.
3. Marker compatible: validar IDs preservados y devolver alreadyApplied antes de exigir secretos iniciales.
4. Sin marker: comprobar colisiones y obtener locks en orden existente. Validar secretos solo de usuarios faltantes.
5. Instituciones nuevas: crear con IDs estables. Existentes: solo adopción legacy explícita, sin alterar nombre/estado.
6. Crear users/memberships faltantes del manifiesto, con ambos flags solo en sus superadmins nuevos.
7. Crear evidencia membership.demoProvisioned por alta efectiva y marker con fingerprint sin secretos; COMMIT.
8. Cualquier error: ROLLBACK, salida sanitizada y exit no cero; no confirmar marker parcial.

Adopción legacy acepta únicamente UC/UTFSM compatibles con slug/nombre del seed conocido,
identidades legacy reconocibles por UUID/email y sin conflicto del manifiesto nuevo.
No convertir sus cuentas anteriores en superadmins, ni restaurar instituciones inactivas.
Tenant no reconocido o previamente administrado requiere revisión operativa; no adoptar por similitud de slug.
La ejecución completa cubre ambas instituciones en una sola transacción.
Datos extra preexistentes se conservan: 2/10/10 es el total solo en base inicialmente vacía.
Repetir no recrea entidades eliminadas ni restaura flags; conflicto exige operación explícita posterior.
Reutilizar evidence/fingerprint/Argon2/AuditService; no invocar onboardInstitution dos veces como orquestador.

## Railway y CI/CD

El merge main sigue generando release/APP_VERSION y Railway espera CI; no cambiar nomenclatura.
Configurar api.dvillasc.me como custom domain del backend Railway, puerto 3001.
Los hosts uc.academix.dvillasc.me y utfsm.academix.dvillasc.me pertenecen al frontend.
Cargar en DNS los CNAME/TXT que Railway entregue para API y esperar su certificado TLS.
Los dominios frontend se configuran en su servicio; backend solo requiere sus orígenes CORS.
No trasladar el dominio de frontend al servicio backend ni resolver tenant por cabecera reenviada.

Alinear configuración efectiva del servicio con backend/railway.json: Dockerfile,
predeploy nuevo, /ready y watchPatterns. El entorno actual no lee automáticamente el fichero;
no suponer que cambiarlo en Git basta. Usar settings/API o IaC soportada sin migración de plataforma.
Suministrar DATABASE_URL runtime y MIGRATION_DATABASE_URL operativa al lifecycle del servicio.
Docker/start elimina MIGRATION_DATABASE_URL y passwords demo antes de ejecutar el proceso HTTP.
Railway entrega variables a predeploy y runtime; esta medida no aísla un contenedor comprometido.
Nunca añadir un pool migrador al proceso HTTP ni usar fallback privilegiado al fallar runtime.

CI corre esquema, provisión y la misma carga tres veces en DB _test y verifica cardinalidad/revocados.
Credenciales efímeras de CI; pruebas seriales de fixtures comparten solo esa base descartable.
GitHub Actions no ejecuta adicionalmente una carga remota de producción; predeploy es el único dueño.
Incluir cambios operativos en backend para que watchPatterns disparen deploy al modificar el manifiesto.

## Verificación y rollback

/health: versión y commit; /ready: esquema, rol efectivo y RLS; ambos paths institucionales pasan y aíslan datos.
Smoke autenticado por institución usa cuentas manifest y no imprime tokens/passwords; ver quickstart.
Operador inyecta sus diez DEMO_*_PASSWORD vigentes en el proceso de smoke, no en el HTTP runtime.
Replay de migración no necesita passwords existentes; login del smoke sí necesita los vigentes.
SMOKE_ALLOWED_ORIGIN se suministra como uno de los orígenes frontend configurados; el negativo usa https://cors-denied.invalid.
El smoke incluye OPTIONS permitido/denegado y solicitud real; prueba ambos paths y los dos Origin frontend, no solo /health.
Por defecto verifica lectura/login/me/CORS; --workflow habilita explícitamente altas académicas y delegación vía API.
El modo workflow registra esas mutaciones como tales; no altera secretos ni recupera privilegios por replay.
Las cuentas pueden tener roles revocados: smoke no debe volver a concederlos silenciosamente.
No bajar a una imagen antigua que desconoce RLS o usa conexión privilegiada; corregir hacia delante
o coordinar reversión de código/credenciales/políticas en ventana controlada sin borrar datos.
Deshabilitar demo tras bootstrap es válido; replay no es una herramienta de recuperación.

## Deuda conocida

No hay altas generales de personas/pertenencias por API. Resolver después en otra misión:
actor autorizado, identidad existente/nueva, vinculación institucional, auditoría y credenciales.
La presente carga es un artefacto operativo de demo, no un administrador general de usuarios.
