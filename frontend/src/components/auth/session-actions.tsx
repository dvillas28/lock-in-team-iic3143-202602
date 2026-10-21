"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "./session-provider.tsx";

export function SessionActions() {
  const { session } = useSession();
  const router = useRouter();
  return <div className="state-actions">
    <Link className="btn btn-ghost" href="/institutions">Instituciones</Link>
    <button type="button" className="btn btn-ghost" onClick={() => { session.logout(); router.replace("/login"); }}>Cerrar sesión</button>
  </div>;
}
