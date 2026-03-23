import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {  UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { Prisma } from '@prisma/client';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();

    if (!email && !phone) {
      throw new BadRequestException(
        'Vous devez fournir au moins un email ou un téléphone',
      );
    }

    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingEmail) {
        throw new BadRequestException('Email déjà utilisé');
      }
    }

    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone },
        select: { id: true },
      });

      if (existingPhone) {
        throw new BadRequestException('Téléphone déjà utilisé');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email ?? undefined,
          phone: phone ?? undefined,
          password: hashedPassword,
          role: UserRole.CLIENT,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (dto.profile) {
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
            questionnaire: dto.profile.questionnaire ?? undefined,
          },
          select: { id: true },
        });
      }

      const loyalty = await tx.loyaltyAccount.create({
        data: {
          userId: user.id,
          currentPoints: 50,
          lifetimePoints: 50,
        },
        select: { id: true },
      });

      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: loyalty.id,
          deltaPoints: 50,
          reason: 'WELCOME',
          meta: { source: 'register' },
        },
        select: { id: true },
      });

      return user;
    });

    const accessToken = await this.signAccessToken({
      sub: result.id,
      email: result.email,
      phone: result.phone,
      role: result.role,
      salonId: null,
      employeeId: null,
    });

    return {
      user: result,
      accessToken,
    };
  }

  async registerOwner(dto: CreateOwnerDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Compte déjà existant');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        role: UserRole.PROFESSIONAL,
        ownedSalons: {
          create: {
            name: dto.salonName,
          },
        },
      },
      include: {
        ownedSalons: true,
      },
    });

    const salon = user.ownedSalons[0] ?? null;

    const accessToken = await this.signAccessToken({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      salonId: salon?.id ?? null,
      employeeId: null,
    });

    return {
      accessToken,
      user,
      salon,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();

    if (!email && !phone) {
      throw new BadRequestException(
        'Vous devez fournir un email ou un téléphone',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      include: {
        ownedSalons: true,
        employeeProfile: true,
      },
    });

    if (!user || !user.password || !user.isActive) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const salonId =
      user.role === UserRole.PROFESSIONAL
        ? user.ownedSalons[0]?.id ?? null
        : user.employeeProfile?.salonId ?? null;

    const accessToken = await this.signAccessToken({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      salonId,
      employeeId: user.employeeProfile?.id ?? null,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        ownedSalons: user.ownedSalons,
        employeeProfile: user.employeeProfile,
      },
    };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedSalons: true,
        employeeProfile: true,
        clientProfile: true,
      },
    });
  }

  private async signAccessToken(payload: {
    sub: string;
    email: string | null;
    phone: string | null;
    role: string;
    salonId: string | null;
    employeeId: string | null;
  }) {
    return this.jwtService.signAsync(payload);
  }
}