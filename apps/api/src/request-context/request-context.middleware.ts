import { Injectable, NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type { NextFunction, Request, Response } from 'express'
import { RequestContextService } from './request-context.service'

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = randomUUID()
    res.setHeader('x-request-id', requestId)

    this.requestContext.run(
      {
        requestId,
        route: req.originalUrl,
        method: req.method,
      },
      () => next(),
    )
  }
}
