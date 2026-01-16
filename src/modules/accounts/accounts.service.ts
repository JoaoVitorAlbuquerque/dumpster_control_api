import { Injectable } from '@nestjs/common';
import { AccountsRepository } from 'src/shared/database/repositories/accounts.repositories';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ValidateUserRoleService } from './validate-user-role.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountsRepo: AccountsRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly validateUserRoleService: ValidateUserRoleService,
  ) {}

  getUserById(userId: string) {
    return this.accountsRepo.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async update(
    userId: string,
    accountId: string,
    updateAccountDto: UpdateAccountDto,
    req?: any,
  ) {
    await this.validateUserRoleService.validate(userId);

    const before = await this.accountsRepo.findUnique({
      where: { id: accountId, isActive: true },
    });

    const after = await this.accountsRepo.update({
      where: { id: accountId, isActive: true },
      data: {
        ...updateAccountDto,
        updatedAt: new Date(),
      },
    });

    await this.auditLogsService.create({
      actorAccountId: userId,
      entityId: accountId,
      action: 'UPDATE',
      entity: 'Account',
      before,
      after,
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
    });

    return after;
  }
}
