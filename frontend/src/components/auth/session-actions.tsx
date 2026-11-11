"use client";

import { useRouter } from "next/navigation";
import { useSession } from "./session-provider.tsx";

export function SessionActions({returnPath}:{returnPath?:"/profile"|"/profile/security"}={}) {
  const { session } = useSession();
  const router = useRouter();
  return <div className="state-actions">
    <button type="button" className="btn btn-ghost" onClick={() => { session.logout(); router.replace(returnPath?"/login?next="+encodeURIComponent(returnPath):"/login"); }}>Cerrar sesión</button>
  </div>;
}
