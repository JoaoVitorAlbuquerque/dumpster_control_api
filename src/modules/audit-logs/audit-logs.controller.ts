import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  create(@Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogsService.create(createAuditLogDto);
  }

  @Get()
  findAll() {
    return this.auditLogsService.findAll();
  }

  @Delete(':auditLogId')
  remove(@Param('auditLogId', ParseUUIDPipe) auditLogId: string) {
    return this.auditLogsService.remove(auditLogId);
  }
}
