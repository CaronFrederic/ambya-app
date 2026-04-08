import { PrismaClient } from "src/generated/prisma";
import { seedTest } from "./data/dev.seed";
const prisma = new PrismaClient();

async function main() {
  const mode = process.argv[2] ?? "test";

  console.log(`🌱 Running seed mode: ${mode}`);

  switch (mode) {
    case "test":
      await seedTest(prisma);
      break;

    case "dev":
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
  })
  .catch(async (error) => {
    console.error("❌ Seed failed");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });