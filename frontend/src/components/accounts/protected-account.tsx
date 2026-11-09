'use client';
import { useEffect,type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { useSession } from '../auth/session-provider.tsx';
import { SessionActions } from '../auth/session-actions.tsx';
import { ErrorState,LoadingState } from '../route-states.tsx';
export function ProtectedAccount({children}:{children:ReactNode}) {
 const {session,state}=useSession();const router=useRouter();const pathname=usePathname();
 useEffect(()=>{if(state.status==='anonymous')router.replace('/login?next='+encodeURIComponent(pathname??'/profile'));else if(state.status==='authenticated')void session.loadAccount();},[session,state.generation,state.status,pathname,router]);
 if(state.status!=='authenticated')return <main className="content"><LoadingState/></main>;
 return <div className="app"><div className="main"><header className="top-header"><Link href="/profile" className="sidebar-logo"><GraduationCap aria-hidden="true"/><span className="logo-name">AcademiX</span></Link><SessionActions returnPath="/profile"/></header><main className="content account-content"><nav className="state-actions" aria-label="Mi cuenta"><Link className="btn btn-ghost" href="/courses">Mis cursos</Link><Link className="btn btn-ghost" href="/profile" aria-current={pathname==='/profile'?'page':undefined}>Mi perfil</Link><Link className="btn btn-ghost" href="/profile/security" aria-current={pathname==='/profile/security'?'page':undefined}>Seguridad</Link></nav>{state.accountError?<ErrorState feedback={state.accountError} onRetry={()=>void session.loadAccount()}/>:!state.account?<LoadingState/>:children}</main></div></div>;
}
