import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Session,StaleSessionError} from '../src/lib/auth/session.ts';
import {ApiResponseError} from '../src/lib/api/errors.ts';
import {user} from './fixtures/courses.ts';
const actor=user('owner','uc');
const profile={id:actor.id,email:actor.email,name:'Nuevo nombre',bio:null,hasAvatar:false,updatedAt:'2026-11-07T12:00:00.000001Z',capabilities:{avatar:false,invitationEmail:false}};
function harness(reply?:(request:Request)=>Response|Promise<Response>,contextReply?:()=>Response){
 const requests:Request[]=[];
 const session=new Session({baseUrl:'https://api.test',fetch:async input=>{
  const request=input as Request;requests.push(request);
  if(request.url.endsWith('/login')){const iat=Math.floor(Date.now()/1000);return Response.json({tokenType:'Bearer',expiresIn:900,accessToken:`e30.${Buffer.from(JSON.stringify({sub:actor.id,iat,exp:iat+900,iss:'academix-api',aud:'academix-clients'})).toString('base64url')}.signature`});}
  if(request.url.endsWith('/institutions'))return Response.json({items:[actor.institutionMembership.institution]});
  if(request.url.endsWith('/institution/uc/me'))return contextReply?.()??Response.json(actor);
  return reply?.(request)??Response.json(profile);
 }});return {session,requests};
}
test('global account works without an institution and validates returned ownership',async()=>{
 const {session}=harness();assert.equal(await session.login('ana@example.test','password'),true);
 await session.loadAccount();assert.equal(session.getSnapshot().account?.id,actor.id);assert.equal(session.getSnapshot().context,undefined);
 assert.throws(()=>session.rememberAccount({...profile,id:'10000000-0000-4000-8000-000000000099'}),ApiResponseError);
 session.logout();assert.equal(session.getSnapshot().account,undefined);
 await assert.rejects(session.accountRequest(async()=>{}),StaleSessionError);
});
test('display updates retain the academic authorization boundary and in-flight work',async()=>{
 const {session}=harness();await session.login('ana@example.test','password');await session.loadContext('uc');
 const context=session.getSnapshot().context;
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 const pending=session.request(async()=>{await gate;return 'saved';});
 session.rememberAccount(profile);
 assert.equal(session.getSnapshot().context,context);assert.equal(context?.user?.name,'Nuevo nombre');
 release();assert.equal(await pending,'saved');session.logout();
});
test('late account response after logout cannot restore identity or private data',async()=>{
 let resolve!:(r:Response)=>void;const delayed=new Promise<Response>(r=>{resolve=r;});
 const {session}=harness(()=>delayed);await session.login('ana@example.test','password');const pending=session.loadAccount();session.logout();resolve(Response.json(profile));await pending;
 assert.equal(session.getSnapshot().status,'anonymous');assert.equal(session.getSnapshot().account,undefined);
});

test('a directory warning does not block global account or public activation operations',async()=>{
 let fail=false;
 const {session,requests}=harness(request=>Response.json(request.url.endsWith('/auth/invitations/activate')?{}:profile),()=>fail?Response.json({},{status:503}):Response.json(actor));
 await session.login('ana@example.test','password');await session.loadContext('uc');
 const context=session.getSnapshot().context;
 fail=true;await session.loadContext('uc');assert.ok(session.getSnapshot().contextWarning);
 const profileResult=await session.accountRequest(async client=>client.GET('/api/v1/me'));
 assert.equal(profileResult.response.status,200);
 await session.publicRequest(async client=>client.POST('/api/v1/auth/invitations/activate',{body:{token:'x'.repeat(43),password:'long-password-123',confirmPassword:'long-password-123'}}));
 assert.equal(session.getSnapshot().context,context);assert.equal(requests.at(-1)?.headers.has('Authorization'),false);
 session.logout();
});
