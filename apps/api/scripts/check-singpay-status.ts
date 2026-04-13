import fetch from "node-fetch";

const BASE_URL = process.env.SINGPAY_BASE_URL || "https://client.singpay.ga";
const CLIENT_ID = process.env.SINGPAY_CLIENT_ID;
const CLIENT_SECRET = process.env.SINGPAY_CLIENT_SECRET;
const WALLET_ID = process.env.SINGPAY_WALLET_ID;

function assertEnv() {
  const missing: string[] = [];

  if (!CLIENT_ID) missing.push("SINGPAY_CLIENT_ID");
  if (!CLIENT_SECRET) missing.push("SINGPAY_CLIENT_SECRET");
  if (!WALLET_ID) missing.push("SINGPAY_WALLET_ID");

  if (missing.length > 0) {
    throw new Error(`Variables manquantes: ${missing.join(", ")}`);
  }
}

async function checkStatus() {
  assertEnv();

  const txId = process.argv[2];

  if (!txId) {
    throw new Error("Usage: pnpm exec dotenv -e .env.test -- tsx scripts/check-singpay-status.ts <transactionId>");
  }

  const response = await fetch(`${BASE_URL}/transaction/api/status/${encodeURIComponent(txId)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-client-id": CLIENT_ID!,
      "x-client-secret": CLIENT_SECRET!,
      "x-wallet": WALLET_ID!,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  console.log("HTTP STATUS:", response.status);
  console.log("CONTENT-TYPE:", contentType);
  console.log("RAW RESPONSE:", raw);

  if (!response.ok) {
    throw new Error(`Erreur vérification statut: ${response.status} ${raw}`);
  }
}

checkStatus().catch((error) => {
  console.error("ECHEC VERIFICATION STATUT");
  console.error(error);
  process.exit(1);
});