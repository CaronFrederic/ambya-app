import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'

import { AuthService } from './auth.service'

describe('AuthService', () => {
  it('requires email or phone on register', async () => {
    const service = new AuthService({} as any, {} as any)

    await expect(
      service.register({
        password: 'password123',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('logs in an active user with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 10)
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'client@example.com',
          phone: null,
          password: passwordHash,
          role: 'CLIENT',
          isActive: true,
        }),
      },
    }
    const jwt = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    }

    const service = new AuthService(prisma as any, jwt as any)

    const result = await service.login({
      email: 'client@example.com',
      password: 'password123',
    } as any)

    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'client@example.com',
        phone: null,
        role: 'CLIENT',
        isActive: true,
      },
      accessToken: 'signed-token',
    })
  })

  it('rejects invalid credentials for inactive users', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'client@example.com',
          phone: null,
          password: 'ignored',
          role: 'CLIENT',
          isActive: false,
        }),
      },
    }

    const service = new AuthService(prisma as any, {} as any)

    await expect(
      service.login({
        email: 'client@example.com',
        password: 'password123',
      } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })
})

