import { Module } from '@nestjs/common';
import { AccountsModule } from './modules/accounts/accounts.module';
import { DatabaseModule } from './shared/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RequestsModule } from './modules/requests/requests.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

@Module({
  imports: [
    AccountsModule,
    DatabaseModule,
    AuthModule,
    RequestsModule,
    AuditLogsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
