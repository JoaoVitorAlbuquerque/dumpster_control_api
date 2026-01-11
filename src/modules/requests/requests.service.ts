import { customAlphabet } from 'nanoid';

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestsRepository } from 'src/shared/database/repositories/requests.repositories';
import { ValidateUserRoleService } from './validate-user-role.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class RequestsService {
  constructor(
    private readonly requestsRepo: RequestsRepository,
    private readonly validateUserRoleService: ValidateUserRoleService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(userId: string, createRequestDto: CreateRequestDto, req?: any) {
    const protocol = this.generateProtocol();

    const request = await this.requestsRepo.create({
      data: {
        accountId: userId,
        protocol,
        ...createRequestDto,
      },
    });

    await this.auditLogsService.create({
      actorAccountId: userId,
      entityId: request.id,
      action: 'CREATE_REQUEST',
      entity: 'Request',
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
      after: request,
    });

    return request;
  }

  async createPublic(createRequestDto: CreateRequestDto, req?: any) {
    const protocol = this.generateProtocol();

    const request = await this.requestsRepo.create({
      data: {
        protocol,
        ...createRequestDto,
      },
    });

    await this.auditLogsService.create({
      actorAccountId: null,
      entityId: request.id,
      action: 'CREATE_PUBLIC_REQUEST',
      entity: 'Request',
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
      after: request,
    });

    return request;
  }

  async findAll(
    accountId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      page: number;
      limit: number;
    },
  ) {
    await this.validateUserRoleService.validate(accountId);

    const start = filters.startDate ? new Date(filters.startDate) : undefined;

    const end = filters.endDate ? new Date(filters.endDate) : undefined;

    const where = {
      orderDate: {
        gte: start,
        lt: end,
      },
      isActive: true,
    };

    const [data, totalCount] = await Promise.all([
      this.requestsRepo.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
      }),

      this.requestsRepo.count({ where }),
    ]);

    return { data, totalCount };
  }

  findAllByUserId(accountId: string) {
    return this.requestsRepo.findMany({
      where: { accountId, isActive: true },
    });
  }

  async findByProtocol(protocolCode: string) {
    const request = await this.requestsRepo.findUnique({
      where: { protocol: protocolCode, isActive: true },
    });

    if (!request) {
      throw new NotFoundException(
        'Protocolo não encontrado, por favor tente outro ou crie uma nova solicitação.',
      );
    }

    return request;
  }

  findAllByStatusRequested() {
    return this.requestsRepo.findMany({
      where: { status: 'REQUESTED', isActive: true },
    });
  }

  findAllRequestsByUser() {
    return this.requestsRepo.findMany({
      where: {
        accountId: null,
        isActive: true,
      },
    });
  }

  async update(
    accountId: string,
    requestId: string,
    updateRequestDto: UpdateRequestDto,
    req?: any,
  ) {
    await this.validateUserRoleService.validate(accountId);

    const before = await this.requestsRepo.findUnique({
      where: { id: requestId, isActive: true },
    });

    const after = await this.requestsRepo.update({
      where: { id: requestId, isActive: true },
      data: {
        ...updateRequestDto,
        updatedAt: new Date(),
      },
    });

    await this.auditLogsService.create({
      actorAccountId: accountId,
      entityId: requestId,
      action: 'UPDATE',
      entity: 'Request',
      before,
      after,
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
    });

    return after;
  }

  async softDelete(accountId: string, requestId: string, req?: any) {
    await this.validateUserRoleService.validate(accountId);

    const before = await this.requestsRepo.findUnique({
      where: { id: requestId, isActive: true },
    });

    const after = await this.requestsRepo.update({
      where: { id: requestId, isActive: true },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    await this.auditLogsService.create({
      actorAccountId: accountId,
      entityId: requestId,
      action: 'SOFT_DELETE',
      entity: 'Request',
      before,
      after,
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
    });

    return { 204: 'No Content' };
  }

  remove(id: number) {
    return `This action removes a #${id} request`;
  }

  private generateProtocol(): string {
    const nano = customAlphabet('0123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

    return `REQ${nano()}`;
  }
}
