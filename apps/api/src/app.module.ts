import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { join } from 'path';
import { PrismaModule } from "./prisma/prisma.module";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module'
import { AppointmentsModule } from './appointments/appointments.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { MeModule } from './me/me.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { PaymentsModule } from './payments/payments.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { UsersModule } from './users/users.module';
import { SalonsModule } from './salons/salons.module';
import { EmployeesModule } from './employees/employees.module';
import { ServicesModule } from './services/services.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExportsModule } from './exports/exports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClientsModule } from './clients/clients.module';
import { SalonSettingsModule } from './salon-settings/salon-settings.module'

@Module({
  imports: [AppConfigModule, AppointmentsModule, DashboardModule,SalonSettingsModule,
    AuthModule, MeModule, PaymentMethodsModule, PaymentsModule, DiscoveryModule, UsersModule, SalonsModule, EmployeesModule, ServicesModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), 'apps/api/.env'),
        join(process.cwd(), '.env'),
        join(__dirname, '../.env'),
      ],
    }), HealthModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
