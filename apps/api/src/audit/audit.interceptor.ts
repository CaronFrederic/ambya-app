import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, from } from 'rxjs'
import { mergeMap, tap } from 'rxjs/operators'
import type { Request } from 'express'
import { UserRole } from '@prisma/client'
import type { JwtUser } from '../auth/decorators/current-user.decorator'
import { AuditService } from './audit.service'
import { RequestContextService } from '../request-context/request-context.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly requestContext: RequestContextService,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle()
    }

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>()

    const method = req.method.toUpperCase()
    const shouldLog = method === 'POST' || method === 'PATCH' || method === 'DELETE'
    const isAdminRoute = req.path.startsWith('/admin')
    const descriptor = describeRequest(req)

    return from(this.hydrateActorContext(req.user)).pipe(
      mergeMap(() =>
        next.handle().pipe(
          tap({
            next: (result) => {
              if (!shouldLog || isAdminRoute) return
              void this.auditService.logHttpMutation({
                actionType: descriptor.actionType,
                entityType: descriptor.entityType,
                entityId: extractEntityId(result, req),
              })
            },
          }),
        ),
      ),
    )
  }

  private async hydrateActorContext(actor?: JwtUser) {
    if (!actor) return

    if (actor.role !== UserRole.ADMIN) {
      this.requestContext.setActor({
        userId: actor.userId,
        role: actor.role,
      })
      return
    }

    const adminProfile = await this.prisma.adminProfile.findUnique({
      where: { userId: actor.userId },
      select: { scope: true },
    })

    this.requestContext.setActor({
      userId: actor.userId,
      role: actor.role,
      adminScope: adminProfile?.scope ?? null,
    })
  }
}

function describeRequest(req: Request) {
  const segments = req.path.split('/').filter(Boolean)
  const entityType = segments[0] ?? 'unknown'
  const actionByMethod: Record<string, string> = {
    POST: 'create',
    PATCH: 'update',
    DELETE: 'delete',
  }

  return {
    entityType,
    actionType: `${entityType}.${actionByMethod[req.method.toUpperCase()] ?? 'mutate'}`,
  }
}

function extractEntityId(result: unknown, req: Request) {
  if (result && typeof result === 'object') {
    if ('id' in (result as Record<string, unknown>) && typeof (result as Record<string, unknown>).id === 'string') {
      return (result as Record<string, unknown>).id as string
    }

    if ('item' in (result as Record<string, unknown>)) {
      const item = (result as Record<string, unknown>).item
      if (item && typeof item === 'object' && 'id' in (item as Record<string, unknown>)) {
        return String((item as Record<string, unknown>).id)
      }
    }
  }

  const rawId = req.params?.id
  return typeof rawId === 'string' ? rawId : null
}
