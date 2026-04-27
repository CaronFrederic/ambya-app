import { runScript } from "./scripts/checks/utils/run-script";

async function main() {
  try {
    await runScript("scripts/checks/check-auth-pro.ts");
    await runScript("scripts/checks/check-pro-dashboard.ts");
    await runScript("scripts/checks/check-pro-employees.ts");
    await runScript("scripts/checks/check-pro-services.ts");
    await runScript("scripts/checks/check-pro-expenses.ts");
    await runScript("scripts/checks/check-pro-agenda.ts");
    await runScript("scripts/checks/check-pro-promotions.ts");
    await runScript("scripts/checks/check-pro-loyalty.ts");
    await runScript("scripts/checks/check-pro-accounting-reports.ts");
    await runScript("scripts/checks/check-pro-booking-history-export.ts");

    console.log("\n✅ PRO SUITE PASSED");
  } catch (error) {
    console.error("\n❌ PRO SUITE FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();