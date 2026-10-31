export type TestLevel = 'browser' | 'companion';
export type CaseVariant = {
  name: string; actor: string; tenant: 'uc' | 'utfsm' | 'both' | 'none';
  projects: readonly string[]; level: TestLevel;
};
const variant = (name: string, actor: string, level: TestLevel = 'companion', tenant: CaseVariant['tenant'] = 'uc'): CaseVariant =>
  ({name, actor, tenant, projects: ['chromium'], level});
export const caseDefinitions: Record<string, readonly CaseVariant[]> = {
  'E2E-AUTH-001': ['SA','AO','T1','AS1','ST1'].map(actor => variant(actor, actor, 'browser')),
  'E2E-OPS-001': [variant('readiness', 'OPERATOR')],
  'E2E-OPS-002': [variant('database-outage', 'T1', 'browser')],
  'E2E-OPS-003': [variant('unsafe-role', 'OPERATOR'), variant('missing-rls', 'OPERATOR')],
  'E2E-OPS-004': [variant('ensure-preserves-edits', 'AO')],
  'E2E-OPS-005': [variant('restart-persistence', 'ST1', 'browser')],
  'E2E-OPS-006': [variant('runtime-integrity', 'OPERATOR', 'companion', 'both')],
  'E2E-OPS-007': [variant('transaction-rollback', 'ST1')],
  'E2E-OPS-008': [variant('rejected-targets', 'OPERATOR'), variant('owned-target', 'OPERATOR')],
  'E2E-OPS-009': [variant('fresh-baseline', 'OPERATOR')],
};
Object.assign(caseDefinitions, {
  'E2E-PUBLIC-001': [variant('directory','ANON','browser','both')],
  'E2E-PUBLIC-002': ['uc','utfsm'].map(t=>variant(t,'ANON','browser',t as 'uc'|'utfsm')),
  'E2E-PUBLIC-003': [variant('anchors','ANON','browser')],
  'E2E-PUBLIC-004': ['/','/login','/courses'].map(path=>variant(path,'ANON','browser')),
  'E2E-PUBLIC-005': [variant('missing','ST1','browser')],
  'E2E-PUBLIC-006': ['uc','utfsm'].map(slug=>variant(slug,'ST1','browser')),
  'E2E-PUBLIC-007': [variant('legacy-directory','ST1','browser')],
  'E2E-AUTH-002': [variant('indistinguishable','ST1','browser')],
  'E2E-AUTH-004': [variant('local-validation','ST1','browser')],
  'E2E-AUTH-005': [variant('normalization','ST1','browser')],
  'E2E-AUTH-006': ['email254','email255','password128','password129','array','extra','malformed','oversized','media'].map(n=>variant(n,'ANON')),
  'E2E-AUTH-010': [variant('spa-reload','ST1','browser')],
  'E2E-AUTH-012': [variant('grades-deeplink','ST1','browser')],
  'E2E-AUTH-013': ['external','protocol-relative','duplicate','query','hash'].map(n=>variant(n,'ST1','browser')),
  'E2E-AUTH-014': ['material','authoring'].map(n=>variant(n,'T1','browser')),
  'E2E-AUTH-015': [variant('active-login','ST1','browser')],
  'E2E-AUTH-022': ['unicode128','unicode132'].map(n=>variant(n,'ST1')),
  'E2E-CATALOG-001': [variant('filter-deeplink','ANON','browser','none')],
  'E2E-CATALOG-002': [variant('download','ANON','browser','none')],
  'E2E-CATALOG-003': ['json500','invalid-json','bundle','keyboard-mobile'].map(n=>variant(n,'ANON','browser','none')),
  'E2E-CATALOG-004': [variant('atomic-build','OPERATOR','companion','none')],
});
for (const id of ['E2E-AUTH-001',
 'E2E-AUTH-010',
 'E2E-PUBLIC-001']) {
  caseDefinitions[id] = caseDefinitions[id].map(v=>({...v, projects:['chromium','firefox','webkit']}));
}
Object.assign(caseDefinitions, {
 'E2E-AUTH-003':[variant('inactive','ST1','browser')],
 'E2E-AUTH-008':[variant('no-membership','NONE','browser')],
 'E2E-AUTH-011':[variant('logout','ST1','browser')],
 'E2E-AUTH-016':[variant('expiration','ST1','browser')],
 'E2E-AUTH-017':['signature','none','expired','issuer','audience','future'].map(n=>variant(n,'ST1')),
 'E2E-AUTH-018':['duplicate','multiple','blank','oversized'].map(n=>variant(n,'ST1')),
 'E2E-AUTH-019':[variant('independent-tabs','ST1','browser')],
 'E2E-AUTH-021':['unavailable','malformed'].map(n=>variant(n,'ST1','browser')),
});
Object.assign(caseDefinitions, {'E2E-AUTH-007':[variant('rate-limit','ST1','browser')],
 'E2E-AUTH-009':[variant('public-headers','ST1','browser')],
 'E2E-AUTH-020':[variant('draft-focus','ST1','browser')]});
