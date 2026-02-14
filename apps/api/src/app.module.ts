import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module'
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [AppointmentsModule, 
    AuthModule, ConfigModule.forRoot({ isGlobal: true }), HealthModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
