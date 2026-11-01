# Funcionalidades NETWORK

Evidencia: [session.ts](../../../../frontend/src/lib/auth/session.ts); [errors.ts](../../../../frontend/src/lib/api/errors.ts); [use-mutation.ts](../../../../frontend/src/components/courses/use-mutation.ts); [problem.filter.ts](../../../../backend/src/http/problem.filter.ts).
Permisos comunes: Mismos permisos del recurso; error/red nunca concede un rol ni confirma escritura.
Estados: loading/error/retry/uncertain/confirmed; escritura incierta bloquea reenvío automático.

## FL-NETWORK-01 — Errores de lectura y revalidación de acceso
- Requisito: CU-02–16; RF25; RNF2/9; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses; /courses/{C1}/...`.
- Endpoints/operaciones: getCurrentUser; listCourses; getStudentGrades; getCourseGradebook; resolver path/método en [API](../API.md).
- Roles: Mismos permisos del recurso; error/red nunca concede un rol ni confirma escritura.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, BASE+DELAY, BASE+FAULT, BASE+MALFORMED, WRITE+FAULT; [definiciones](../../E2E_TEST_DATA.md).
- Estados: loading/error/retry/uncertain/confirmed; escritura incierta bloquea reenvío automático.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [NETWORK](../../catalog/NETWORK.md); cada ficha precisa pasos y persistencia.

## FL-NETWORK-02 — Errores transversales y operaciones inciertas
- Requisito: CU-04–15; RF25/26; RNF3/9; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `formularios académicos existentes`.
- Endpoints/operaciones: operaciones de escritura según inventario; resolver path/método en [API](../API.md).
- Roles: Mismos permisos del recurso; error/red nunca concede un rol ni confirma escritura.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE+FAULT, WRITE, WRITE+LOST-RESPONSE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: loading/error/retry/uncertain/confirmed; escritura incierta bloquea reenvío automático.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [NETWORK](../../catalog/NETWORK.md); cada ficha precisa pasos y persistencia.
