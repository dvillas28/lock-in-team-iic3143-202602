'use client';
import { useEffect,type ReactNode } from 'react';
import { usePathname,useRouter } from 'next/navigation';
import { hostInstitution } from '../../lib/auth/navigation.ts';
import { useSession } from '../auth/session-provider.tsx';
import { SessionActions } from '../auth/session-actions.tsx';
import { InstitutionShell } from '../institutions/institution-shell.tsx';
import { ErrorState,LoadingState } from '../route-states.tsx';
import { AccountAvatar } from './account-avatar.tsx';
export function ProtectedAccount({children}:{children:ReactNode}) {
 const {session,state,origin}=useSession();const router=useRouter();const pathname=usePathname()??'/profile';
 const slug=origin ? hostInstitution(origin).slug : undefined;
 useEffect(()=>{if(state.status==='anonymous')router.replace('/login?next='+encodeURIComponent(pathname));else if(state.status==='authenticated')void session.loadAccount();},[session,state.generation,state.status,pathname,router]);
 useEffect(()=>{
  if(state.status!=='authenticated'||!slug)return;
  void session.loadContext(slug);
  return ()=>session.clearContext();
 },[session,slug,state.generation,state.status]);
 if(state.status!=='authenticated')return <main className="content"><LoadingState/></main>;
 const user=state.context?.slug===slug ? state.context?.user : undefined;
 return <InstitutionShell pathname={pathname} institutionSlug={slug} institutionName={user?.institutionMembership.institution.name} user={user} avatar={user && <AccountAvatar name={user.name}/>} actions={<SessionActions returnPath="/profile"/>}>
  <div className="account-content">
   {state.accountError?<ErrorState feedback={state.accountError} onRetry={()=>void session.loadAccount()}/>:!state.account?<LoadingState/>:children}
  </div>
 </InstitutionShell>;
}
