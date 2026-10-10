import { GraduationCap } from "lucide-react";

import { getHealth } from "@/lib/api/health";

export const dynamic = "force-dynamic";

// Release versions are numeric ("0.3.0"); local builds without APP_VERSION report "dev".
function formatVersion(version: string): string {
  return /^\d/.test(version) ? `v${version}` : version;
}

export default async function Home() {
  // Release of the last frontend deploy: releases without frontend changes do not redeploy it.
  const frontendVersion = formatVersion(process.env.APP_VERSION ?? "dev");
  let backendStatus = "No disponible";

  try {
    const health = await getHealth();
    backendStatus = `${health.status} (${formatVersion(health.version)})`;
  } catch {
    backendStatus = "No se pudo conectar con el backend";
  }

  return (
    <main className="content">
      <div className="sidebar-logo">
        <span className="logo-icon">
          <GraduationCap size={16} aria-hidden="true" />
        </span>
        <h1 className="serif">AcademiX</h1>
      </div>

      <p>Frontend funcionando correctamente.</p>

      <p>
        <strong>Frontend:</strong>
        <br />
        {frontendVersion}
      </p>

      <p>
        <strong>Backend:</strong>
        <br />
        {backendStatus}
      </p>
    </main>
  );
}
