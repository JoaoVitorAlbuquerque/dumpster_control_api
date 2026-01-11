import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountsRepository } from 'src/shared/database/repositories/accounts.repositories';

@Injectable()
export class ValidateUserRoleService {
  constructor(private readonly accountsRepo: AccountsRepository) {}

  async validate(accountId: string) {
    const user = await this.accountsRepo.findFirst({
      where: { id: accountId, isActive: true },
    });

    if (user.role === 'USER') {
      throw new UnauthorizedException();
    }
  }

  // async validateOperator(accountId: string) {
  //   const isOperator = await this.accountsRepo.findFirst({
  //     where: { id: accountId, role: 'OPERATOR', isActive: true },
  //   });

  //   if (!isOperator) {
  //     throw new UnauthorizedException();
  //   }
  // }
}
