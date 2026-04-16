import fetch from "node-fetch";

const BASE_URL = process.env.SINGPAY_BASE_URL || "https://client.singpay.ga";
const CLIENT_ID = process.env.SINGPAY_CLIENT_ID;
const CLIENT_SECRET = process.env.SINGPAY_CLIENT_SECRET;
const WALLET_ID = process.env.SINGPAY_WALLET_ID;
const TEST_MSISDN = process.env.SINGPAY_AIRTEL_TEST_MSISDN;

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
  const msisdn = requireEnv("SINGPAY_AIRTEL_TEST_MSISDN", TEST_MSISDN);

  const url = `${BASE_URL}/74/paiement`;
  const reference = `AMBYA-AIRTEL-${Date.now()}`;

  const payload = {
    amount: 100,
    reference,
    client_msisdn: msisdn,
    portefeuille: walletId,
    disbursement: "false",
    isTransfer: false,
  };

  console.log("=== TEST SINGPAY AIRTEL ===");
  console.log("URL:", url);
  console.log("REFERENCE:", reference);
  console.log("PAYLOAD:", payload);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "x-wallet": walletId,
    },
    body: JSON.stringify(payload),
  });

  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  console.log("HTTP STATUS:", res.status);
  console.log("CONTENT-TYPE:", contentType);
  console.log("RAW RESPONSE:", raw);

  let data: any = null;
  if (contentType.includes("application/json")) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.error("JSON invalide:", error);
    }
  }

  if (!res.ok) {
    throw new Error(`Erreur Airtel ${res.status}: ${raw}`);
  }

  const txId =
    data?.transaction?._id ??
    data?.transaction?.id ??
    data?._id ??
    data?.id ??
    null;

  console.log("TRANSACTION_ID:", txId);
  console.log("STATUS:", data?.transaction?.status ?? data?.status ?? "inconnu");
  console.log("RESULT:", data?.transaction?.result ?? data?.result ?? "inconnu");
}

main().catch((error) => {
  console.error("ECHEC TEST AIRTEL");
  console.error(error);
  process.exit(1);
});