import { Module } from '@nestjs/common';
import { AccountsModule } from './modules/accounts/accounts.module';

@Module({
  imports: [AccountsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
