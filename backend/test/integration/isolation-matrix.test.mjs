import assert from "node:assert/strict";
import { test } from "node:test";
import { database, http, login, authorized } from "./helpers.mjs";
import { coursesFixture, users } from "./course-fixtures.mjs";

const newCourse = (code = "ISOL") => ({
  code,
  name: "Isolation Course",
  term: "2026-2",
  initialSection: { code: "1", capacity: 20 },
});

test("BE-07 / BE-08: matriz de escenarios de aislamiento institucional UC/UTFSM", async (t) => {
  const pool = await database();
  let app;
  try {
    const f = await coursesFixture(pool);
    app = await http();

    // Actores autenticados
    const adminToken = await login(app, f.env, "MULTI");
    const studentToken = await login(app, f.env, "UC");
    const utfsmToken = await login(app, f.env, "UTFSM");
    const revokedToken = await login(app, f.env, "REVOKED");

    // Configurar roles precisos: 'other' (demo-uc) como estudiante puro en UC
    await pool.query(
      "UPDATE institution_memberships SET is_admin=false, is_super_admin=false WHERE user_id=$1",
      [users.other]
    );
    await pool.query(
      "UPDATE enrollments SET role='student' WHERE user_id=$1 AND section_id=$2",
      [users.other, f.s1]
    );

    const req = async (token, path, options = {}) => {
      const authHeaders = token ? authorized(token).headers : {};
      const { headers = {}, method = "GET", body } = options;
      return fetch(`${app.base}${path}`, {
        method,
        headers: {
          ...authHeaders,
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    };

    // 1. Grupo AUT: Identidad y Autenticación
    await t.test("AUT-01: Anónimo sin header Authorization responde 401", async () => {
      const res = await req(null, "/api/v1/institution/uc/me");
      assert.equal(res.status, 401);
    });

    await t.test("AUT-02: Bearer corrupto o con firma inválida responde 401", async () => {
      const res = await req(null, "/api/v1/institution/uc/me", {
        headers: { Authorization: "Bearer invalido.firma.falsa" },
      });
      assert.equal(res.status, 401);
    });

    await t.test("AUT-03: Usuario inactivo globalmente (users.active=false) es rechazado en login con 401", async () => {
      const res = await req(null, "/api/v1/auth/login", {
        method: "POST",
        body: {
          email: "demo-inactivo@academix.example",
          password: f.env.DEMO_INACTIVE_PASSWORD,
        },
      });
      assert.equal(res.status, 401);
    });

    // 2. Grupo SPO: Spoofing y Manipulación de Headers
    await t.test("SPO-01: Header Host no adultera la institución resuelta desde el path", async () => {
      const res = await req(adminToken, "/api/v1/institution/uc/me", {
        headers: { Host: "utfsm.academix.example" },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.institutionMembership.institution.slug, "uc");
    });

    await t.test("SPO-02: Header X-Institution-Id custom es ignorado en favor del contexto del path", async () => {
      const res = await req(adminToken, "/api/v1/institution/uc/me", {
        headers: { "X-Institution-Id": f.tenants.utfsm },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.institutionMembership.institution.slug, "uc");
    });

    await t.test("SPO-03: Slug malformado con caracteres no permitidos es rechazado con 400", async () => {
      const res = await req(adminToken, "/api/v1/institution/BAD_SLUG!/me");
      assert.equal(res.status, 400);
    });

    // 3. Grupo TEN: Tenancy y Anti-Enumeración
    await t.test("TEN-01: Actor sin membresía en UTFSM recibe 404 estricto (anti-enumeración) al consultar rutas UTFSM", async () => {
      const res = await req(studentToken, "/api/v1/institution/utfsm/courses");
      assert.equal(res.status, 404);
      const resCross = await req(utfsmToken, "/api/v1/institution/uc/courses");
      assert.equal(resCross.status, 404);
    });

    await t.test("TEN-02: Membresía inactiva (active=false) recibe 404 indistinguible en el contexto institucional", async () => {
      const res = await req(revokedToken, "/api/v1/institution/uc/courses");
      assert.equal(res.status, 404);
    });

    await t.test("TEN-03: Usuario multi-tenant consulta UC y obtiene solo cursos UC sin leak", async () => {
      const resUc = await req(adminToken, "/api/v1/institution/uc/courses");
      assert.equal(resUc.status, 200);
      const dataUc = await resUc.json();
      assert.ok(dataUc.items.every((c) => c.institutionId === f.tenants.uc || !c.institutionId));
      assert.ok(dataUc.items.some((c) => c.id === f.own));
      assert.ok(!dataUc.items.some((c) => c.id === f.foreign));
    });

    await t.test("TEN-04: Usuario multi-tenant alterna a UTFSM y obtiene solo cursos UTFSM sin leak", async () => {
      const resUtfsm = await req(adminToken, "/api/v1/institution/utfsm/courses");
      assert.equal(resUtfsm.status, 200);
      const dataUtfsm = await resUtfsm.json();
      assert.ok(dataUtfsm.items.every((c) => c.institutionId === f.tenants.utfsm || !c.institutionId));
      assert.ok(dataUtfsm.items.some((c) => c.id === f.foreign));
      assert.ok(!dataUtfsm.items.some((c) => c.id === f.own));
    });

    // 4. Grupo XTR: Lectura Cruzada
    await t.test("XTR-01: Solicitar ID de curso perteneciente a UTFSM bajo el path de UC responde 404", async () => {
      const res = await req(studentToken, `/api/v1/institution/uc/courses/${f.foreign}`);
      assert.equal(res.status, 404);
    });

    await t.test("XTR-02: Solicitar ID de sección de UTFSM bajo el path de UC responde 404", async () => {
      const res = await req(studentToken, `/api/v1/institution/uc/sections/${f.s4}`);
      assert.equal(res.status, 404);
    });

    await t.test("XTR-03: Invariante de aislamiento: consultas intra-tenant nunca listan recursos ajenos", async () => {
      const res = await req(studentToken, "/api/v1/institution/uc/courses");
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.items.length > 0);
      for (const item of body.items) {
        assert.notEqual(item.id, f.foreign);
      }
    });

    // 5. Grupo XTW: Mutación Cruzada
    await t.test("XTW-01: Payload de creación con institution_id explícito es rechazado con 400", async () => {
      const res = await req(adminToken, "/api/v1/institution/uc/courses", {
        method: "POST",
        body: { ...newCourse("INJ1"), institutionId: f.tenants.utfsm },
      });
      assert.equal(res.status, 400);
    });

    await t.test("XTW-02: Creación de sección bajo ID de curso ajeno responde 404", async () => {
      const res = await req(adminToken, `/api/v1/institution/uc/courses/${f.foreign}/sections`, {
        method: "POST",
        body: { code: "99" },
      });
      assert.equal(res.status, 404);
    });

    await t.test("XTW-03: Matricular usuario perteneciente a otra institución responde 404 por anti-enumeración", async () => {
      const res = await req(adminToken, `/api/v1/institution/uc/sections/${f.s1}/enrollments`, {
        method: "POST",
        body: { userId: users.foreign, role: "student" },
      });
      assert.equal(res.status, 404);
    });

    await t.test("XTW-04: Mutación PATCH de curso foráneo bajo path UC responde 404", async () => {
      const res = await req(adminToken, `/api/v1/institution/uc/courses/${f.foreign}`, {
        method: "PATCH",
        body: { name: "Hijacked course name" },
      });
      assert.equal(res.status, 404);
    });

    // 6. Grupo ROL: Roles Internos Intra-Tenant
    await t.test("ROL-01: Estudiante intentando crear curso en UC recibe 403 Forbidden", async () => {
      const res = await req(studentToken, "/api/v1/institution/uc/courses", {
        method: "POST",
        body: newCourse("STU1"),
      });
      assert.equal(res.status, 403);
    });

    await t.test("ROL-02: Estudiante intentando modificar curso en UC recibe 403 Forbidden", async () => {
      const res = await req(studentToken, `/api/v1/institution/uc/courses/${f.own}`, {
        method: "PATCH",
        body: { name: "Nombre no autorizado" },
      });
      assert.equal(res.status, 403);
    });

    await t.test("ROL-03: Estudiante intentando matricular usuarios recibe 403 Forbidden", async () => {
      const res = await req(studentToken, `/api/v1/institution/uc/sections/${f.s1}/enrollments`, {
        method: "POST",
        body: { userId: users.other, role: "student" },
      });
      assert.equal(res.status, 403);
    });

    await t.test("ROL-04: Estudiante intentando consultar auditoría de curso recibe 403 Forbidden", async () => {
      const res = await req(studentToken, `/api/v1/institution/uc/courses/${f.own}/audit-events`);
      assert.equal(res.status, 403);
    });

    // 7. Grupo AUD: Auditoría
    await t.test("AUD-01: Creador/Profesor de curso puede consultar la auditoría de su curso con 200", async () => {
      const res = await req(adminToken, `/api/v1/institution/uc/courses/${f.own}/audit-events`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.items));
    });

    await t.test("AUD-02: Token UC consultando auditoría en UTFSM responde 404 (ocultamiento estricto)", async () => {
      const res = await req(studentToken, `/api/v1/institution/utfsm/courses/${f.foreign}/audit-events`);
      assert.equal(res.status, 404);
    });
  } finally {
    if (app) await app.close();
    await pool.end();
  }
});

