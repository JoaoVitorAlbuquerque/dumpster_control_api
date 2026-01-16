import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('/me')
  me(@ActiveUserId() userId: string) {
    return this.accountsService.getUserById(userId);
  }

  @Patch(':accountId')
  update(
    @ActiveUserId() userId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @Req() req?: any,
  ) {
    return this.accountsService.update(
      userId,
      accountId,
      updateAccountDto,
      req,
    );
  }
}
