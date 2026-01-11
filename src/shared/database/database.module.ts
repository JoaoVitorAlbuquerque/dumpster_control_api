import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AccountsRepository } from './repositories/accounts.repositories';
import { RequestsRepository } from './repositories/requests.repositories';
import { AuditLogsRepository } from './repositories/audit-logs.repositories';

@Global()
@Module({
  providers: [
    PrismaService,
    AccountsRepository,
    RequestsRepository,
    AuditLogsRepository,
  ],
  exports: [AccountsRepository, RequestsRepository, AuditLogsRepository],
})
export class DatabaseModule {}
