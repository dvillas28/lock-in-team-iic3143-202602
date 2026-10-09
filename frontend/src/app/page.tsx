import { GraduationCap } from "lucide-react";

import { getHealth } from "@/lib/api/health";

export const dynamic = "force-dynamic";

export default async function Home() {
  let backendStatus = "No disponible";

  try {
    const health = await getHealth();
    backendStatus = `${health.status} (v${health.version})`;
  } catch {
    backendStatus = "No se pudo conectar con el backend";
  }

  return (
    <main className="content">
      <div className="sidebar-logo">
        <span className="logo-icon">
          <GraduationCap size={16} aria-hidden="true" />
        </span>
        <h1 className="serif">AcademiXXXXXXX</h1>
      </div>

      <p>Frontend funcionando correctamente.</p>

      <p>
        <strong>Backend:</strong>
        <br />
        {backendStatus}
      </p>
    </main>
  );
}
