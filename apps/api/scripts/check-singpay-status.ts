import fetch from "node-fetch";

const BASE_URL = process.env.SINGPAY_BASE_URL || "https://client.singpay.ga";
const CLIENT_ID = process.env.SINGPAY_CLIENT_ID;
const CLIENT_SECRET = process.env.SINGPAY_CLIENT_SECRET;
const WALLET_ID = process.env.SINGPAY_WALLET_ID;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variable manquante: ${name}`);
  }
  return value;
}

async function main() {
  const clientId = requireEnv("SINGPAY_CLIENT_ID", CLIENT_ID);
  const clientSecret = requireEnv("SINGPAY_CLIENT_SECRET", CLIENT_SECRET);
  const walletId = requireEnv("SINGPAY_WALLET_ID", WALLET_ID);

  const txId = process.argv[2];
  if (!txId) {
    throw new Error(
      "Usage: pnpm exec dotenv -e .env.test -- tsx scripts/check-singpay-status.ts <transaction_id>",
    );
  }

  const url = `${BASE_URL}/transaction/api/status/${encodeURIComponent(txId)}`;

  console.log("=== CHECK STATUS SINGPAY ===");
  console.log("URL:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "x-wallet": walletId,
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  console.log("HTTP STATUS:", res.status);
  console.log("CONTENT-TYPE:", contentType);
  console.log("RAW RESPONSE:", raw);

  if (!res.ok) {
    throw new Error(`Erreur statut ${res.status}: ${raw}`);
  }
}

main().catch((error) => {
  console.error("ECHEC CHECK STATUS");
  console.error(error);
  process.exit(1);
});