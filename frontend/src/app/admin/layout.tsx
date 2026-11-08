import type { ReactNode } from 'react';
import { ProtectedInstitution } from '../../components/auth/protected-institution.tsx';
export default function AdminLayout({children}:{children:ReactNode}){return <ProtectedInstitution>{children}</ProtectedInstitution>;}
