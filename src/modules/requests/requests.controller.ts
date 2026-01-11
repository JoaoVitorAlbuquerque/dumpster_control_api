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
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ActiveUserId } from 'src/shared/decorators/ActiveUserId';
import { IsPublic } from 'src/shared/decorators/IsPublic';

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
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.requestsService.findAll(userId, {
      startDate,
      endDate,
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
