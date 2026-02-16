import { customAlphabet } from 'nanoid';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestsRepository } from 'src/shared/database/repositories/requests.repositories';
import { ValidateUserRoleService } from './validate-user-role.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { GeocodeQueue } from 'src/queues/geocode.queue';
import { Status } from './entities/Status';
import { PrismaService } from 'src/shared/database/prisma.service';

@Injectable()
export class RequestsService {
  constructor(
    private readonly requestsRepo: RequestsRepository,
    private readonly validateUserRoleService: ValidateUserRoleService,
    private readonly auditLogsService: AuditLogsService,
    private readonly geocodeQueue: GeocodeQueue,
    private readonly prismaService: PrismaService,
  ) {}

  async create(userId: string, createRequestDto: CreateRequestDto, req?: any) {
    const protocol = this.generateProtocol();

    const request = await this.requestsRepo.create({
      data: {
        accountId: userId,
        protocol,
        ...createRequestDto,

        latitude: null,
        longitude: null,
        addressFormatted: null,
        geocodeStatus: 'PENDING',
        insideCity: null,
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

    // enfileira geocode
    await this.geocodeQueue.enqueue(request.id, request.address);

    return {
      id: request.id,
      protocol: request.protocol,
      status: request.status,
      priority: request.priority,
      address: request.address,
      geocodeStatus: request.geocodeStatus, // PENDING
      insideCity: request.insideCity, // null
      location: null,
    };
  }

  async createPublic(createRequestDto: CreateRequestDto, req?: any) {
    const protocol = this.generateProtocol();

    const request = await this.requestsRepo.create({
      data: {
        protocol,
        ...createRequestDto,

        latitude: null,
        longitude: null,
        addressFormatted: null,
        geocodeStatus: 'PENDING',
        insideCity: null,
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

    await this.geocodeQueue.enqueue(request.id, request.address);

    return {
      id: request.id,
      protocol: request.protocol,
      status: request.status,
      priority: request.priority,
      address: request.address,
      geocodeStatus: request.geocodeStatus,
      insideCity: request.insideCity,
      location: null,
    };
  }

  async findAll(
    accountId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      status?: Status;
      accountId?: string | null;
      page: number;
      limit: number;
    },
  ) {
    await this.validateUserRoleService.validate(accountId);

    const start = filters.startDate ? new Date(filters.startDate) : undefined;

    const end = filters.endDate ? new Date(filters.endDate) : undefined;
    if (end) end.setHours(23, 59, 59, 999);

    // const where = {
    //   orderDate: {
    //     gte: start,
    //     lt: end,
    //   },
    //   status: filters.status,
    //   accountId: filters.accountId,
    //   isActive: true,
    // };

    const where: any = {
      isActive: true,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.accountId !== undefined
        ? { accountId: filters.accountId }
        : {}),
      ...(start || end
        ? {
            orderDate: {
              ...(start ? { gte: start } : {}),
              ...(end ? { lte: end } : {}),
            },
          }
        : {}),
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

  async findDeliveredForMap() {
    const rows = await this.requestsRepo.findMany({
      where: {
        status: 'DELIVERED',
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
        geocodeStatus: 'DONE',
      },
      select: {
        id: true,
        protocol: true,
        addressFormatted: true,
        address: true,
        latitude: true,
        longitude: true,
        deliveryDate: true,
        activity: true,
        priority: true,
        name: true,
        contact: true,
      },
      orderBy: { deliveryDate: 'desc' },
    });

    // Devolve em formato “map-friendly”
    return rows.map((r) => ({
      id: r.id,
      protocol: r.protocol,
      title: r.addressFormatted ?? r.address,
      lat: r.latitude,
      lng: r.longitude,
      deliveryDate: r.deliveryDate,
      activity: r.activity,
      priority: r.priority,
    }));
  }

  async getAnalytics(filters: {
    startDate?: string;
    endDate?: string;
    bucket: 'day' | 'week' | 'month';
  }) {
    const start = filters.startDate ? new Date(filters.startDate) : undefined;
    const end = filters.endDate ? new Date(filters.endDate) : undefined;

    const where: any = {
      isActive: true,
      ...(start || end
        ? {
            createdAt: {
              ...(start ? { gte: start } : {}),
              ...(end ? { lt: end } : {}),
            },
          }
        : {}),
    };

    // Summary
    const [total, byStatus, byPriority, byActivity] = await Promise.all([
      this.requestsRepo.count({ where }),
      this.prismaService.request.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prismaService.request.groupBy({
        by: ['priority'],
        where,
        _count: { _all: true },
      }),
      this.prismaService.request.groupBy({
        by: ['activity'],
        where,
        _count: { _all: true },
      }),
    ]);

    const statusMap = new Map<string, number>(
      byStatus.map((x) => [x.status, x._count._all]),
    );
    const open =
      (statusMap.get('REQUESTED') ?? 0) +
      (statusMap.get('UNDER_REVIEW') ?? 0) +
      (statusMap.get('APPROVED') ?? 0);

    const delivered = statusMap.get('DELIVERED') ?? 0;
    const completed = statusMap.get('COMPLETED') ?? 0;
    const cancelled = statusMap.get('CANCELLED') ?? 0;

    // Série temporal (Postgres)
    // const bucketSql =
    //   filters.bucket === 'month'
    //     ? 'month'
    //     : filters.bucket === 'week'
    //       ? 'week'
    //       : 'day';

    const bucketSql =
      filters.bucket === 'month'
        ? Prisma.sql`'month'`
        : filters.bucket === 'week'
          ? Prisma.sql`'week'`
          : Prisma.sql`'day'`;

    //   SELECT
    const timeSeries = await this.prismaService.$queryRaw<
      Array<{ date: string; created: number; delivered: number }>
    >(Prisma.sql`
      SELECT
        to_char(date_trunc(${bucketSql}, "created_at"), 'YYYY-MM-DD') AS "date",
        COUNT(*)::int AS "created",
        COUNT(*) FILTER (WHERE "status" = 'DELIVERED')::int AS "delivered"
      FROM "requests"
      WHERE "is_active" = true
      ${start ? Prisma.sql`AND "created_at" >= ${start}` : Prisma.empty}
      ${end ? Prisma.sql`AND "created_at" < ${end}` : Prisma.empty}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    // SLA médio (em horas)
    const sla = await this.prismaService.$queryRaw<
      Array<{
        avg_to_deliver_hours: number | null;
        avg_to_complete_hours: number | null;
      }>
    >(Prisma.sql`
      SELECT
        AVG(EXTRACT(EPOCH FROM ("delivery_date" - "order_date")) / 3600.0) AS "avg_to_deliver_hours",
        AVG(EXTRACT(EPOCH FROM ("completion_date" - "order_date")) / 3600.0) AS "avg_to_complete_hours"
      FROM "requests"
      WHERE "is_active" = true
        AND "order_date" IS NOT NULL
        ${start ? Prisma.sql`AND "created_at" >= ${start}` : Prisma.empty}
        ${end ? Prisma.sql`AND "created_at" < ${end}` : Prisma.empty}
    `);

    return {
      summary: { total, open, delivered, completed, cancelled },
      byStatus: byStatus.map((x) => ({
        status: x.status,
        count: x._count._all,
      })),
      byPriority: byPriority.map((x) => ({
        priority: x.priority,
        count: x._count._all,
      })),
      byActivity: byActivity.map((x) => ({
        activity: x.activity,
        count: x._count._all,
      })),
      timeSeries,
      sla: {
        avgToDeliverHours: sla[0]?.avg_to_deliver_hours ?? null,
        avgToCompleteHours: sla[0]?.avg_to_complete_hours ?? null,
      },
    };
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
        deliveryDate:
          updateRequestDto.status === 'DELIVERED'
            ? new Date()
            : (before?.deliveryDate ?? null),
        completionDate:
          updateRequestDto.status === 'COMPLETED'
            ? new Date()
            : (before?.completionDate ?? null),
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
