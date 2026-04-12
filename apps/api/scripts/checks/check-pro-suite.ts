import "dotenv/config";
import { spawn } from "node:child_process";

const scripts = [
  "scripts/checks/check-auth-pro.ts",
  "scripts/checks/check-pro-dashboard.ts",
  "scripts/checks/check-pro-employees.ts",
  "scripts/checks/check-pro-services.ts",
  "scripts/checks/check-pro-expenses.ts",
  "scripts/checks/check-pro-agenda.ts",
];

function runScript(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ Running ${script}`);

    const child = spawn("pnpm", ["exec", "tsx", script], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${script} failed with exit code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function main() {
  for (const script of scripts) {
    await runScript(script);
  }

  console.log("\n✅ PRO SUITE PASSED");
}

main().catch((error) => {
  console.error("\n❌ PRO SUITE FAILED");
  console.error(error);
  process.exit(1);
});