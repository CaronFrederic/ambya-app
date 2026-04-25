import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

type AppLoginMethod = 'PHONE' | 'EMAIL';
type AppSalonPayoutMethod = 'MOBILE_MONEY' | 'BANK';
type AppMobileMoneyOperator = 'AIRTEL' | 'MOOV' | 'MTN' | 'ORANGE';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
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
            questionnaire: dto.profile.questionnaire ?? Prisma.DbNull,
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
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();

    if (!email && !phone) {
      throw new BadRequestException(
        'Vous devez fournir au moins un email ou un téléphone',
      );
    }

    const effectiveConfirmPassword = dto.confirmPassword ?? dto.password;

    if (dto.password !== effectiveConfirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    if (dto.loginMethod === 'phone' && !phone) {
      throw new BadRequestException(
        'Le téléphone est requis pour une connexion par téléphone',
      );
    }

    if (dto.loginMethod === 'email' && !email) {
      throw new BadRequestException(
        "L'email est requis pour une connexion par email",
      );
    }

    if (dto.acceptTerms === false) {
      throw new BadRequestException(
        "Vous devez accepter les conditions d'utilisation",
      );
    }

    if (dto.acceptNotifications === false) {
      throw new BadRequestException(
        'Vous devez accepter les notifications essentielles',
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

    const salonName = dto.establishmentName?.trim() || dto.salonName?.trim();

    if (!salonName) {
      throw new BadRequestException("Le nom de l'établissement est requis");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const loginMethod: AppLoginMethod =
      dto.loginMethod === 'email'
        ? 'EMAIL'
        : dto.loginMethod === 'phone'
          ? 'PHONE'
          : phone
            ? 'PHONE'
            : 'EMAIL';

    const paymentMethod: AppSalonPayoutMethod | undefined =
      dto.paymentMethod === 'mobile-money'
        ? 'MOBILE_MONEY'
        : dto.paymentMethod === 'bank'
          ? 'BANK'
          : undefined;

    const mobileMoneyOperator: AppMobileMoneyOperator | undefined =
      dto.mobileMoneyOperator === 'airtel'
        ? 'AIRTEL'
        : dto.mobileMoneyOperator === 'moov'
          ? 'MOOV'
          : dto.mobileMoneyOperator === 'mtn'
            ? 'MTN'
            : dto.mobileMoneyOperator === 'orange'
              ? 'ORANGE'
              : undefined;

    const generatedOtp =
      loginMethod === 'PHONE' ? this.generateOtp() : undefined;

    const otpExpiresAt =
      generatedOtp != null ? new Date(Date.now() + 10 * 60 * 1000) : undefined;

    const district =
      dto.district === 'autre'
        ? dto.customDistrict?.trim() || undefined
        : dto.district?.trim() || undefined;

    const establishmentType =
      dto.establishmentType === 'autre'
        ? dto.customType?.trim() || undefined
        : dto.establishmentType?.trim() || undefined;

    const categories = dto.categories ?? [];

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email ?? undefined,
          phone: phone ?? undefined,
          password: hashedPassword,
          role: UserRole.PROFESSIONAL,
          phoneVerified: false,
          emailVerified: false,
          otpCode: generatedOtp,
          otpExpiresAt,
          otpChannel: loginMethod as any,
          preferredLoginMethod: loginMethod as any,
          acceptedTermsAt: dto.acceptTerms ? new Date() : undefined,
          acceptedNotificationsAt: dto.acceptNotifications
            ? new Date()
            : undefined,
          acceptedNewsletterAt: dto.acceptNewsletter ? new Date() : undefined,
        } as any,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          phoneVerified: true,
          emailVerified: true,
          preferredLoginMethod: true,
          createdAt: true,
        },
      });

      const descriptionParts: string[] = [];

      if (establishmentType) {
        descriptionParts.push(establishmentType);
      }

      if (categories.length) {
        descriptionParts.push(categories.join(', '));
      }

      const salonCreateData = {
        name: salonName,
        ownerId: user.id,
        address: dto.address?.trim() || undefined,
        city: dto.city?.trim() || undefined,
        country: dto.countryCode?.trim() || undefined,
        phone: phone || undefined,
        email: email || undefined,
        description:
          descriptionParts.length > 0
            ? descriptionParts.join(' • ')
            : undefined,
        establishmentType,
        district,
        categories,
        teamSize: dto.teamSize ?? undefined,
        workstations: dto.workstations ?? undefined,
        paymentMethod: paymentMethod as any,
        mobileMoneyOperator: mobileMoneyOperator as any,
        mobileMoneyNumber: dto.mobileMoneyNumber?.trim() || undefined,
        depositEnabled: dto.depositEnabled ?? false,
        depositPercentage: dto.depositPercentage ?? undefined,
        onboardingCompleted: true,
      };

      const salon = await tx.salon.create({
        data: salonCreateData as Prisma.SalonUncheckedCreateInput,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          ownerId: true,
          establishmentType: true,
          district: true,
          categories: true,
          teamSize: true,
          workstations: true,
          paymentMethod: true,
          mobileMoneyOperator: true,
          mobileMoneyNumber: true,
          depositEnabled: true,
          depositPercentage: true,
          onboardingCompleted: true,
        },
      });

      if (dto.schedule) {
        const dayMap: Record<string, number> = {
          lundi: 1,
          mardi: 2,
          mercredi: 3,
          jeudi: 4,
          vendredi: 5,
          samedi: 6,
          dimanche: 7,
        };

        const openingHoursData = Object.entries(dto.schedule).flatMap(
          ([dayKey, dayValue]) => {
            const dayOfWeek = dayMap[dayKey];

            if (!dayOfWeek || !dayValue?.slots?.length) {
              return [];
            }

            return dayValue.slots.map((slot) => ({
              salonId: salon.id,
              dayOfWeek,
              isOpen: dayValue.isOpen,
              startTime: slot.start,
              endTime: slot.end,
            }));
          },
        );

        if (openingHoursData.length > 0) {
          await (tx as any).salonOpeningHour.createMany({
            data: openingHoursData,
          });
        }
      }

      if (dto.services?.length) {
        for (const service of dto.services) {
          const serviceCreateData: Prisma.ServiceUncheckedCreateInput = {
            salonId: salon.id,
            name: service.name.trim(),
            description: service.description?.trim() || undefined,
            price: service.price,
            durationMin: Number(service.duration) || 30,
            category: this.mapServiceCategory(service.category) as any,
            isActive: true,
          };

          await tx.service.create({
            data: serviceCreateData,
          });
        }
      }

      return { user, salon };
    });

    const accessToken = await this.signAccessToken({
      sub: result.user.id,
      email: result.user.email,
      phone: result.user.phone,
      role: result.user.role,
      salonId: result.salon.id,
      employeeId: null,
    });

    return {
      accessToken,
      user: result.user,
      salon: result.salon,
      verificationRequired: loginMethod === 'PHONE',
      verificationChannel: loginMethod === 'PHONE' ? 'sms' : 'email',
      otpDebugCode: generatedOtp ?? null,
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
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
      },
      select: {
        id: true,
        email: true,
        phone: true,
        password: true,
        role: true,
        isActive: true,
        phoneVerified: true,
        emailVerified: true,
        preferredLoginMethod: true,
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
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        preferredLoginMethod: user.preferredLoginMethod,
        ownedSalons: user.ownedSalons,
        employeeProfile: user.employeeProfile,
      },
    };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedSalons: {
          include: {
            openingHours: true,
            services: true,
          },
        },
        employeeProfile: true,
        clientProfile: true,
      },
    });
  }

  async verifyOtp(userId: string, dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        otpCode: true,
        otpExpiresAt: true,
        otpChannel: true,
        phoneVerified: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException(
        "Aucun code OTP actif n'a été trouvé pour ce compte",
      );
    }

    const otpExpiresAt = new Date(user.otpExpiresAt);

    if (otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Le code OTP a expiré');
    }

    if (user.otpCode !== dto.code) {
      throw new BadRequestException('Code OTP invalide');
    }

    const dataToUpdate: Record<string, unknown> = {
      otpCode: null,
      otpExpiresAt: null,
    };

    if (user.otpChannel === 'PHONE') {
      dataToUpdate.phoneVerified = true;
    }

    if (user.otpChannel === 'EMAIL') {
      dataToUpdate.emailVerified = true;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate as any,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        phoneVerified: true,
        emailVerified: true,
        preferredLoginMethod: true,
      },
    });

    return {
      success: true,
      message: 'OTP vérifié avec succès',
      user: updatedUser,
    };
  }

  async resendOtp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        otpChannel: true,
        phoneVerified: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    if (user.otpChannel === 'PHONE' && user.phoneVerified) {
      throw new BadRequestException('Le téléphone est déjà vérifié');
    }

    if (user.otpChannel === 'EMAIL' && user.emailVerified) {
      throw new BadRequestException("L'email est déjà vérifié");
    }

    if (!user.otpChannel) {
      throw new BadRequestException(
        "Aucun canal OTP n'est configuré pour ce compte",
      );
    }

    const newOtp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        otpCode: newOtp,
        otpExpiresAt,
      } as any,
    });

    return {
      success: true,
      message:
        user.otpChannel === 'PHONE'
          ? 'Un nouveau code SMS a été généré'
          : 'Un nouveau code email a été généré',
      verificationChannel: user.otpChannel === 'PHONE' ? 'sms' : 'email',
      otpDebugCode: newOtp,
      expiresAt: otpExpiresAt,
    };
  }

  private async signAccessToken(payload: {
    sub: string;
    email: string | null;
    phone: string | null;
    role: string;
    salonId: string | null;
    employeeId: string | null;
  }) {
    return this.jwt.signAsync(payload);
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private mapServiceCategory(category?: string | null) {
    if (!category) return undefined;

    const normalized = category.trim().toLowerCase();

    if (normalized === 'beaute' || normalized === 'beauté') return 'BEAUTE';
    if (normalized === 'fitness') return 'FITNESS';
    if (normalized === 'bienetre' || normalized === 'bien-être') {
      return 'BIENETRE';
    }
    if (normalized === 'formation') return 'FORMATION';

    if (category === 'BEAUTE') return 'BEAUTE';
    if (category === 'FITNESS') return 'FITNESS';
    if (category === 'BIENETRE') return 'BIENETRE';
    if (category === 'FORMATION') return 'FORMATION';

    return undefined;
  }
}