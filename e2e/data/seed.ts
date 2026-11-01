import {createHash} from 'node:crypto';
import type {Pool} from 'pg';

export type Actor = {id: string; email: string; name: string; membership: Record<string, string>};
export type Seed = Awaited<ReturnType<typeof seed>>;
export function identifier(namespace: string, key: string) {
  const h = createHash('sha256').update(`academix-e2e-v1:${namespace}:${key}`).digest('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`;
}
export function questions(namespace: string, points = [6,4]) {
  return points.map((p, i) => ({id: identifier(namespace, `question${i}`), position: i+1,
    prompt: `Pregunta E2E ${i+1}`, points: p,
    alternatives: [{id: 'a', text: `Respuesta correcta ${i+1}`, isCorrect: true}, {id: 'b', text: `Distractor ${i+1}`, isCorrect: false}],
  }));
}
export async function seed(pool: Pool, namespace: string, passwordHash: string) {
  const db = await pool.connect();
  try {
    return await seedClient(db, namespace, passwordHash);
  } finally {db.release();}
}
async function seedClient(db: import('pg').PoolClient, namespace: string, passwordHash: string) {
  const id = (key: string) => identifier(namespace, key);
  const tenants: Record<string,string> = {uc: id('uc'), utfsm: id('utfsm')};
  const aliases = ['SA','AO','AO-ONLY','AO-ST','AX','T1','T2','AS1','ST1','ST2','TS-SAME','TS-CROSS','AS-ST','MULTI','MEMBER','NONE','INACTIVE','REVOKED','FSA','FAO','FT1','FAS1','FST1'];
  const existing = await db.query('SELECT id FROM institutions WHERE slug=$1', ['uc']);
  if (existing.rows.length) {
    if (existing.rows[0].id !== tenants.uc) throw new Error('Seed collision: refusing to adopt an existing institution');
    const foreign = await db.query('SELECT id FROM institutions WHERE slug=$1',['utfsm']);
    const users = await db.query('SELECT id FROM users WHERE id=ANY($1::uuid[])',[aliases.map(id)]);
    const courses = await db.query('SELECT id FROM courses WHERE id=ANY($1::uuid[])',[['C1','C2','C3','CEMPTY','COWNER','COWNERST','F1'].map(id)]);
    if(foreign.rows[0]?.id!==tenants.utfsm || users.rowCount!==aliases.length || courses.rowCount!==7) throw new Error('Seed ownership incomplete: refusing silent repair');
    // Ensure intentionally never repairs edits, privileges, passwords, grades or history.
    return manifest();
  }
  const actors: Record<string, Actor> = {};
  for (const alias of aliases) actors[alias] = {
    id: id(alias), email: `${alias.toLowerCase()}.${namespace.slice(-8)}@example.test`,
    name: `E2E ${alias} José`, membership: {},
  };
  function manifest() {
    const actors: Record<string, Actor> = {};
    for (const alias of aliases) {
      const foreign = alias.startsWith('F') && alias !== 'NONE';
      actors[alias] = {id: id(alias), email: `${alias.toLowerCase()}.${namespace.slice(-8)}@example.test`, name: `E2E ${alias} José`, membership: {}};
      if (alias !== 'NONE') actors[alias].membership[foreign ? 'utfsm' : 'uc'] = id(`membership/${foreign ? 'utfsm' : 'uc'}/${alias}`);
      if (alias === 'MULTI') actors[alias].membership.utfsm = id('membership/utfsm/MULTI');
    }
    const courses = Object.fromEntries(['C1','C2','C3','CEMPTY','COWNER','COWNERST','F1'].map(k => [k, id(k)]));
    const sections = Object.fromEntries(['S1','S2','S21','S3','SEMPTY','SOWNER','SOWNERST','FS1','FS2'].map(k => [k,id(k)]));
    const modules = {M1: id('M1'), M2: id('M2'), FM1: id('FM1'), M2C2: id('M2C2')};
    const materials = {R1: id('R1'), R2: id('R2'), FR1: id('FR1')};
    const quizzes = Object.fromEntries(['Q1','Q2','QD','QS2','QCOURSE','QFUTURE','QCLOSED','FQ1'].map(k => [k,id(k)]));
    return {namespace, id, tenants, actors, courses, sections, modules, materials, quizzes, questions: questions(namespace+'/Q1')};
  }
  await db.query('BEGIN');
  try {
    for (const [slug, tid] of Object.entries(tenants)) await db.query('INSERT INTO institutions(id,slug,name) VALUES($1,$2,$3)', [tid, slug, slug === 'uc' ? 'Universidad E2E UC' : 'Universidad E2E UTFSM']);
    for (const alias of aliases) {
      const a = actors[alias];
      await db.query('INSERT INTO users(id,email,name,password_hash,active) VALUES($1,$2,$3,$4,$5)', [a.id,a.email,a.name,passwordHash,alias !== 'INACTIVE']);
      const slug = alias.startsWith('F') ? 'utfsm' : 'uc';
      if (alias === 'NONE') continue;
      const member = id(`membership/${slug}/${alias}`); a.membership[slug] = member;
      await db.query('INSERT INTO institution_memberships(id,institution_id,user_id,is_admin,is_super_admin,active) VALUES($1,$2,$3,$4,$5,$6)',
        [member, tenants[slug],a.id,['AO','AO-ONLY','AO-ST','AX','FAO'].includes(alias),['SA','FSA'].includes(alias),alias !== 'REVOKED']);
      if (alias === 'MULTI') {
        a.membership.utfsm = id('membership/utfsm/MULTI');
        await db.query('INSERT INTO institution_memberships(id,institution_id,user_id) VALUES($1,$2,$3)', [a.membership.utfsm,tenants.utfsm,a.id]);
      }
    }
    const courses: [string,string,string,string[]][] = [
      ['C1','uc','AO',['S1','S2']], ['C2','uc','AO',['S21']], ['C3','uc','AX',['S3']],
      ['CEMPTY','uc','AO',['SEMPTY']], ['COWNER','uc','AO-ONLY',['SOWNER']],
      ['COWNERST','uc','AO-ST',['SOWNERST']], ['F1','utfsm','FAO',['FS1','FS2']],
    ];
    for (const [course,slug,owner,sections] of courses) {
      await db.query('INSERT INTO courses(id,institution_id,code,name,term,created_by) VALUES($1,$2,$3,$4,$5,$6)', [id(course),tenants[slug],`E2E-${course}`,`Curso E2E ${course}`,'2026-2',id(owner)]);
      for (const [n,section] of sections.entries()) await db.query('INSERT INTO sections(id,institution_id,course_id,code,capacity) VALUES($1,$2,$3,$4,$5)', [id(section),tenants[slug],id(course),String(n+1), n === 0 ? 30 : null]);
    }
    const memberships: [string,string,string,string][] = [
      ['uc','S1','AO','teacher'],['uc','S1','T1','teacher'],['uc','S2','T2','teacher'],['uc','S1','AS1','assistant'],
      ['uc','S1','ST1','student'],['uc','S2','ST2','student'],['uc','S1','MULTI','student'],
      ['uc','S1','TS-SAME','teacher'],['uc','S1','TS-SAME','student'],['uc','S2','TS-CROSS','teacher'],['uc','S1','TS-CROSS','student'],
      ['uc','S1','AS-ST','assistant'],['uc','S1','AS-ST','student'],['uc','S21','AO','teacher'],['uc','S21','T1','teacher'],
      ['uc','S3','AX','teacher'],['uc','SEMPTY','AO','teacher'],['uc','SEMPTY','T1','teacher'],['uc','SEMPTY','ST1','student'],
      ['uc','SOWNERST','AO-ST','student'],['uc','SOWNERST','T1','teacher'],
      ['utfsm','FS1','FAO','teacher'],['utfsm','FS1','FT1','teacher'],['utfsm','FS1','FAS1','assistant'],
      ['utfsm','FS1','FST1','student'],['utfsm','FS1','MULTI','teacher'],
    ];
    for (const [slug,section,actor,role] of memberships) await db.query('INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,$5)', [id(`enrollment/${section}/${actor}/${role}`),tenants[slug],id(section),id(actor),role]);
    for (const [key,slug,course,position,published] of [['M1','uc','C1',1,true],['M2','uc','C1',2,false],['M2C2','uc','C2',1,true],['FM1','utfsm','F1',1,true]] as const) {
      await db.query('INSERT INTO course_modules(id,institution_id,course_id,title,position,published_at) VALUES($1,$2,$3,$4,$5,$6)', [id(key),tenants[slug],id(course),`Unidad E2E ${key}`,position,published ? new Date() : null]);
    }
    for (const [key,slug,module,actor,published] of [['R1','uc','M1','T1',true],['R2','uc','M1','T1',false],['FR1','utfsm','FM1','FT1',true]] as const) await db.query(
      'INSERT INTO materials(id,institution_id,module_id,title,markdown_body,created_by,published_at) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [id(key),tenants[slug],id(module),`Lectura E2E ${key}`,'# Tema E2E\n\nContenido académico sintético.\n\n- Concepto\n- Ejemplo\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n```js\nconst x = 1;\n```',id(actor),published ? new Date() : null]);
    for (const q of ['Q1','Q2','QD','QS2','QCOURSE','QFUTURE','QCLOSED','FQ1']) {
      const foreign = q === 'FQ1', slug = foreign ? 'utfsm' : 'uc';
      const section = q === 'QCOURSE' ? null : id(foreign ? 'FS1' : q === 'QS2' ? 'S2' : 'S1');
      const t = Date.now(), opens = q === 'QFUTURE' ? new Date(t+86_400_000) : q === 'QCLOSED' ? new Date(t-172_800_000) : null;
      const closes = q === 'QFUTURE' ? new Date(t+172_800_000) : q === 'QCLOSED' ? new Date(t-86_400_000) : null;
      await db.query('INSERT INTO quizzes(id,institution_id,course_id,section_id,title,instructions,max_attempts,published_at,created_by,questions,opens_at,closes_at) VALUES($1,$2,$3,$4,$5,$6,3,$7,$8,$9,$10,$11)',
        [id(q),tenants[slug],id(foreign ? 'F1' : 'C1'),section,`Quiz E2E ${q}`,'Selecciona una alternativa por pregunta.',q === 'QD' ? null : new Date(),id(foreign ? 'FT1' : 'AO'),JSON.stringify(questions(namespace+'/'+q)),opens,closes]);
      if (q !== 'QD') await db.query('INSERT INTO grade_items(id,institution_id,course_id,quiz_id,title,weight_percent) VALUES($1,$2,$3,$4,$5,$6)',
        [id(`item/${q}`),tenants[slug],id(foreign ? 'F1' : 'C1'),id(q),`Quiz E2E ${q}`,q === 'Q1' ? 30 : q === 'Q2' ? 70 : foreign ? 100 : 0]);
    }
    await db.query('COMMIT');
    return manifest();
  } catch (error) {await db.query('ROLLBACK'); throw error;}
}
