import assert from "node:assert/strict";
import { test } from "node:test";
import pg from "pg";
import config from "../dist/database/config.js";
import { sanitized, testUrl } from "./integration/helpers.mjs";

test("TLS policy is explicit in pg and rejects unsafe environment overrides", () => {
  const previous={PGSSLMODE:process.env.PGSSLMODE,NODE_TLS_REJECT_UNAUTHORIZED:process.env.NODE_TLS_REJECT_UNAUTHORIZED};
  const DATABASE_URL="postgres://localhost/policy_test";
  try {
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    for(const PGSSLMODE of ["require","verify-ca","verify-full","disable"]) {
      process.env.PGSSLMODE=PGSSLMODE;
      assert.equal(new pg.Client(config.connectionConfig({DATABASE_URL})).connectionParameters.ssl,false);
      const ssl=new pg.Client(config.connectionConfig({DATABASE_URL:DATABASE_URL+"?sslmode=verify-full"})).connectionParameters.ssl;
      assert.ok(ssl && ssl.rejectUnauthorized!==false,"TLS verification disabled");
    }
    process.env.PGSSLMODE="no-verify";
    assert.throws(()=>config.connectionConfig({DATABASE_URL}),{category:"config"});
    delete process.env.PGSSLMODE;
    assert.throws(()=>config.connectionConfig({DATABASE_URL,PGSSLMODE:"no-verify"}),{category:"config"});
    process.env.NODE_TLS_REJECT_UNAUTHORIZED="0";
    assert.throws(()=>config.connectionConfig({DATABASE_URL}),{category:"config"});
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    assert.throws(()=>config.connectionConfig({DATABASE_URL,NODE_TLS_REJECT_UNAUTHORIZED:"0"}),{category:"config"});
  } finally {
    for(const [key,value] of Object.entries(previous)) {
      if(value===undefined) delete process.env[key]; else process.env[key]=value;
    }
  }
});

test("only Render's private Postgres host may skip TLS", () => {
  assert.ok(config.connectionConfig({DATABASE_URL:"postgres://u:p@dpg-d1abc234def567-a/academix"}));
  for(const host of ["dpg-d1abc234def567-a.oregon-postgres.render.com","dpg-d1abc234def567-a.attacker.example","xdpg-d1abc234def567-a"]) {
    assert.throws(()=>config.connectionConfig({DATABASE_URL:`postgres://u:p@${host}/academix`}),{category:"config"});
  }
});

test("sanitization assertions never report the sensitive actual output", () => {
  const TEST_DATABASE_URL=process.env.TEST_DATABASE_URL;
  process.env.TEST_DATABASE_URL="postgres://localhost/report_test";
  const marker="$argon2id$synthetic-sensitive-value";
  try {
    let failure;
    try { sanitized(marker); } catch(error) { failure=error; }
    assert.ok(failure,"sensitive output was accepted");
    assert.ok(!String(failure).includes(marker) && !JSON.stringify(failure).includes(marker),"assertion exposed sensitive output");
  } finally {
    if(TEST_DATABASE_URL===undefined) delete process.env.TEST_DATABASE_URL;
    else process.env.TEST_DATABASE_URL=TEST_DATABASE_URL;
  }
});

test("test guard refuses absent, malformed and non-test destinations before connecting", () => {
  for (const TEST_DATABASE_URL of [undefined, "bad", "postgres://localhost/academix", "postgres://localhost/foo_test?options=-csearch_path=other", "http://localhost/a_test", "postgres://localhost/a_test?host=other", "postgres://localhost/a_test?database=production"]) {
    assert.throws(() => testUrl({ TEST_DATABASE_URL, DATABASE_URL: "postgres://localhost/production" }));
  }
  assert.ok(testUrl({ TEST_DATABASE_URL: "postgres://localhost/isolated_test" }));
});
