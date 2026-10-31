export type TestLevel = 'browser' | 'companion';
export type CaseVariant = {
  name: string; actor: string; tenant: 'uc' | 'utfsm' | 'both';
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
export const caseVariants: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(caseDefinitions).map(([id, variants]) => [id, variants.map(v => v.name)]),
);
