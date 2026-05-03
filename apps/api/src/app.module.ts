import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ConfigModule as AppConfigModule } from './config/config.module';
import { MeModule } from './me/me.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { PaymentsModule } from './payments/payments.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { UsersModule } from './users/users.module';
import { ProEmployeesModule } from './pro-employees/pro-employees.module';
import { EmployeePortalModule } from './employee-portal/employee-portal.module';
import { ServicesModule } from './services/services.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExportsModule } from './exports/exports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClientsModule } from './clients/clients.module';
import { SalonSettingsModule } from './salon-settings/salon-settings.module';
import { AccountingReportsModule } from './accounting-reports/accounting-reports.module';
import { PromotionsModule } from './promotions/promotions.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { AuditModule } from './audit/audit.module';
import { RequestContextModule } from './request-context/request-context.module';
import { RequestContextMiddleware } from './request-context/request-context.middleware';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    AppConfigModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), 'apps/api/.env'),
        join(process.cwd(), '.env'),
        join(__dirname, '../.env'),
      ],
    }),

    HealthModule,
    PrismaModule,

    AuthModule,
    MeModule,
    UsersModule,

    AppointmentsModule,
    PaymentMethodsModule,
    PaymentsModule,
    DiscoveryModule,

    ProEmployeesModule,
    EmployeePortalModule,
    ServicesModule,

    ExpensesModule,
    ExportsModule,
    DashboardModule,
    ClientsModule,
    SalonSettingsModule,
    AccountingReportsModule,
    PromotionsModule,
    LoyaltyModule,

    AuditModule,
    RequestContextModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
