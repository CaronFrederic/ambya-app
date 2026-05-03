import { UserRole } from '@prisma/client'
import { RolesGuard } from './roles.guard'

describe('RolesGuard', () => {
  const buildContext = (role: UserRole) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role },
        }),
      }),
    }) as any

  it('refuses access when the user role does not match the required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as any

    const guard = new RolesGuard(reflector)

    expect(guard.canActivate(buildContext(UserRole.CLIENT))).toBe(false)
  })

  it('allows access when the user role matches the required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as any

    const guard = new RolesGuard(reflector)

    expect(guard.canActivate(buildContext(UserRole.ADMIN))).toBe(true)
  })
})
