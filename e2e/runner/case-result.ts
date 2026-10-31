export type Observation = {variant: string; project: string; ran: boolean; status: string};
export function caseResult(expected: readonly string[] | undefined, observations: Observation[]) {
  const ran = observations.filter(o=>o.ran);
  if (!ran.length) return {executed:false, state:'implemented-environment-blocked'};
  if (ran.some(o=>o.status!=='expected')) return {executed:true, state:'executed-failed'};
  const projects = new Set(observations.map(o=>o.project));
  const complete = expected?.length && observations.every(o=>o.ran) && [...projects].every(project =>
    expected.every(variant=>ran.some(o=>o.project===project && o.variant===variant)));
  return {executed:true, state:complete ? 'executed-passed':'implemented-partial-execution'};
}
