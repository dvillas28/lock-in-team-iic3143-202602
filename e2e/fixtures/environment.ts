import {createRequire} from 'node:module';
import {createHmac, randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import pg from 'pg';
import {root, apiBase, apiPort, origin, preflight} from '../runner/settings.ts';
import {command, launch, stop, ready} from '../runner/process.ts';
import {seed, identifier, type Seed} from '../data/seed.ts';
import {controlPostgres} from '../runner/postgres.ts';
import {Api, status} from '../helpers/api.ts';
const backendRequire = createRequire(join(root, 'backend/package.json'));
const {hash, argon2id} = backendRequire('argon2');
let passwordHash: string;

export class Environment {
  data!: Seed;
  pool!: pg.Pool;
  app?: ReturnType<typeof launch>;
  tokens = new Map<string,string>();
  private logins = 0;
  private control!: pg.Pool;
  private createdDatabase = false;
  private registered = false;
  private closed = false;
  readonly dbName: string;
  readonly password = process.env.E2E_PASSWORD!;
  readonly runId = process.env.E2E_RUN_ID!;
  readonly port: string;
  readonly pgFolder: string;
  readonly runtimePassword = process.env.E2E_RUNTIME_PASSWORD!;
  constructor(public namespace: string, cluster = {port: process.env.E2E_PG_PORT!, folder: process.env.E2E_PG_FOLDER!}) {
    this.port = cluster.port; this.pgFolder = cluster.folder;
    preflight();
    if (!/^[a-f0-9]{16}$/.test(this.runId ?? '') || !/^\d+$/.test(this.port ?? '')) throw new Error('Use pnpm --dir e2e test: runner ownership is required');
    this.dbName = `academix_e2e_${this.runId}_${namespace}_test`;
    if (!/^[a-z0-9_]+_test$/.test(this.dbName) || this.dbName.length > 63) throw new Error('Invalid isolated database name');
  }
  url(user = 'postgres', name = this.dbName) {
    const auth = user === 'academix_runtime' ? `academix_runtime:${this.runtimePassword}` : 'postgres';
    return `postgresql://${auth}@127.0.0.1:${this.port}/${name}`;
  }
  backendEnv() {
    return {DATABASE_URL: this.url('academix_runtime'), MIGRATION_DATABASE_URL: this.url(), AUTH_JWT_SECRET: process.env.E2E_JWT_SECRET,
      CORS_ALLOWED_ORIGINS: JSON.stringify([origin('uc'),origin('utfsm')]), NODE_ENV: 'test', PORT: String(apiPort), DEMO_DATA_ENABLED: 'false'};
  }
  async start() {
    if (await readFile(join(this.pgFolder, 'owner'), 'utf8') !== this.runId) throw new Error('PostgreSQL ownership mismatch');
    this.control = new pg.Pool({connectionString: this.url('postgres','postgres')});
    this.control.on('error',()=>{}); // An OPS outage intentionally disconnects idle clients; queries still reject.
    await this.control.query(`CREATE TABLE IF NOT EXISTS e2e_owned_databases(name text PRIMARY KEY, owner text NOT NULL)`);
    await this.control.query('INSERT INTO e2e_owned_databases(name,owner) VALUES($1,$2)', [this.dbName,this.runId]);
    this.registered = true;
    await this.control.query(`CREATE DATABASE "${this.dbName}"`);
    this.createdDatabase = true;
    await command(process.execPath, ['backend/dist/commands/predeploy.js'], this.backendEnv());
    this.pool = new pg.Pool({connectionString: this.url(), max: 3});
    this.pool.on('error',()=>{});
    passwordHash ??= await hash(this.password, {type: argon2id, memoryCost:19456,timeCost:2,parallelism:1});
    this.data = await seed(this.pool,this.namespace,passwordHash);
    await this.startApi();
    return this;
  }
  async startApi() {
    this.app = launch(process.execPath, ['backend/dist/commands/start.js'], this.backendEnv());
    try {await ready(apiBase+'/ready',this.app.child);} catch (error) {throw new Error(`Backend not ready: ${this.app.output()}`, {cause: error});}
    this.logins = 0;
  }
  async restartApi() {if (this.app) await stop(this.app.child); this.tokens.clear(); await this.startApi();}
  async ensureSeed() {return seed(this.pool, this.namespace, passwordHash);}
  async assertOwned() {
    if (await readFile(join(this.pgFolder, 'owner'), 'utf8') !== this.runId) throw new Error('PostgreSQL ownership mismatch');
    const row = (await this.control.query('SELECT owner FROM e2e_owned_databases WHERE name=$1', [this.dbName])).rows[0];
    if (row?.owner !== this.runId) throw new Error('Database ownership mismatch');
  }
  async suspendDatabase() {
    await this.assertOwned();
    await controlPostgres(this.pgFolder,this.runId,'stop');
  }
  async resumeDatabase() {await controlPostgres(this.pgFolder,this.runId,'start');}
  async token(actor = 'T1') {
    const existing = this.tokens.get(actor); if (existing) return existing;
    if (++this.logins > 5) throw new Error('Fixture login budget exceeded: parameterize actors or explicitly restart owned API');
    const a = this.data.actors[actor];
    const response = status(await new Api().request('/api/v1/auth/login','POST',{email:a.email,password:this.password}),200);
    const token = response.body.accessToken as string; this.tokens.set(actor,token); return token;
  }
  async api(actor = 'T1', slug = 'uc') {return new Api(await this.token(actor), slug);}
  syntheticToken(actor: string, claims: Record<string,unknown> = {}) {
    const now = Math.floor(Date.now()/1000);
    const payload = {sub:this.data.actors[actor].id,iat:now,exp:now+900,iss:'academix-api',aud:'academix-clients',...claims};
    const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${header}.${encoded}.${createHmac('sha256',Buffer.from(process.env.E2E_JWT_SECRET!,'base64')).update(`${header}.${encoded}`).digest('base64url')}`;
  }
  key() {return randomBytes(12).toString('hex');}
  id(key: string) {return identifier(this.namespace,key);}
  async count(table: string, where = 'true', params: unknown[] = []) {
    if (!['courses','sections','enrollments','course_modules','materials','quizzes','grade_items','quiz_attempts','grades','grade_publications','audit_events','institution_memberships','users'].includes(table)) throw new Error('Unapproved test table');
    return Number((await this.pool.query(`SELECT count(*) AS n FROM ${table} WHERE ${where}`,params)).rows[0].n);
  }
  async events(action: string, resource?: string) {
    return (await this.pool.query('SELECT * FROM audit_events WHERE action=$1 AND ($2::uuid IS NULL OR resource_id=$2) ORDER BY occurred_at,id',[action,resource??null])).rows;
  }
  async attempt(actor = 'ST1', quiz = this.data.quizzes.Q1, section = this.data.sections.S1) {
    return status(await (await this.api(actor)).post(`sections/${section}/quizzes/${quiz}/attempts`,undefined,this.key()),201).body;
  }
  answers(correct: boolean[] = [true,true]) {return this.data.questions.filter((_,i)=>i<correct.length).map((q,i)=>({questionId:q.id,alternativeId:correct[i] ? 'a':'b'}));}
  async graded(actor = 'ST1', correct: boolean[] = [true,false], quiz = this.data.quizzes.Q1, section = this.data.sections.S1) {
    const api = await this.api(actor), a = await this.attempt(actor,quiz,section);
    const questions = status(await api.get(`quizzes/${quiz}`),200).body.questions;
    const answers = questions.slice(0,correct.length).map((q: {id:string},i: number)=>({questionId:q.id,alternativeId:correct[i] ? 'a':'b'}));
    status(await api.put(`quiz-attempts/${a.id}/answers`,{answers}),200);
    const key = this.key(); status(await api.post(`quiz-attempts/${a.id}/submit`,undefined,key),200);
    return {...a,submitKey:key};
  }
  selection(quiz = 'Q1', actor = 'ST1', section = 'S1') {
    return {gradeItemIds:[this.id(`item/${quiz}`)],sectionIds:[this.data.sections[section]],studentIds:[this.data.actors[actor].id]};
  }
  async publish(quiz = 'Q1', actor = 'ST1', section = 'S1', teacher = 'AO', key = this.key()) {
    return status(await (await this.api(teacher)).post(`courses/${this.data.courses.C1}/gradebook/publications`,this.selection(quiz,actor,section),key),200).body;
  }
  async close() {
    if (this.closed) return;
    if (this.createdDatabase) await this.assertOwned();
    if (this.app) await stop(this.app.child);
    if (this.pool) await this.pool.end();
    if (this.control) {
      try {
        if (this.createdDatabase) {
          const owned = (await this.control.query('SELECT owner FROM e2e_owned_databases WHERE name=$1',[this.dbName])).rows[0];
          if (owned?.owner !== this.runId) throw new Error('Refusing to drop unowned test database');
          await this.control.query(`DROP DATABASE IF EXISTS "${this.dbName}" WITH (FORCE)`);
        }
        if(this.registered)await this.control.query('DELETE FROM e2e_owned_databases WHERE name=$1 AND owner=$2',[this.dbName,this.runId]);
      } finally {await this.control.end();}
    }
    this.closed = true;
  }
}
