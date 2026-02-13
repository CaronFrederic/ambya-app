import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
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
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    })

    if (existing) {
      throw new BadRequestException('Email already in use')
    }

    const hash = await bcrypt.hash(dto.password, 10)

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        role: (dto.role as any) ?? undefined, // si tu gardes role optionnel
      },
      select: { id: true, email: true, role: true, isActive: true, createdAt: true },
    })

    const accessToken = await this.signAccessToken(user.id, user.role)

    return {
      user,
      accessToken,
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, password: true, role: true, isActive: true },
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
      user: { id: user.id, email: user.email, role: user.role, isActive: user.isActive },
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
