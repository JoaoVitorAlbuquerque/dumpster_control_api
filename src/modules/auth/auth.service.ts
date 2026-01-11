import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountsRepository } from 'src/shared/database/repositories/accounts.repositories';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/sign-up.dto';
import { SigninDto } from './dto/sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountsRepo: AccountsRepository,
    private readonly jwtService: JwtService,
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

  private generateAccessToken(accountId: string) {
    return this.jwtService.signAsync({ sub: accountId });
  }
}
