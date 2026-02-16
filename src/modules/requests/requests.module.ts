import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { ValidateUserRoleService } from './validate-user-role.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { QueuesModule } from 'src/queues/queues.module';
import { PrismaService } from 'src/shared/database/prisma.service';

@Module({
  imports: [QueuesModule],
  controllers: [RequestsController],
  providers: [
    RequestsService,
    ValidateUserRoleService,
    AuditLogsService,
    PrismaService,
  ],
})
export class RequestsModule {}
