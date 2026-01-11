import { Controller, Get } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('/me')
  me(@ActiveUserId() userId: string) {
    return this.accountsService.getUserById(userId);
  }
}
