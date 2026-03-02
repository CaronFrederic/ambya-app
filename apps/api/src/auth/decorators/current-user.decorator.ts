import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { UserRole } from '@prisma/client';

export type JwtUser = { userId: string; role: UserRole  }

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtUser => {
    const req = ctx.switchToHttp().getRequest()
    return req.user as JwtUser
  },
)
