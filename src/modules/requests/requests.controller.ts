import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Req,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';

import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';
import { IsPublic } from 'src/shared/decorators/IsPublic';
import { Status } from './entities/Status';
import { generateExcelRequestsReport } from 'src/shared/utils/excel-requests-report';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(
    @ActiveUserId() userId: string,
    @Body() createRequestDto: CreateRequestDto,
    @Req() req?: any,
  ) {
    return this.requestsService.create(userId, createRequestDto, req);
  }

  @IsPublic()
  @Post('public')
  createPublic(@Body() createRequestDto: CreateRequestDto, @Req() req?: any) {
    return this.requestsService.createPublic(createRequestDto, req);
  }

  @Get()
  findAll(
    @ActiveUserId() userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: Status,
    @Query('accountId') accountId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const parsedAccountId =
      accountId === 'null' || accountId === '' ? null : accountId;

    return this.requestsService.findAll(userId, {
      startDate,
      endDate,
      status,
      accountId: parsedAccountId,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Get('accountId')
  findAllByUserId(@ActiveUserId() accountId: string) {
    return this.requestsService.findAllByUserId(accountId);
  }

  @IsPublic()
  @Get(':protocol/protocol')
  findByProtocol(@Param('protocol') protocolCode: string) {
    return this.requestsService.findByProtocol(protocolCode);
  }

  @Get('status/requested')
  findAllByStatusRequested() {
    return this.requestsService.findAllByStatusRequested();
  }

  @Get('user/requests')
  findAllRequestsByUser() {
    return this.requestsService.findAllRequestsByUser();
  }

  @Get('map/delivered')
  findDeliveredForMap() {
    return this.requestsService.findDeliveredForMap();
  }

  @Get('analytics')
  findAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('bucket') bucket: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.requestsService.getAnalytics({ startDate, endDate, bucket });
  }

  @Get('abuse')
  async getAbuseReportData(@Query('year') queryYear?: string) {
    const year = queryYear ? parseInt(queryYear, 10) : new Date().getFullYear();
    return await this.requestsService.getAbuseReport(year);
  }

  @Get('abuse/export')
  async exportAbuseReport(
    @Res() res: Response,
    @Query('year') queryYear?: string,
  ) {
    const year = queryYear ? parseInt(queryYear, 10) : new Date().getFullYear();

    // Busca os dados através do serviço
    const reportData = await this.requestsService.getAbuseReport(year);

    // Delega a montagem e envio para o utilitário
    await generateExcelRequestsReport(reportData, res, year);
  }

  @Patch(':requestId')
  update(
    @ActiveUserId() accountId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() updateRequestDto: UpdateRequestDto,
    @Req() req?: any,
  ) {
    return this.requestsService.update(
      accountId,
      requestId,
      updateRequestDto,
      req,
    );
  }

  @Patch(':requestId/soft-delete')
  softDelete(
    @ActiveUserId() accountId: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Req() req?: any,
  ) {
    return this.requestsService.softDelete(accountId, requestId, req);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requestsService.remove(+id);
  }
}
