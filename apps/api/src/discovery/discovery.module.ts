import { Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { DiscoveryController } from './discovery.controller'
import { DiscoveryService } from './discovery.service'

@Module({
  controllers: [DiscoveryController],
  providers: [DiscoveryService, PrismaService],
})
export class DiscoveryModule {}
