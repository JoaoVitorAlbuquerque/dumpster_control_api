import { randomUUID } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import Redis from 'ioredis';
import { compare, hash } from 'bcryptjs';

import { AccountsRepository } from 'src/shared/database/repositories/accounts.repositories';
import { SignupDto } from './dto/sign-up.dto';
import { SigninDto } from './dto/sign-in.dto';
import { MailQueue } from 'src/queues/mail.queue';
// import { env } from 'src/shared/config/env';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
});

@Injectable()
export class AuthService {
  constructor(
    private readonly accountsRepo: AccountsRepository,
    private readonly jwtService: JwtService,
    private mailQueue: MailQueue,
  ) {}

  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;

    const account = await this.accountsRepo.findUnique({
      where: { email },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await compare(password, account.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = await this.generateAccessToken(account.id);

    return { accessToken };
  }

  async signup(signupDto: SignupDto) {
    const { name, cpf, email, password, role } = signupDto;

    const emailTaken = await this.accountsRepo.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailTaken) {
      throw new ConflictException('This email is already in use.');
    }

    const hashedPassword = await hash(password, 12);

    const account = await this.accountsRepo.create({
      data: { name, cpf, email, password: hashedPassword, role },
    });

    const accessToken = await this.generateAccessToken(account.id);

    return { accessToken };
  }

  async forgotPassword(email: string) {
    const user = await this.accountsRepo.findUnique({ where: { email } });
    // sempre retorna ok pra não vazar se existe ou não
    if (!user) return { ok: true };

    const jti = randomUUID();

    const token = this.jwtService.sign(
      { email: user.email, jti },
      {
        secret: process.env.JWT_RESET_SECRET,
        expiresIn: '15m',
        subject: String(user.id),
      },
    );

    // salva jti no redis por 15min
    const ttlSeconds = 15 * 60;
    await redis.set(`pwdreset:${jti}`, '1', 'EX', ttlSeconds);

    const link = `${process.env.FRONT_URL}/reset-password?token=${encodeURIComponent(token)}`;

    await this.mailQueue.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      link,
    });

    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const payload = await this.jwtService.verifyAsync<{
      jti: string;
      sub: string;
    }>(token, {
      secret: process.env.JWT_RESET_SECRET,
    });

    const userId = payload.sub;
    const jti = payload.jti;

    console.log({ payload });
    console.log({ userId });
    console.log({ jti });

    // one-time use
    const exists = await redis.get(`pwdreset:${jti}`);
    if (!exists) throw new Error('Token inválido/expirado ou já usado.');

    await redis.del(`pwdreset:${jti}`);

    const passwordHash = await hash(newPassword, 12);
    await this.accountsRepo.update({
      where: { id: userId },
      data: { password: passwordHash },
    });

    // opcional: revogar todos refresh tokens (força login novamente)
    // await this.prisma.refreshToken.updateMany({
    //   where: { userId, revokedAt: null },
    //   data: { revokedAt: new Date() },
    // });

    return { ok: true };
  }

  private generateAccessToken(accountId: string) {
    return this.jwtService.signAsync({ sub: accountId });
  }
}
