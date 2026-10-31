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
for (const id of ['E2E-AUTH-001','E2E-AUTH-010','E2E-PUBLIC-001']) {
  caseDefinitions[id] = caseDefinitions[id].map(v=>({...v, projects:['chromium','firefox','webkit']}));
}
export const caseVariants: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(caseDefinitions).map(([id, variants]) => [id, variants.map(v => v.name)]),
);
