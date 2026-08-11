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

  it('rejects register when password confirmation differs', async () => {
    const service = new AuthService({} as any, {} as any)

    await expect(
      service.register({
        email: 'client@example.com',
        password: 'password123',
        confirmPassword: 'another-password',
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

  it('changes password when the current password is valid', async () => {
    const passwordHash = await bcrypt.hash('password123', 10)
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          password: passwordHash,
          isActive: true,
        }),
        update: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
    }

    const service = new AuthService(prisma as any, {} as any)

    const result = await service.changePassword('user-1', {
      currentPassword: 'password123',
      newPassword: 'new-password-123',
      confirmPassword: 'new-password-123',
    })

    expect(result).toEqual({
      success: true,
      message: 'Votre mot de passe a ete modifie',
    })
    expect(result).not.toHaveProperty('password')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        password: expect.any(String),
      },
      select: { id: true },
    })

    const hashedPassword = prisma.user.update.mock.calls[0][0].data.password
    await expect(bcrypt.compare('new-password-123', hashedPassword)).resolves.toBe(true)
    await expect(bcrypt.compare('password123', hashedPassword)).resolves.toBe(false)
  })

  it('rejects change password when current password is invalid', async () => {
    const passwordHash = await bcrypt.hash('password123', 10)
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          password: passwordHash,
          isActive: true,
        }),
        update: jest.fn(),
      },
    }

    const service = new AuthService(prisma as any, {} as any)

    await expect(
      service.changePassword('user-1', {
        currentPassword: 'wrong-password',
        newPassword: 'new-password-123',
        confirmPassword: 'new-password-123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects change password when confirmation differs', async () => {
    const service = new AuthService({ user: { findUnique: jest.fn() } } as any, {} as any)

    await expect(
      service.changePassword('user-1', {
        currentPassword: 'password123',
        newPassword: 'new-password-123',
        confirmPassword: 'another-password',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects change password when the new password matches the old one', async () => {
    const passwordHash = await bcrypt.hash('password123', 10)
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          password: passwordHash,
          isActive: true,
        }),
        update: jest.fn(),
      },
    }

    const service = new AuthService(prisma as any, {} as any)

    await expect(
      service.changePassword('user-1', {
        currentPassword: 'password123',
        newPassword: 'password123',
        confirmPassword: 'password123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})

