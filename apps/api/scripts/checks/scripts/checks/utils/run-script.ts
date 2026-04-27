import { spawn } from "child_process";

export function runScript(scriptPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ Running ${scriptPath}`);

    const child = spawn("pnpm", ["exec", "tsx", scriptPath], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
          reject(new Error(`${scriptPath} failed with exit code ${code}`));
    });
  });
}