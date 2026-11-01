# Guía del Test Harness de Aislamiento UC/UTFSM

**Tareas**: BE-07 y BE-08. **Área**: Backend / Testing.
**Referencia de diseño**: [Matriz de Escenarios](isolation-test-matrix.md).

## 1. Enfoque de Pruebas

* El aislamiento multi-tenant y la autorización contextual **no se prueban con mocks de base de datos**.
* El SUT (*System Under Test*) integra la aplicación NestJS real, middleware de contexto, `DatabaseService` y PostgreSQL con `academix_runtime` y RLS activada.
* Se validan comportamientos y fronteras de seguridad HTTP (`401`, `403`, `404`), evitando el *over-specification* de consultas internas.

## 2. Helpers y Utilidades del Harness (`helpers.mjs`)

Los tests de aislamiento se construyen sobre las herramientas existentes en `backend/test/integration/`:

| Helper / Módulo | Propósito en los Tests de Aislamiento |
| :--- | :--- |
| `database()` | Cliente administrador de PostgreSQL (rol owner) para poblar fixtures y verificar estado final. |
| `runtimeUrl()` | Conexión con el rol restringido `academix_runtime` (sin bypass RLS) para simular el tráfico HTTP. |
| `http()` | Levanta la aplicación backend en un puerto efímero aislado con readiness validado. |
| `login(app, env, role)` | Autentica un usuario del demo manifest (`UC`, `UTFSM`, `MULTI`) y devuelve su JWT firmado. |
| `authorized(token)` | Genera cabeceras `Authorization: Bearer <token>` estándar. |
| `coursesFixture(admin)` | Crea cursos y secciones paralelos en UC y UTFSM con IDs rastreables (`f.tenants.uc`, `f.foreign`). |

## 3. Implementación Parametrizada (`test.each`)

Para implementar la matriz de forma mantenible y compacta, se utiliza el patrón de pruebas parametrizadas (*Table-Driven Testing*):

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { http, database, coursesFixture, login, authorized } from "./helpers.mjs";

test("BE-07 / BE-08: matriz de aislamiento institucional", async (t) => {
  const admin = await database();
  const app = await http();
  const f = await coursesFixture(admin);

  const tokenUC = await login(app, f.env, "UC");
  const tokenUTFSM = await login(app, f.env, "UTFSM");

  const matrix = [
    { id: "AUT-01", path: "/api/v1/institution/uc/me", headers: {}, expected: 401 },
    { id: "TEN-01", path: "/api/v1/institution/utfsm/courses", headers: authorized(tokenUC).headers, expected: 404 },
    { id: "XTR-01", path: `/api/v1/institution/uc/courses/${f.foreign}`, headers: authorized(tokenUC).headers, expected: 404 },
    { id: "TEN-03", path: "/api/v1/institution/uc/courses", headers: authorized(tokenUC).headers, expected: 200 },
  ];

  for (const scenario of matrix) {
    await t.test(`${scenario.id} -> ${scenario.expected}`, async () => {
      const res = await fetch(`${app.base}${scenario.path}`, { headers: scenario.headers });
      assert.equal(res.status, scenario.expected, `Fallo en escenario ${scenario.id}`);
    });
  }

  await app.close();
  await admin.end();
});
```

## 4. Criterios de Aceptación para BE-07 y BE-08

* **BE-07 (Harness Base)**:
  * Provee aserciones unificadas para `assertStatus(res, 401|403|404)`.
  * Previene fugas de conexión destruyendo el cliente tras errores o rollbacks forzados.
  * Valida que respuestas `404` ante tenants ajenos no incluyan cabeceras ni payloads que revelen existencia.
* **BE-08 (Tests de CU-01 y CU-02)**:
  * Ejecuta los grupos `AUT`, `SPO`, `TEN`, `XTR` y `XTW` de la [Matriz de Escenarios](isolation-test-matrix.md).
  * Check verde obligatorio en el workflow de CI (`CI-08`).

