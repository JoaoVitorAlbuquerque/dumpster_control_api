import { Module } from '@nestjs/common';
import { AccountsModule } from './modules/accounts/accounts.module';
import { DatabaseModule } from './shared/database/database.module';

@Module({
  imports: [AccountsModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
