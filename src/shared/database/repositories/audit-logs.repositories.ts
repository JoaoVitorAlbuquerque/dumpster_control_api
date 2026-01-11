import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(createDto: Prisma.AuditLogCreateArgs) {
    return this.prismaService.auditLog.create(createDto);
  }

  findMany(findManyDto: Prisma.AuditLogFindManyArgs) {
    return this.prismaService.auditLog.findMany(findManyDto);
  }

  delete(deleteDto: Prisma.AuditLogDeleteArgs) {
    return this.prismaService.auditLog.delete(deleteDto);
  }
}
