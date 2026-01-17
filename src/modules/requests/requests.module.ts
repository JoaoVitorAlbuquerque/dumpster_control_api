import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { ValidateUserRoleService } from './validate-user-role.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { QueuesModule } from 'src/queues/queues.module';

@Module({
  imports: [QueuesModule],
  controllers: [RequestsController],
  providers: [RequestsService, ValidateUserRoleService, AuditLogsService],
})
export class RequestsModule {}
