import assert from "node:assert/strict";
import { test } from "node:test";
import { database, fixture, http, login, sanitized } from "./helpers.mjs";

// Run the exact frontend Session/openapi-fetch boundary against HTTP + PostgreSQL.
import { Session } from "../../../frontend/src/lib/auth/session.ts";

test("browser session contract: real login, UC/UTFSM isolation, live revocation and logout", async () => {
  const pool = await database(); let app;
  const sessions = [];
  const tokens = [];
  try {
    const env = await fixture(pool); app = await http();
    for (const [account, slugs] of [["UC",["uc"]],["UTFSM",["utfsm"]],["MULTI",["uc","utfsm"]],["REVOKED",[]]]) {
      const session = new Session({baseUrl:app.base}); sessions.push(session);
      const email = `demo-${account.toLowerCase().replace("revoked","revocado")}@academix.example`;
      assert.equal(await session.login(` ${email.toUpperCase()} `,env[`DEMO_${account}_PASSWORD`]),true);
      assert.deepEqual(session.getSnapshot().institutions.map(i=>i.slug),slugs);
      for (const slug of ["uc","utfsm"]) {
        await session.loadContext(slug);
        const context = session.getSnapshot().context;
        assert.equal(Boolean(context.user),slugs.includes(slug));
        if (slugs.includes(slug)) assert.equal(context.user.institutionMembership.institution.slug,slug);
        else assert.equal(context.error.title,"Recurso no disponible");
      }
      if (account === "MULTI") {
        await pool.query("UPDATE institution_memberships SET active=false WHERE user_id='10000000-0000-4000-8000-000000000003' AND institution_id=(SELECT id FROM institutions WHERE slug='uc')");
        await session.loadContext("uc");
        assert.equal(session.getSnapshot().context.user,undefined);
        assert.equal(session.getSnapshot().context.error.title,"Recurso no disponible");
        await session.loadContext("utfsm"); assert.ok(session.getSnapshot().context.user);
      }
      session.logout();
      assert.equal(session.getSnapshot().context,undefined);
      assert.equal(session.getSnapshot().institutions,undefined);
      await assert.rejects(session.request(client=>client.GET("/api/v1/institutions")));
    }
    const origin="https://uc.academix.dvillasc.me";
    await app.close();
    app=await http({NODE_ENV:"production",CORS_ALLOWED_ORIGINS:JSON.stringify([origin,"https://utfsm.academix.dvillasc.me"])});
    for (const candidate of [origin,"https://utfsm.academix.dvillasc.me","https://evil.test"]) {
      const allowed=candidate!=="https://evil.test";
      for (const [path,method,headers] of [["/api/v1/auth/login","POST","content-type"],["/api/v1/institution/uc/me","GET","authorization"]]) {
        const preflight=await fetch(app.base+path,{method:"OPTIONS",headers:{Origin:candidate,"Access-Control-Request-Method":method,"Access-Control-Request-Headers":headers}});
        assert.equal(preflight.status,204);
        assert.equal(preflight.headers.get("access-control-allow-origin"),allowed?candidate:null);
        assert.equal(preflight.headers.has("access-control-allow-credentials"),false);
        assert.match(preflight.headers.get("vary"),/Origin/);
        assert.equal(await preflight.text(),"");
      }
      const response=await fetch(app.base+"/api/v1/institution/uc/me",{headers:{Origin:candidate,"x-tenant":"uc","X-Forwarded-Host":"uc.academix.dvillasc.me"}});
      assert.equal(response.status,401);
      assert.equal(response.headers.get("access-control-allow-origin"),allowed?candidate:null);
      assert.match(response.headers.get("access-control-expose-headers"),/Location.*Retry-After/);
    }
    // PR #123: browser origin and spoofed host/tenant headers never grant membership.
    // MULTI lost its UC membership above: a new login must preserve that revocation.
    for (const [account,slugs] of [["UC",["uc"]],["UTFSM",["utfsm"]],["MULTI",["utfsm"]]]) {
      const token=await login(app,env,account);tokens.push(token);
      for (const candidate of [undefined,origin,"https://utfsm.academix.dvillasc.me","https://evil.test"]) {
        for (const slug of ["uc","utfsm"]) {
          const headers={Authorization:`Bearer ${token}`,Host:"another.invalid","X-Forwarded-Host":"another.invalid","x-tenant":slug==="uc"?"utfsm":"uc"};
          if(candidate)headers.Origin=candidate;
          const response=await fetch(`${app.base}/api/v1/institution/${slug}/me`,{headers});
          assert.equal(response.status,slugs.includes(slug)?200:404);
          assert.equal(response.headers.get("access-control-allow-origin"),candidate && candidate!=="https://evil.test"?candidate:null);
          if(response.ok)assert.equal((await response.json()).institutionMembership.institution.slug,slug);
          else assert.equal((await response.json()).status,404);
        }
      }
    }
  } finally { sessions.forEach(s=>s.logout()); if(app)sanitized((await app.close()).output,tokens); await pool.end(); }
});
