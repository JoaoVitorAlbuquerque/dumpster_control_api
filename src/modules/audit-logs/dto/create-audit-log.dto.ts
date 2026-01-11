import { Role } from 'src/modules/auth/entities/Role';

export class CreateAuditLogDto {
  actorAccountId?: string;
  entityId?: string;
  action: string;
  entity: string;
  actorRole?: Role;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
  isActive?: boolean;
}
