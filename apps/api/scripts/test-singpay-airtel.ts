import fetch from "node-fetch";

const BASE_URL = process.env.SINGPAY_BASE_URL || "https://client.singpay.ga";
const CLIENT_ID = process.env.SINGPAY_CLIENT_ID;
const CLIENT_SECRET = process.env.SINGPAY_CLIENT_SECRET;
const WALLET_ID = process.env.SINGPAY_WALLET_ID;
const TEST_MSISDN = process.env.SINGPAY_AIRTEL_TEST_MSISDN;

function assertEnv() {
  const missing: string[] = [];

  if (!CLIENT_ID) missing.push("SINGPAY_CLIENT_ID");
  if (!CLIENT_SECRET) missing.push("SINGPAY_CLIENT_SECRET");
  if (!WALLET_ID) missing.push("SINGPAY_WALLET_ID");
  if (!TEST_MSISDN) missing.push("SINGPAY_AIRTEL_TEST_MSISDN");

  if (missing.length > 0) {
    throw new Error(`Variables manquantes: ${missing.join(", ")}`);
  }
}

async function testSingPayAirtel() {
  assertEnv();

  const reference = `AMBYA-AIRTEL-${Date.now()}`;
  const payload = {
    amount: 100,
    reference,
    client_msisdn: TEST_MSISDN,
    portefeuille: WALLET_ID,
    disbursement: "false",
    isTransfer: false,
  };

  console.log("=== TEST SINGPAY AIRTEL ===");
  console.log("URL:", `${BASE_URL}/74/paiement`);
  console.log("Reference:", reference);
  console.log("Payload:", payload);

  const response = await fetch(`${BASE_URL}/74/paiement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-client-id": CLIENT_ID!,
      "x-client-secret": CLIENT_SECRET!,
      "x-wallet": WALLET_ID!,
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  console.log("HTTP STATUS:", response.status);
  console.log("CONTENT-TYPE:", contentType);
  console.log("RAW RESPONSE:", raw);

  let data: any = null;

  if (contentType.includes("application/json")) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.error("Impossible de parser le JSON:", error);
    }
  }

  if (!response.ok) {
    throw new Error(`Erreur SingPay Airtel: ${response.status} ${raw}`);
  }

  console.log("\n=== RESULTAT INTERPRETE ===");
  console.log("Reference locale:", reference);
  console.log("Transaction ID possible:", data?.transaction?._id || data?.transaction?.id || data?._id || data?.id || "non trouvé");
  console.log("Status possible:", data?.transaction?.status || data?.status || "non trouvé");
  console.log("Result possible:", data?.transaction?.result || data?.result || "non trouvé");
}

testSingPayAirtel().catch((error) => {
  console.error("ECHEC TEST AIRTEL");
  console.error(error);
  process.exit(1);
});