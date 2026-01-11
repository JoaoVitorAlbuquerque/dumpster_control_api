import { Injectable } from '@nestjs/common';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLogsRepository } from 'src/shared/database/repositories/audit-logs.repositories';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepo: AuditLogsRepository) {}

  create(createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogsRepo.create({
      data: {
        ...createAuditLogDto,
      },
    });
  }

  findAll() {
    return this.auditLogsRepo.findMany({});
  }

  remove(auditLogId: string) {
    return this.auditLogsRepo.delete({
      where: { id: auditLogId },
    });
  }
}
