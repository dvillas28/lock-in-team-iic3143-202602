# Perfiles de fixture por ficha

Todos incluyen BASE salvo ANON/GUARD/STATIC-CATALOG/infra vacía. `+` compone modificadores sin compartir datos entre tests.
Si alias choca (p. ej. ACTIVE y PUBLISHED), construir variantes separadas; no violar la regla de un activo
ni activar otro intento después de publicar Grade. Validar precondiciones antes del primer paso UI.

| Perfil | Preparación exacta / invariantes |
| --- | --- |
| BASE | Actores/entidades del manifest; C1 con S1/S2; lecturas publicadas/no publicadas en quizzes separados |
| WRITE | Cursos/actores nuevos del caso; no congelación inicial; CNEW inexistente; IDs reservados únicos |
| EMPTY | MEMBER sin cursos o CEMPTY con roster sin contenido/intentos/Grade según ficha |
| ACTIVE | A1 QOPEN ST1 inProgress, sin Grade publicada; answers[] o seleccionadas por paso |
| UNPUBLISHED | A1 graded, Grade4.0 publishedAt null, ítemI1 peso30, otros ítems suman70 |
| PUBLISHED | Grade de A1 publicado con pesos completos100, receipt real y freeze; no activo Q1/ST1 |
| PUBLISHABLE | A1 graded ST1/S1 por cada ítem seleccionado; sin activos; pesos100; publishedAt null |
| PUBLISH-INCOMPLETE | ItemsI1/I2 y studentsST1/ST2; falta al menos par I2×ST2; no Grade falsa para completarlo |
| WEIGHTS | COPEN tres ítems publicados sin Grade publicada; pesos0 iniciales; entrada válida33.33/33.33/33.34 |
| FROZEN | Primera Grade publicada por API, freeze real, QD válido creado antes de publicar esa Grade |
| VISIBILITY | Cuatro pares módulo/material flags00/01/10/11; docentes leen todos; ST1/AS1 solo11 |
| LATEST | A1 graded7 no publicado; A2 se crea/termina durante test y puede reemplazar por1 |
| LATEST-ACTIVE | A1 graded4 no publicada; A2 inProgress mismo quiz/student; maxAttempts>=3 |
| LIMIT | QOPEN maxAttempts1, student elegible; otro quiz opcional maxAttempts2 para alcanzar límite |
| LIMIT-NULL | QOPEN maxAttempts null; sin Grade publicada; secuencia cancelled→graded→start permitida |
| WINDOWS | QFUTURE opens T+1día/closesT+2días; QCLOSED opensT-2días/closesT-1día; Q sin límites |
| WINDOW-CROSS | Preparar abreT-5min/cierraT+30s antes de iniciar; terminar guardado antes del cierre; margen y polling DB |
| TERMINAL | Intentos distintos graded/cancelled creados por API; Grade graded sin publicar salvo ficha |
| HISTORY | Eventos y Grades S1/S2; ST1 tiene historial S1 y rol actualS2; incluir null-section administrativos/grade válidos |
| REVOKE | Actor/target único revocable; token emitido antes; operador modifica solo ese namespace en momento explícito |
| REVOKE-ACTIVE | A1 activo de ST1 S1; revocar student luego de iniciar; teacherT1 S1 conserva acceso histórico |
| PAGES | 23 filas válidas por colección objetivo, >=3 fechas iguales para desempateUUID; limit1/20/100; otras secciones/tenant |
| SEARCH | Nombres/email ficticios con Unicode, mayúsculas, %, _, comilla y término común E2E; membership activa |
| MARKDOWN | Texto con script/onerror, javascript/data/relative/credential URL, controles, imagen remota sentinel, tabla/código largos |
| GRADING | Quizzes separados con puntos para0/30/60/80/100%; pesos configurados100 por curso; notas esperadas1/2.5/4/5.5/7 |
| GRADING-ROUND | Puntos1+2, alternativasa/a correctas; estudiantes/quiz separados para1/3 y2/3; pesos100 |
| AVERAGE | ÍtemsQ1/Q2 de mismo curso: Grade4/7, pesos30/70; publicar Q1 y luegoQ2; sin activo |
| ZERO-WEIGHT | Q0Grade4 peso0 y otro ítem peso100 sin publicar; ambos quizzes ya publicados antes del freeze |
| AUTH-NEG | Cuenta válidaST1 y correo inexistente, cuerpos límite UTF-8, sin exceder5 logins por variante/proceso |
| JWT-NEG | Tokens sintéticos firmados solo con secreto efímero del entorno de prueba para exp/iss/aud inválidos; no producción |
| EXPIRY | Login real; reloj cliente controlado para expiresAt; token servidor expirado se valida companion con token efímero |
| RATE | API proceso nuevo exclusivo; contador por IP0, seis requests y recuperación por Retry-After; sin otras autenticaciones |
| TENANT-INACTIVE | Tercer tenant test inactivo o UTFSM inactivo solo en variante exclusiva; no afectar test vecino |
| HOST-UNKNOWN | Frontend sirve origin desconocida.localhost sin entrada en mapa de orígenes |
| DELAY | Interceptor futuro retiene respuesta real mediante barrera runner; libera finalmente, no sleep arbitrario |
| LOST-RESPONSE | route.fetch a API real deja commit, luego aborta/retiene respuesta al navegador; operador confirma commit por ID |
| FAULT | Fallo acotado a request elegido; resto API real; restaurar interceptor en finally; log solo metadata sanitizada |
| MALFORMED | Una respuesta GET alterada deliberadamente a200 inválido; catalogada fallo inyectado UX, no conformidad servidor |
| RACE | Dos contextos autenticados antes de barrera; mismo curso/recurso; SQL esperado según ganador, no orden de scheduler |
| OPERATIONS | Stack/base nueva migrada, credencial operador distinta runtime; operaciones existentes según contrato de misión |
| SEED | Namespace inicial registrado; modoensure repetido; una modificación posterior debe permanecer al replay |
| FAULT-DB | Contenedor/PG exclusivo del caso; detener red/servicio solo propio y restaurar en finally; no matar DB de suite compartida |
| FAULT-TX | Clon exclusivo para fallo conexión/constraint controlado; nunca desactivar trigger para obtener PASS; validar ambos resultados posibles |
| GUARD | Configuración rechazada antes de I/O; inspeccionar que no se abrió conexión ni arrancó migrador; URLs solo cadenas de prueba |
| STATIC-CATALOG | Build a salida temporal propia y servidorloopback8080; rutasrelease/OpenAPI reales; sin API/DB ni credenciales; fixture sinBASEacadémica |

## Reglas de construcción

BASE de lectura puede contener grades históricas preconstruidas, pero tests críticos de cálculo/publicación
crean y avanzan sus propios recursos por API/UI. No usar fixture de Grade ya publicada para probar publish happy.
HISTORY no requiere corromper relaciones: generar intentos S1 antes de revocar, mantener Grade.section_id histórica.
PAGES de libro necesita Grades para23 pares student/section; de audit23 eventos válidos, de users23 memberships;
no basta insertar23 estudiantes sin Grades y esperar filas de libro. Misma fecha no debe perder filas con cursor.
No upsert de recursos terminales; si fixture deja de ser válida, fallar setup con diagnóstico de alias/invariante.
La precisión temporal es ms efectiva; exacto abre/cierra se comprueba adicionalmente en integración SQL con reloj
controlado del escenario, no `waitForTimeout` en navegador. Para WINDOW-CROSS polling al reloj DB cierra barrera
antes de guardar/enviar; si no alcanza margen, clasificar setup inválido y recrear caso, no aceptar resultado aleatorio.
Las precondiciones temporalmente imposibles (mutar fechas de quiz publicado) se evitan creando ventanas antes de publish.
