import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';

@Injectable()
export class AccountsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.AccountCreateArgs) {
    return this.prismaService.account.create(createDto);
  }

  findUnique(findUniqueDto: Prisma.AccountFindUniqueArgs) {
    return this.prismaService.account.findUnique(findUniqueDto);
  }

  findFirst(findFirstDto: Prisma.AccountFindFirstArgs) {
    return this.prismaService.account.findFirst(findFirstDto);
  }
}
