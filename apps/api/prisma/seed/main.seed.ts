import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { seedTest } from "./data/test.seed";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const mode = process.argv[2] ?? "dev";

  console.log(`🌱 Running seed mode: ${mode}`);

  switch (mode) {
    case "dev":
      await seedTest(prisma);
      break;

    case "test":
      await seedTest(prisma);
      break;

    case "demo":
      await seedTest(prisma);
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