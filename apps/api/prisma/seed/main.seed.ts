import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { seedDev } from "./data/dev.seed";
import { seedTest } from "./data/test.seed";
import { seedDemo } from "./data/demo.seed";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

if (process.env.NODE_ENV === "production") {
  throw new Error("Seeding is disabled in production");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const mode = process.env.SEED_SCENARIO || process.env.APP_ENV || "development";

  console.log(`🌱 Running seed mode: ${mode}`);

  switch (mode) {
    case "development":
    case "dev":
      await seedDev(prisma);
      break;

    case "test":
      await seedTest(prisma);
      break;

    case "demo":
      await seedDemo(prisma);
      break;

    default:
      throw new Error(`Unknown seed mode: ${mode}`);
  }
}

main()
  .then(async () => {
    console.log("✅ Seed finished");
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error("❌ Seed failed");
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });