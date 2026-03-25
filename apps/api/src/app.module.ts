import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { join } from 'path';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { EmployeeModule } from './employee/employee.module';
import { AuditModule } from './audit/audit.module';
import { RequestContextModule } from './request-context/request-context.module';
import { RequestContextMiddleware } from './request-context/request-context.middleware';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [AppConfigModule, AppointmentsModule, 
    AuthModule, MeModule, PaymentMethodsModule, PaymentsModule, DiscoveryModule, EmployeeModule, AuditModule, RequestContextModule, AdminModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), 'apps/api/.env'),
        join(process.cwd(), '.env'),
        join(__dirname, '../.env'),
      ],
    }), HealthModule, PrismaModule],
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
    consumer.apply(RequestContextMiddleware).forRoutes('*')
  }
}
