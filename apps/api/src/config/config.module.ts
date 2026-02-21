import { Module } from '@nestjs/common'
import { ConfigController } from './config.controller'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [ConfigController],
  providers: [PrismaService],
})
export class ConfigModule {}
