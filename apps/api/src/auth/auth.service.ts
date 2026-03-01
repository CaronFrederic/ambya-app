import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { Prisma, UserRole } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email?.trim().toLowerCase()
    const phone = dto.phone?.trim()

    if (!email && !phone) {
      throw new BadRequestException('Provide at least email or phone')
    }

    // Check duplicates (email and/or phone)
    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
      if (existingEmail) throw new BadRequestException('Email already in use')
    }

    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone },
        select: { id: true },
      })
      if (existingPhone) throw new BadRequestException('Phone already in use')
    }

    const hash = await bcrypt.hash(dto.password, 10)

    // Transaction: user + clientProfile + loyalty
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email ?? undefined,
          phone: phone ?? undefined,
          password: hash,
          role: UserRole.CLIENT,
        },
        select: { id: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
      })

      await tx.clientProfile.create({
        data: {
          userId: user.id,
          nickname: dto.profile.nickname,
          gender: dto.profile.gender,
          ageRange: dto.profile.ageRange,
          city: dto.profile.city,
          country: dto.profile.country,
          allergies: dto.profile.allergies ?? null,
          comments: dto.profile.comments ?? null,
          questionnaire: dto.profile.questionnaire ?? Prisma.DbNull,
        },
        select: { id: true },
      })

      const loyalty = await tx.loyaltyAccount.create({
        data: {
          userId: user.id,
          currentPoints: 50,
          lifetimePoints: 50,
          // tier default BRONZE
        },
        select: { id: true },
      })

      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: loyalty.id,
          deltaPoints: 50,
          reason: 'WELCOME',
          meta: { source: 'register' },
        },
        select: { id: true },
      })

      return user
    })

    const accessToken = await this.signAccessToken(result.id, result.role)

    return {
      user: result,
      accessToken,
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email?.trim().toLowerCase()
    const phone = dto.phone?.trim()

    if (!email && !phone) {
      throw new BadRequestException('Provide email or phone')
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { id: true, email: true, phone: true, password: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const ok = await bcrypt.compare(dto.password, user.password)
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const accessToken = await this.signAccessToken(user.id, user.role)

    return {
      user: { id: user.id, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive },
      accessToken,
    }
  }

  private signAccessToken(userId: string, role: string) {
    return this.jwt.signAsync({
      sub: userId,
      role,
    })
  }
}
