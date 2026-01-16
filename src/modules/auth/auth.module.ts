import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { env } from 'src/shared/config/env';
import { AccountsRepository } from 'src/shared/database/repositories/accounts.repositories';
import { QueuesModule } from 'src/queues/queues.module';
import { PrismaService } from 'src/shared/database/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.jwtSecret,
      signOptions: { expiresIn: '1d' },
    }),
    QueuesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AccountsRepository, PrismaService],
})
export class AuthModule {}
