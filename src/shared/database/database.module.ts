import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AccountsRepository } from './repositories/accounts.repositories';

@Global()
@Module({
  providers: [PrismaService, AccountsRepository],
  exports: [AccountsRepository],
})
export class DatabaseModule {}
