import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { ProAppointmentsController } from './pro-appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppointmentsController, ProAppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
