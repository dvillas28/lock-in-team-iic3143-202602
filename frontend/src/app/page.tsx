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
    <main>
      <h1>AcademiX</h1>

      <p>Frontend funcionando correctamente.</p>

      <p>
        <strong>Backend:</strong>
        <br />
        {backendStatus}
      </p>
    </main>
  );
}
