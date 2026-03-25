import { Injectable } from '@nestjs/common'
import { AdminScope, Prisma, UserRole } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { RequestContextService } from '../request-context/request-context.service'

export type AuditLogInput = {
  actionType: string
  entityType: string
  entityId?: string | null
  actorUserId?: string | null
  actorRole?: UserRole | null
  actorAdminScope?: AdminScope | null
  oldValue?: unknown
  newValue?: unknown
  metadata?: unknown
  route?: string | null
  method?: string | null
  requestId?: string | null
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async log(input: AuditLogInput) {
    const context = this.requestContext.get()
    const actor = context?.actor

    await this.prisma.auditLog.create({
      data: {
        actionType: input.actionType,
        entityType: input.entityType,
        entityId: input.entityId ?? undefined,
        actorUserId: input.actorUserId ?? actor?.userId ?? undefined,
        actorRole: input.actorRole ?? actor?.role ?? undefined,
        actorAdminScope:
          input.actorAdminScope === undefined
            ? actor?.adminScope ?? undefined
            : input.actorAdminScope ?? undefined,
        route: input.route ?? context?.route,
        method: input.method ?? context?.method,
        requestId: input.requestId ?? context?.requestId,
        oldValue: input.oldValue ?? undefined,
        newValue: input.newValue ?? undefined,
        metadata: input.metadata ?? undefined,
      },
    })
  }

  async logCrudMutation(input: {
    action: 'create' | 'update' | 'delete'
    entityType: string
    entityId?: string | null
    oldValue?: unknown
    newValue?: unknown
    metadata?: Record<string, unknown>
  }) {
    await this.log({
      actionType: `${input.entityType}.${input.action}`,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValue: toAuditJson(input.oldValue),
      newValue: toAuditJson(input.newValue),
      metadata: toAuditJson(input.metadata),
    })
  }

  async logHttpMutation(input: {
    actionType: string
    entityType: string
    entityId?: string | null
    metadata?: Record<string, unknown>
  }) {
    await this.log({
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: toAuditJson(input.metadata),
    })
  }
}

function toAuditJson(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return Prisma.JsonNull
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}
