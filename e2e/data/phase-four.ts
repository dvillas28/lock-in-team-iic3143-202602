import type {CaseVariant} from './case-variants.ts';
const v=(name:string,actor='AO',level:CaseVariant['level']='browser',smoke=false):CaseVariant=>({name,actor,level,tenant:'uc',projects:smoke?['chromium','firefox','webkit']:['chromium']});
export const phaseFour:Record<string,readonly CaseVariant[]>={
 'E2E-COURSE-001':['ST1','T1','AO'].map(a=>v(a,a,'browser',true)),
 'E2E-COURSE-002':[v('empty','MEMBER')],
 'E2E-COURSE-003':['malformed','missing'].map(n=>v(n,'ST1')),
 'E2E-COURSE-004':[v('revoked','ST1')],
 'E2E-COURSE-005':[v('recovery','ST1')],
 'E2E-COURSE-006':[v('create','AO','browser',true)],
 'E2E-COURSE-007':[v('duplicate')],
 'E2E-COURSE-008':[v('minimal-patch')],
 'E2E-COURSE-009':[v('no-op')],
 'E2E-COURSE-010':['code','name','term','shape','bytes'].map(n=>v(n)),
 'E2E-COURSE-011':[v('uncertain')],
 'E2E-COURSE-012':[v('concurrent')],
 'E2E-COURSE-013':['code','name','term','sectionCode'].map(n=>v(n,'AO','companion')),
 'E2E-SECTION-001':['AO','T1','AS1','ST1'].map(a=>v(a,a)),
 'E2E-SECTION-002':[v('create-edit')],
 'E2E-SECTION-003':[v('boundaries')],
 'E2E-SECTION-004':[v('picker')],
 'E2E-SECTION-005':[v('late-response')],
 'E2E-SECTION-006':[v('zero-capacity')],
};
