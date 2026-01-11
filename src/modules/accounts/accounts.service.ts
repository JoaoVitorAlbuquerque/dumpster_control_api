import { Injectable } from '@nestjs/common';
import { AccountsRepository } from 'src/shared/database/repositories/accounts.repositories';

@Injectable()
export class AccountsService {
  constructor(private readonly accountsRepo: AccountsRepository) {}

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
}
