import type { ReactNode } from 'react';
import { ProtectedAccount } from '../../components/accounts/protected-account.tsx';
export default function ProfileLayout({children}:{children:ReactNode}){return <ProtectedAccount>{children}</ProtectedAccount>;}
