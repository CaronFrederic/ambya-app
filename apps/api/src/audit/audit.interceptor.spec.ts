import { of } from 'rxjs'
import { AuditInterceptor } from './audit.interceptor'
import { UserRole } from '@prisma/client'

describe('AuditInterceptor', () => {
  it('logs non-admin mutations without request query metadata', async () => {
    const auditService = {
      logHttpMutation: jest.fn().mockResolvedValue(undefined),
    }
    const requestContext = {
      setActor: jest.fn(),
    }
    const prisma = {
      adminProfile: {
        findUnique: jest.fn(),
      },
    }

    const interceptor = new AuditInterceptor(
      auditService as any,
      requestContext as any,
      prisma as any,
    )

    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'PATCH',
          path: '/payments/intents/pi-1/status',
          params: { id: 'pi-1' },
          user: {
            userId: 'client-1',
            role: UserRole.CLIENT,
          },
        }),
      }),
    } as any

    await new Promise<void>((resolve, reject) => {
      interceptor.intercept(context, { handle: () => of({ id: 'pi-1' }) } as any).subscribe({
        complete: resolve,
        error: reject,
      })
    })

    expect(auditService.logHttpMutation).toHaveBeenCalledWith({
      actionType: 'payments.update',
      entityType: 'payments',
      entityId: 'pi-1',
    })
  })

  it('skips automatic audit logging for admin routes', async () => {
    const auditService = {
      logHttpMutation: jest.fn().mockResolvedValue(undefined),
    }
    const requestContext = {
      setActor: jest.fn(),
    }
    const prisma = {
      adminProfile: {
        findUnique: jest.fn().mockResolvedValue({ scope: 'SUPPORT' }),
      },
    }

    const interceptor = new AuditInterceptor(
      auditService as any,
      requestContext as any,
      prisma as any,
    )

    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'PATCH',
          path: '/admin/users/user-1',
          params: { id: 'user-1' },
          user: {
            userId: 'admin-1',
            role: UserRole.ADMIN,
          },
        }),
      }),
    } as any

    await new Promise<void>((resolve, reject) => {
      interceptor.intercept(context, { handle: () => of({ id: 'user-1' }) } as any).subscribe({
        complete: resolve,
        error: reject,
      })
    })

    expect(auditService.logHttpMutation).not.toHaveBeenCalled()
  })
})