Object.assign(caseDefinitions, {
'E2E-TENANT-001': ["uc", "utfsm"].map(n=>variant(n,'MATRIX','browser','both')),
 'E2E-TENANT-002': ["multi"].map(n=>variant(n,'MATRIX','browser','both')),
 'E2E-TENANT-003': ["uc", "utfsm"].map(n=>variant(n,'MATRIX','companion','both')),
 'E2E-TENANT-004': ["slugs"].map(n=>variant(n,'MATRIX','browser','both')),
 'E2E-TENANT-005': ["revoked"].map(n=>variant(n,'MATRIX','browser','both')),
 'E2E-TENANT-006': ["other-active"].map(n=>variant(n,'MATRIX','browser','both')),
 'E2E-TENANT-007': ["history"].map(n=>variant(n,'MATRIX','browser','both')),
 'E2E-TENANT-008': ["uc-teacher", "uc-student", "uc-assistant", "uc-owner", "uc-superadmin", "utfsm-teacher", "utfsm-student", "utfsm-assistant", "utfsm-owner", "utfsm-superadmin"].map(n=>variant(n,'MATRIX','browser','both')),
 'E2E-TENANT-009': ["uc", "utfsm"].map(n=>variant(n,'MATRIX','browser','both')),
 'E2E-TENANT-010': ["uc", "utfsm"].map(n=>variant(n,'MATRIX','browser','both')),
 'E2E-TENANT-011': ["other-course"].map(n=>variant(n,'MATRIX','browser','both')),
 'E2E-TENANT-012': ["material", "attempt"].map(n=>variant(n,'MATRIX','browser','both')),
 'E2E-TENANT-013': ["enrollments", "memberships", "users", "attempts", "gradebook", "audit"].map(n=>variant(n,'MATRIX','companion','both')),
 'E2E-TENANT-014': ["pooled"].map(n=>variant(n,'MATRIX','companion','both')),
 'E2E-TENANT-015': ["late-200", "late-401"].map(n=>variant(n,'MATRIX','browser','both'))
});
Object.assign(caseDefinitions, {
'E2E-RBAC-001':[variant('superadmin','superadmin','browser')],
 'E2E-RBAC-002':[variant('other-admin','other-admin','browser')],
 'E2E-RBAC-003':[variant('owner-only','owner-only','browser')],
 'E2E-RBAC-004':[variant('teacher','teacher','browser')],
 'E2E-RBAC-005':[variant('AS1','AS1','browser')],
 'E2E-RBAC-006':[variant('ST1','ST1','browser')],
 'E2E-RBAC-007':[variant('admin-revocation','admin-revocation','browser')],
 'E2E-RBAC-008':[variant('global-owner','global-owner','browser')],
 'E2E-RBAC-009':[variant('TS-SAME','TS-SAME','browser')],
 'E2E-RBAC-010':[variant('TS-CROSS','TS-CROSS','browser')],
 'E2E-RBAC-011':[variant('assistant-student','assistant-student','browser')],
 'E2E-RBAC-012':[variant('teacher-revocation','teacher-revocation','browser')],
 'E2E-RBAC-013':[variant('visual-hints','visual-hints','browser')]
});
Object.assign(caseDefinitions, {
'E2E-ADMIN-001':["directory"].map(n=>variant(n,'OPERATOR','companion')),
 'E2E-ADMIN-002':["grant"].map(n=>variant(n,'OPERATOR','browser')),
 'E2E-ADMIN-003':["revoke"].map(n=>variant(n,'OPERATOR','browser')),
 'E2E-ADMIN-004':["AO", "T1", "AS1", "ST1"].map(n=>variant(n,'OPERATOR','companion')),
 'E2E-ADMIN-005':["targets"].map(n=>variant(n,'OPERATOR','companion')),
 'E2E-ADMIN-006':["independent-flags"].map(n=>variant(n,'OPERATOR','browser')),
 'E2E-ADMIN-007':["onboarding"].map(n=>variant(n,'OPERATOR','companion')),
 'E2E-ADMIN-008':["recovery"].map(n=>variant(n,'OPERATOR','companion')),
 'E2E-ADMIN-009':["replacement"].map(n=>variant(n,'OPERATOR','companion')),
 'E2E-ADMIN-010':["collision"].map(n=>variant(n,'OPERATOR','companion')),
 'E2E-ADMIN-011':["concurrent-revocation"].map(n=>variant(n,'OPERATOR','browser'))
});
Object.assign(caseDefinitions, {'E2E-AUDIT-003':[variant('owner-student','AO-ST','browser')],
 'E2E-AUDIT-004':[variant('revoked-owner','AO','browser')],
 'E2E-AUDIT-005':['ST1','AS1','SA'].map(n=>variant(n,n,'browser')),
 'E2E-AUDIT-008':[variant('snapshots','AO','browser')]});
