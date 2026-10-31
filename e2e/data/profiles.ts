import type {Environment} from '../fixtures/environment.ts';
import {status} from '../helpers/api.ts';

export type AcademicProfile = 'ACTIVE' | 'PUBLISHABLE' | 'HISTORY';
export async function prepareProfile(e: Environment, profile: AcademicProfile) {
  if (profile === 'ACTIVE') return {attempt: await e.attempt()};
  const attempt = await e.graded();
  if (profile === 'PUBLISHABLE') return {attempt};
  const receipt = await e.publish();
  const cancelled = await e.attempt('ST1', e.data.quizzes.Q2);
  status(await (await e.api('ST1')).post(`quiz-attempts/${cancelled.id}/cancel`), 204);
  return {attempt, receipt, cancelled};
}
