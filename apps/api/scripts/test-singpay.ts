import fetch from "node-fetch";

const BASE_URL = "https://client.singpay.ga";

// Remplace ces valeurs par celles de ton compte SingPay
const CLIENT_ID = "10d29120-bb03-49de-a4b3-72d690aea870";
const CLIENT_SECRET = "1a9d5ac06558c2f5bf5116772b0b329d834b2c44d651948a2645411d752b647e";
// const WALLET_ID = "TON_WALLET_ID";

async function testSingPayExt() {
  const reference = `AMBYA-TEST-${Date.now()}`;

  const res = await fetch(`${BASE_URL}/ext`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-client-id": CLIENT_ID,
      "x-client-secret": CLIENT_SECRET,
      // "x-wallet": WALLET_ID,
    },
    body: JSON.stringify({
      // portefeuille: WALLET_ID,
      reference,
      redirect_success: "https://example.com/success",
      redirect_error: "https://example.com/error",
      amount: 100,
      disbursement: "false",
      logoURL: "https://ambya.app/logo.png",
      isTransfer: false,
    }),
  });

  const contentType = res.headers.get("content-type");
  const raw = await res.text();

  console.log("STATUS:", res.status);
  console.log("CONTENT-TYPE:", contentType);
  console.log("BODY:", raw);

  if (contentType?.includes("application/json")) {
    try {
      const data = JSON.parse(raw);
      console.log("\nLien de paiement:", data.link);
      console.log("Expiration:", data.exp);
    } catch (e) {
      console.error("JSON invalide:", e);
    }
  }
}

testSingPayExt().catch(console.error);