const roleActors:Record<string,string>={teacher:'T1',student:'ST1',assistant:'AS1',owner:'AO',superadmin:'SA'};
const primaryActors:Record<string,string>={
 'E2E-TENANT-002':'MULTI',
 'E2E-TENANT-003':'MULTI',
 'E2E-TENANT-004':'ST1',
 'E2E-TENANT-005':'ST1',
 'E2E-TENANT-006':'MULTI',
 'E2E-TENANT-007':'MULTI',
 'E2E-TENANT-011':'T1',
 'E2E-TENANT-012':'T1',
 'E2E-TENANT-014':'MULTI',
 'E2E-TENANT-015':'ST1/ST2',
 'E2E-RBAC-001':'SA',
 'E2E-RBAC-002':'AX',
 'E2E-RBAC-003':'AO-ONLY',
 'E2E-RBAC-004':'T1',
 'E2E-RBAC-007':'AO',
 'E2E-RBAC-008':'AO',
 'E2E-RBAC-011':'AS-ST',
 'E2E-RBAC-012':'T1',
 'E2E-RBAC-013':'ST1',
 'E2E-ADMIN-001':'SA',
 'E2E-ADMIN-002':'MEMBER',
 'E2E-ADMIN-003':'AO',
 'E2E-ADMIN-005':'SA',
 'E2E-ADMIN-006':'SA',
 'E2E-ADMIN-011':'SA',
};
for(const [id,variants] of Object.entries(caseDefinitions)) {
 caseDefinitions[id]=variants.map(v=>{
  let actor=primaryActors[id]??v.actor;
  if(id==='E2E-TENANT-001')actor=v.name==='uc'?'ST1':'FST1';
  if(id==='E2E-TENANT-008'){const [slug,role]=v.name.split('-');actor=(slug==='utfsm'?'F':'')+roleActors[role];}
  if(['E2E-TENANT-009',
 'E2E-TENANT-010'].includes(id))actor=v.name==='uc'?'AO':'FAO';
  if(id==='E2E-TENANT-013')actor=v.name==='memberships'?'SA':'AO';
  if(id==='E2E-ADMIN-004')actor=v.name;
  return {...v,actor};
 });
}
// Catalogue smoke variants also require Firefox and WebKit in phase acceptance.
for(const id of ['E2E-AUTH-011','E2E-TENANT-001','E2E-TENANT-002','E2E-TENANT-008','E2E-TENANT-009','E2E-RBAC-005','E2E-RBAC-006','E2E-RBAC-009','E2E-AUDIT-003']) {
 caseDefinitions[id]=caseDefinitions[id].map(v=>({...v,projects:['chromium','firefox','webkit']}));
}
caseDefinitions['E2E-TENANT-013']=[...caseDefinitions['E2E-TENANT-013'],variant('browser-recovery','T1','browser','both')];
export const caseVariants: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(caseDefinitions).map(([id, variants]) => [id, variants.map(v => v.name)]),
);

export function assertCaseMetadata(id: string, name: string, annotations: readonly {type:string;description?:string}[]) {
  const variant=caseDefinitions[id]?.find(v=>v.name===name);
  if(!variant)throw new Error('Report references an undeclared case variant');
  for(const [type,description] of Object.entries({case:id,actor:variant.actor,tenant:variant.tenant,level:variant.level})) {
    if(!annotations.some(a=>a.type===type && a.description===description))throw new Error(`Missing or inconsistent ${type} metadata for ${id}`);
  }
}
