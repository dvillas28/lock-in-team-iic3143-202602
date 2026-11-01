import {createRequire} from 'node:module';
import {join} from 'node:path';
import {root} from '../runner/settings.ts';
import type {Environment} from '../fixtures/environment.ts';
import {command} from '../runner/process.ts';
export async function operation(e:Environment,name:'onboard-institution'|'set-superadmin',input:Record<string,string>) {
 await e.assertOwned();
 const output=await command(process.execPath,[`backend/dist/data-migrations/${name}.js`],{...e.backendEnv(),...input});
 for(const line of output.split('\n')) {try{const r=JSON.parse(line);if(r.outcome)return r;}catch{/* diagnostic, not a result */}}
 throw new Error('Operation exited without a structured outcome');
}
export const superadminInput=(e:Environment,enabled='false',operationId=e.key())=>({SUPERADMIN_INSTITUTION_SLUG:'uc',SUPERADMIN_USER_ID:e.data.actors.SA.id,SUPERADMIN_ENABLED:enabled,SUPERADMIN_OPERATION_ID:operationId,SUPERADMIN_OPERATOR_REF:'e2e-isolated-operator'});
export const onboardingInput=(e:Environment,existing=false)=>({ONBOARD_INSTITUTION_SLUG:'e2e-new',ONBOARD_INSTITUTION_NAME:'Institución operativa E2E',ONBOARD_USER_ID:existing?e.data.actors.MEMBER.id:e.id('new-user'),ONBOARD_USER_EMAIL:existing?e.data.actors.MEMBER.email:'operator.'+e.namespace+'@example.test',ONBOARD_USER_NAME:'Operador E2E',ONBOARD_INITIAL_PASSWORD:e.password,ONBOARD_OPERATION_ID:e.key(),ONBOARD_OPERATOR_REF:'e2e-isolated-operator'});

export async function fixturePassword(password:string) {
 const {hash,argon2id}=createRequire(join(root,'backend/package.json'))('argon2');
 return hash(password,{type:argon2id,memoryCost:19456,timeCost:2,parallelism:1});
}
