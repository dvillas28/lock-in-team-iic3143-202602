import assert from "node:assert/strict";
import { test } from "node:test";
import { publicEntry } from "../src/lib/auth/public-entry.ts";
import { hostInstitution, institutionHref, loginDestination } from "../src/lib/auth/navigation.ts";
import { DEFAULT_PORTAL_ORIGIN, portalOrigin } from "../src/lib/auth/portal-origin.ts";

const uc = "https://uc.academix.dvillasc.me";
const utfsm = "https://utfsm.academix.dvillasc.me";
function configure(portal: string | undefined, institutions: string | undefined, check: () => void) {
  const previous = [process.env.NEXT_PUBLIC_PORTAL_ORIGIN, process.env.NEXT_PUBLIC_INSTITUTION_ORIGINS];
  function set(key: string, value?: string) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  set("NEXT_PUBLIC_PORTAL_ORIGIN", portal); set("NEXT_PUBLIC_INSTITUTION_ORIGINS", institutions);
  try { check(); } finally { set("NEXT_PUBLIC_PORTAL_ORIGIN", previous[0]); set("NEXT_PUBLIC_INSTITUTION_ORIGINS", previous[1]); }
}

test("only the exact public portal receives the directory; it never resolves a tenant", () => configure(undefined, undefined, () => {
  assert.deepEqual(publicEntry(), { kind: "pending" });
  const entry = publicEntry(DEFAULT_PORTAL_ORIGIN);
  assert.equal(entry.kind, "portal");
  if (entry.kind !== "portal") assert.fail();
  assert.deepEqual(entry.institutions.map(i => [i.slug, i.href]), [["uc", `${uc}/login`], ["utfsm", `${utfsm}/login`]]);
  assert.equal(hostInstitution(DEFAULT_PORTAL_ORIGIN).valid, false);
  assert.equal(loginDestination(DEFAULT_PORTAL_ORIGIN, "/courses"), undefined);
  assert.equal(institutionHref(DEFAULT_PORTAL_ORIGIN, "uc"), undefined);
  for (const origin of [uc, utfsm]) assert.deepEqual(publicEntry(origin), { kind: "institution" });
  for (const origin of ["https://evil.test", `${DEFAULT_PORTAL_ORIGIN}.evil.test`, `${uc}.evil.test`,
    "https://other.academix.dvillasc.me", `${uc}:444`, `${DEFAULT_PORTAL_ORIGIN}:444`,
    "http://academix-frontend-2ixy.onrender.com", `${DEFAULT_PORTAL_ORIGIN}/`, `${DEFAULT_PORTAL_ORIGIN}?next=${uc}`,
    "https://academix-frontend-2ixy.onrender.com@evil.test", "http://localhost:3000"]) {
    assert.deepEqual(publicEntry(origin), { kind: "blocked" }, origin);
    assert.equal(hostInstitution(origin).valid, false);
  }
}));

test("present invalid portal configuration has no fallback or effect on institutional permission", () => {
  for (const value of ["", "bad", "null", "http://remote.test", "ftp://example.test", `${DEFAULT_PORTAL_ORIGIN}/`,
    `${DEFAULT_PORTAL_ORIGIN}:443`, "https://PORTAL.test", "https://u:p@portal.test", "https://portal.test?x", "https://portal.test#x"]) {
    configure(value, undefined, () => {
      assert.equal(portalOrigin(), undefined, value);
      assert.deepEqual(publicEntry(DEFAULT_PORTAL_ORIGIN), { kind: "blocked" });
      assert.equal(hostInstitution(uc).valid, true);
    });
  }
});

test("institutional config invalid, ambiguous, colliding or incomplete cannot generate directory links", () => {
  for (const value of ["", "bad", "null", "[]", "{}", '{"https://a.test":"UC"}',
    JSON.stringify({ [uc]: "uc" }), JSON.stringify({ [uc]: "uc", [utfsm]: "uc" }),
    ...[DEFAULT_PORTAL_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000", `${uc}/`,
      "https://u:p@uc.test", "http://uc.test", "javascript:alert(1)"].map(origin => JSON.stringify({ [origin]: "uc", [utfsm]: "utfsm" }))]) {
    configure(undefined, value, () => {
      assert.deepEqual(publicEntry(DEFAULT_PORTAL_ORIGIN), { kind: "blocked" }, value);
      assert.equal(hostInstitution(DEFAULT_PORTAL_ORIGIN).valid, false);
    });
  }
  // A portal origin colliding with even the default institutional table denies both uses.
  configure(uc, undefined, () => {
    assert.equal(hostInstitution(uc).valid, false);
    assert.deepEqual(publicEntry(uc), { kind: "blocked" });
  });
});

test("explicit local portal uses validated local logins; bare localhost can never acquire tenant", () => {
  const origins = JSON.stringify({ "http://uc.localhost:3000": "uc", "http://utfsm.localhost:3000": "utfsm" });
  configure("http://localhost:3000", origins, () => {
    const entry = publicEntry("http://localhost:3000");
    assert.equal(entry.kind, "portal"); if (entry.kind !== "portal") assert.fail();
    assert.deepEqual(entry.institutions.map(i => i.href), ["http://uc.localhost:3000/login", "http://utfsm.localhost:3000/login"]);
    assert.equal(hostInstitution("http://localhost:3000").valid, false);
    assert.deepEqual(publicEntry(DEFAULT_PORTAL_ORIGIN), { kind: "blocked" });
    for (const slug of ["uc", "utfsm"]) {
      assert.deepEqual(publicEntry(`http://${slug}.localhost:3000`), { kind: "institution" });
      assert.deepEqual(publicEntry(`http://${slug}.localhost:3001`), { kind: "blocked" });
    }
    for (const origin of ["http://localhost:3001", "http://other.localhost:3000", "http://127.0.0.1:3000"])
      assert.deepEqual(publicEntry(origin), { kind: "blocked" });
  });
});
