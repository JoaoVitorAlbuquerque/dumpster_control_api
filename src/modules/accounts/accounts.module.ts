import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { ValidateUserRoleService } from './validate-user-role.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, AuditLogsService, ValidateUserRoleService],
})
export class AccountsModule {}
