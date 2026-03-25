import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'async_hooks'
import { AdminScope, UserRole } from '@prisma/client'

export type RequestActor = {
  userId?: string
  role?: UserRole
  adminScope?: AdminScope | null
}

export type RequestContextState = {
  requestId: string
  actor?: RequestActor
  route?: string
  method?: string
  metadata?: Record<string, unknown>
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextState>()

  run<T>(state: RequestContextState, callback: () => T): T {
    return this.storage.run(state, callback)
  }

  get() {
    return this.storage.getStore()
  }

  setActor(actor: RequestActor) {
    const current = this.storage.getStore()
    if (current) {
      current.actor = actor
    }
  }

  mergeMetadata(metadata: Record<string, unknown>) {
    const current = this.storage.getStore()
    if (current) {
      current.metadata = { ...(current.metadata ?? {}), ...metadata }
    }
  }
}
