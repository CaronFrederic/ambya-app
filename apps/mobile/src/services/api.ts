const baseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!baseUrl) {
  // En dev, ça aide à voir vite le problème
  console.warn("EXPO_PUBLIC_API_URL is missing in apps/mobile/.env");
}

export async function getHealth() {
  const res = await fetch(`${baseUrl}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json() as Promise<{
    status: string;
    service: string;
    timestamp: string;
  }>;
}
