import type {CaseVariant} from '../data/case-variants.ts';
export type Observation = {variant: string; project: string; ran: boolean; status: string};
export function evaluateCase(expected: readonly CaseVariant[] | undefined, observations: Observation[]) {
  const ran = observations.filter(o=>o.ran);
  if (!ran.length) return {executed:false, state:'implemented-environment-blocked'};
  if (ran.some(o=>['unexpected','failed','timedOut','interrupted'].includes(o.status))) return {executed:true,state:'executed-failed'};
  if (ran.some(o=>o.status==='flaky')) return {executed:true,state:'executed-unstable'};
  const complete = expected?.length && expected.every(v=>v.projects.every(project=>
    ran.some(o=>o.project===project && o.variant===v.name && o.status==='expected'))) &&
    observations.every(o=>o.ran && o.status==='expected' && expected.some(v=>v.name===o.variant && v.projects.includes(o.project)));
  return {executed:true,state:complete?'executed-passed':'implemented-partial-execution'};
}
export function caseResult(expected: readonly string[] | undefined, observations: Observation[], projects: readonly string[] = ['chromium']) {
  return evaluateCase(expected?.map(name=>({name, actor:name, tenant:'uc', level:'browser', projects})),observations);
}
