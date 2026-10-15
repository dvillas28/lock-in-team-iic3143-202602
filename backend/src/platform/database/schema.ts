import type { Pool, PoolClient } from "pg";
import { OperationError } from "./config";

const columns = {
  institutions: { id: "uuid", slug: "character varying(63)", name: "character varying(200)", active: "boolean", created_at: "timestamp(6) with time zone", updated_at: "timestamp(6) with time zone" },
  users: { id: "uuid", email: "character varying(254)", password_hash: "character varying(255)", name: "character varying(200)", active: "boolean", created_at: "timestamp(6) with time zone", updated_at: "timestamp(6) with time zone" },
  institution_memberships: { id: "uuid", institution_id: "uuid", user_id: "uuid", active: "boolean", created_at: "timestamp(6) with time zone", updated_at: "timestamp(6) with time zone" },
};
const checks: Record<string, string[]> = {
  institutions: ["CHECK ((length(btrim((name)::text)) > 0))", "CHECK (((slug)::text ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'::text))"],
  users: ["CHECK ((length(btrim((email)::text)) > 0))", "CHECK ((length(btrim((name)::text)) > 0))", String.raw`CHECK (((password_hash)::text ~ '^\$argon2id\$v=19\$m=[0-9]+,(t=[0-9]+,p=[0-9]+|p=[0-9]+,t=[0-9]+)\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'::text))`],
  institution_memberships: [],
};
const keys: Record<string, string[]> = {
  institutions: ["PRIMARY KEY (id)", "UNIQUE (slug)"],
  users: ["PRIMARY KEY (id)"],
  institution_memberships: ["PRIMARY KEY (id)", "UNIQUE (institution_id, user_id)", "UNIQUE (institution_id, id)", "FOREIGN KEY (institution_id) REFERENCES institutions(id) ON UPDATE RESTRICT ON DELETE RESTRICT", "FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT"],
};

export async function assertSchema(db: Pool | PoolClient) {
  // One catalog query keeps the readiness budget bounded even when the DB stalls.
  const { rows } = await db.query(`SELECT c.relname AS table_name,
    (SELECT jsonb_object_agg(a.attname, jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'required',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)))
      FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped) AS columns,
    (SELECT jsonb_agg(pg_get_constraintdef(k.oid)) FROM pg_constraint k WHERE k.conrelid=c.oid AND k.convalidated) AS keys,
    (SELECT jsonb_agg(pg_get_indexdef(i.indexrelid)) FROM pg_index i WHERE i.indrelid=c.oid AND i.indisvalid AND i.indisready) AS indexes
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname=ANY($1::text[])`, [Object.keys(columns)]);
  for (const [table, required] of Object.entries(columns)) {
    const row = rows.find(row => row.table_name === table);
    for (const [name, type] of Object.entries(required)) {
      if (row?.columns?.[name]?.type !== type || !row.columns[name].required) throw new OperationError("schema");
    }
    for (const name of ["created_at", "updated_at", "active"]) {
      if (row.columns[name].default !== (name === "active" ? "true" : "now()")) throw new OperationError("schema");
    }
    if (!checks[table].every(key => row.keys?.includes(key))) throw new OperationError("schema");
    if (table === "institution_memberships" && !row.indexes?.some((index: string) =>
      index.endsWith(" USING btree (user_id, active, institution_id)"))) throw new OperationError("schema");
    if (!keys[table].every(key => row.keys?.includes(key))) throw new OperationError("schema");
  }
}
