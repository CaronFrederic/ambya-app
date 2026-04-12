import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "pro@ambya.com" },
  });

  console.log(
    JSON.stringify(
      {
        exists: !!user,
        role: user?.role ?? null,
        isActive: user?.isActive ?? null,
        hasPassword: !!user?.password,
      },
      null,
      2
    )
  );

  if (user?.password) {
    const ok = await bcrypt.compare("password123", user.password);
    console.log("bcryptCompare(password123) =", ok);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });