type ApiResponse = {
  message: string;
};

export const dynamic = "force-dynamic";

async function getBackendMessage(): Promise<string> {
  const apiUrl = process.env.API_URL ?? "http://localhost:3001";

  try {
    const response = await fetch(apiUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Backend response: ${response.status}`);
    }

    const data = (await response.json()) as Partial<ApiResponse>;

    if (typeof data.message !== "string") {
      throw new Error("Backend response does not contain a message");
    }

    return data.message;
  } catch {
    return "No se pudo conectar con el backend.";
  }
}

export default async function Home() {
  const backendMessage = await getBackendMessage();

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
