import {test} from 'node:test';
import assert from 'node:assert/strict';
import {caseResult, type Observation} from '../runner/case-result.ts';
const observation=(variant: string, project='chromium', status='expected',ran=true): Observation=>({variant,project,status,ran});
test('collection and skipped variants never count as executed or passed',()=>{
  assert.deepEqual(caseResult(['A'],[observation('A','chromium','skipped',false)]),{executed:false,state:'implemented-environment-blocked'});
});
test('one successful variant cannot approve a case with missing actors or browser variants',()=>{
  assert.equal(caseResult(['A','B'],[observation('A')]).state,'implemented-partial-execution');
  assert.equal(caseResult(['A'],[observation('A'),observation('A','firefox','skipped',false)]).state,'implemented-partial-execution');
  assert.equal(caseResult(undefined,[observation('A')]).state,'implemented-partial-execution');
});
test('a case passes only with its complete actor set; failures and retries remain visible',()=>{
  assert.equal(caseResult(['A','B'],[observation('A'),observation('B')]).state,'executed-passed');
  assert.equal(caseResult(['A'],[observation('A','chromium','unexpected')]).state,'executed-failed');
  assert.equal(caseResult(['A'],[observation('A','chromium','flaky')]).state,'executed-failed');
});
