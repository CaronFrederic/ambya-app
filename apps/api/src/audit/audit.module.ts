import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { RequestContextModule } from '../request-context/request-context.module'
import { AuditService } from './audit.service'

@Module({
  imports: [PrismaModule, RequestContextModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
