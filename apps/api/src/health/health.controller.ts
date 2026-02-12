import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    const db = await this.prisma.$queryRaw`SELECT 1 as ok`;
    return {
      status: "ok",
      service: "ambya-api",
      db: db ? "ok" : "ko",
      timestamp: new Date().toISOString(),
    };
  }
}
