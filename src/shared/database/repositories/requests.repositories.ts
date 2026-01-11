import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';

@Injectable()
export class RequestsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.RequestCreateArgs) {
    return this.prismaService.request.create(createDto);
  }

  findMany(findManyDto: Prisma.RequestFindManyArgs) {
    return this.prismaService.request.findMany(findManyDto);
  }

  findUnique(findUniqueDto: Prisma.RequestFindUniqueArgs) {
    return this.prismaService.request.findUnique(findUniqueDto);
  }

  findFirst(findFirstDto: Prisma.RequestFindFirstArgs) {
    return this.prismaService.request.findFirst(findFirstDto);
  }

  update(updateDto: Prisma.RequestUpdateArgs) {
    return this.prismaService.request.update(updateDto);
  }

  delete(deleteDto: Prisma.RequestDeleteArgs) {
    return this.prismaService.request.delete(deleteDto);
  }
}
