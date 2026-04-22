import { runScript } from "./scripts/checks/utils/run-script";

async function main() {
  const scripts = [
    "scripts/checks/check-pro-employees-crud.ts",
    "scripts/checks/check-pro-services-crud.ts",
    "scripts/checks/check-pro-expenses-crud.ts",
    "scripts/checks/check-pro-promotions-crud.ts",
    "scripts/checks/check-pro-accounting-reports-crud.ts",
  ];

  for (const script of scripts) {
    await runScript(script);
  }

  console.log("✅ PRO CRUD SUITE PASSED");
}

main().catch((error) => {
  console.error("❌ PRO CRUD SUITE FAILED");
  console.error(error);
  process.exit(1);
});