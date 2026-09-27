import { getHealth } from "@/lib/api/health";

export const dynamic = "force-dynamic";

export default async function Home() {
  let backendMessage = "No disponible";

  try {
    const health = await getHealth();
    backendMessage = health.message;
  } catch {
    backendMessage = "No se pudo conectar con el backend";
  }

  return (
    <main>
      <h1>AcademiX</h1>

      <p>Frontend funcionando correctamente.</p>

      <p>
        <strong>Backend:</strong>
        <br />
        {backendMessage}
      </p>
    </main>
  );
}
