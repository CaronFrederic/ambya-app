import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('config')
export class ConfigController {
  constructor(private prisma: PrismaService) {}

  @Get('countries')
  async countries() {
    const items = await this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { code: true, name: true, currency: true },
    })

    return { items }
  }
}
