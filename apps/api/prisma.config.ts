import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

const appEnv = process.env.APP_ENV || "development";

const envFileMap: Record<string, string> = {
  development: ".env",
  dev: ".env",
  test: ".env.test",
  demo: ".env.demo",
};

const envFile = envFileMap[appEnv] || ".env";

loadEnv({
  path: path.resolve(process.cwd(), envFile),
  override: false,
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    `DATABASE_URL is missing. APP_ENV=${appEnv}, expected env file=${envFile}`
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});