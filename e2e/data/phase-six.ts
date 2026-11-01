import type {CaseVariant} from './case-variants.ts';
const v=(name:string,actor='ST1',level:CaseVariant['level']='browser',tenant:CaseVariant['tenant']='uc',projects=['chromium']):CaseVariant=>({name,actor,level,tenant,projects});
export const phaseSix:Record<string,readonly CaseVariant[]>={
 'E2E-NETWORK-001':[v('expired-user')],
 'E2E-NETWORK-002':['403','404'].map(n=>v(n,'T1')),
 'E2E-NETWORK-003':[v('revalidation','T1')],
 'E2E-NETWORK-004':['shape','scope'].map(n=>v(n)),
 'E2E-NETWORK-005':[v('server-error','T1')],
 'E2E-NETWORK-006':[v('timeout')],
 'E2E-NETWORK-007':[v('offline')],
 'E2E-NETWORK-008':[v('stale-401','ST1/ST2')],
 'E2E-NETWORK-009':['400','409','422'].map(n=>v(n,'T1')),
 'E2E-NETWORK-010':[v('body-contract','T1','companion')],
 'E2E-NETWORK-011':[v('uncertain-patch','T1')],
 'E2E-NETWORK-012':[v('problem-contract','T1','companion')],
 'E2E-NETWORK-013':['uc','utfsm'].map(slug=>v(slug,slug==='uc'?'ST1':'FST1','browser',slug as 'uc'|'utfsm')),
 'E2E-A11Y-001':[v('keyboard-login')],
 'E2E-A11Y-002':[v('quiz-dialog','T1')],
 'E2E-A11Y-003':[v('participant-dialog','T1')],
 'E2E-A11Y-004':[v('keyboard-attempt')],
 'E2E-A11Y-005':['ST1','AO'].map(a=>v(a,a)),
 'E2E-A11Y-006':[v('reflow-motion')],
 'E2E-A11Y-007':['uc','utfsm'].map(slug=>v(slug,slug==='uc'?'AO/ST1':'FAO/FST1','browser',slug as 'uc'|'utfsm',['chromium','firefox','webkit'])),
 'E2E-A11Y-008':[v('durable-feedback')],
};

phaseSix['E2E-NETWORK-003']=[...phaseSix['E2E-NETWORK-003'],v('revoked-recovery','T1/AO')];
phaseSix['E2E-NETWORK-009']=[...phaseSix['E2E-NETWORK-009'],v('barrier-conflict','T1/T2'),v('locked-publication','AO/T1')];
phaseSix['E2E-NETWORK-011']=[...phaseSix['E2E-NETWORK-011'],v('late-completion','T1')];

phaseSix['E2E-A11Y-005']=phaseSix['E2E-A11Y-005'].map(v=>({...v,projects:['chromium','firefox','webkit']}));

phaseSix['E2E-NETWORK-008']=phaseSix['E2E-NETWORK-008'].map(v=>({...v,projects:['chromium','webkit']}));
phaseSix['E2E-A11Y-007']=[...phaseSix['E2E-A11Y-007'],
 v('utfsm-teacher-dark','FT1','browser','utfsm',['chromium','firefox','webkit']),
 v('portal-compact','ANON','browser','none',['chromium','firefox','webkit']),
 v('foreign-mobile','FT1','browser','utfsm',['chromium','firefox','webkit']),
 v('cross-role-mobile','TS-CROSS','browser','uc',['chromium','firefox','webkit']),
 v('hidden-module-dark','ST1','browser','uc',['chromium','firefox','webkit']),
 v('author-mobile','FT1/FST1','browser','utfsm',['chromium','firefox','webkit']),
 v('lost-save','ST1','browser','uc',['chromium','firefox','webkit']),
 v('lost-publication','FT1/FST1','browser','utfsm',['chromium','firefox','webkit']),
 v('owner-student-dark','AO-ST','browser','uc',['chromium','firefox','webkit']),
];
