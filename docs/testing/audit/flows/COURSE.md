# Funcionalidades COURSE

Evidencia: [courses.service.ts](../../../../backend/src/courses/courses.service.ts); [course-directory.tsx](../../../../frontend/src/components/courses/course-directory.tsx); [course-form.tsx](../../../../frontend/src/components/courses/course-form.tsx).
Permisos comunes: Crear isAdmin; editar owner=isAdmin+createdBy actor; leer owner o Enrollment activo del curso.
Estados: Creado con sección/teacher; metadatos editables por owner; sin lifecycle archived/delete implementado.

## FL-COURSE-01 — Dashboard académico y cursos visibles
- Requisito: CU-03; RF12/25; RNF1/2; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses; /courses/{C1}`.
- Endpoints/operaciones: listCourses; getCourse; listSections; resolver path/método en [API](../API.md).
- Roles: Crear isAdmin; editar owner=isAdmin+createdBy actor; leer owner o Enrollment activo del curso.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: BASE, BASE+FAULT, EMPTY, REVOKE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Creado con sección/teacher; metadatos editables por owner; sin lifecycle archived/delete implementado.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [COURSE](../../catalog/COURSE.md); cada ficha precisa pasos y persistencia.

## FL-COURSE-02 — Creación atómica y configuración del curso
- Requisito: CU-03/04; RF12/26; RNF3/4; [fuente](../../../deliveries/2/03-use-cases-and-requirements.md).
- Ruta frontend: `/courses; /courses/{CNEW}`.
- Endpoints/operaciones: createCourse; updateCourse; resolver path/método en [API](../API.md).
- Roles: Crear isAdmin; editar owner=isAdmin+createdBy actor; leer owner o Enrollment activo del curso.
- Precondiciones: entorno efímero listo, BASE válida, actor activo con scope de la ficha; sin sesión para públicos.
- Datos: WRITE, WRITE+LOST-RESPONSE; [definiciones](../../E2E_TEST_DATA.md).
- Estados: Creado con sección/teacher; metadatos editables por owner; sin lifecycle archived/delete implementado.
- Dependencias: identidad/contexto para privados; curso/sección según manifest; mutaciones y audit dentro de la misma transacción.
- Clasificación: integrada estáticamente; sin nueva ejecución runtime. API sin pantalla propia se identifica en cada ficha H/O.
- Casos: [COURSE](../../catalog/COURSE.md); cada ficha precisa pasos y persistencia.
