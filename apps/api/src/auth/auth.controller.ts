import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('register-owner/photos')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = new Set([
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/heic',
          'image/heif',
        ]);

        if (!allowedMimeTypes.has(file.mimetype)) {
          callback(
            new BadRequestException(
              'Format non supporté. Utilisez JPG, PNG, WEBP, HEIC ou HEIF.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadOwnerRegistrationPhoto(
    @UploadedFile() file: any,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Aucune photo reçue.');
    }

    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : forwardedProto?.split(',')[0]?.trim() || req.protocol;

    const forwardedHost = req.headers['x-forwarded-host'];
    const host = Array.isArray(forwardedHost)
      ? forwardedHost[0]
      : forwardedHost?.split(',')[0]?.trim() || req.get('host');

    return this.auth.uploadOwnerRegistrationPhoto(file, `${protocol}://${host}`);
  }

  @Post('register-owner')
  registerOwner(@Body() dto: CreateOwnerDto) {
    return this.auth.registerOwner(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { sub?: string; userId?: string }) {
    return this.auth.me(user.sub ?? user.userId!);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-otp')
  verifyOtp(
    @CurrentUser() user: { sub?: string; userId?: string },
    @Body() dto: VerifyOtpDto,
  ) {
    return this.auth.verifyOtp(user.sub ?? user.userId!, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-otp')
  resendOtp(@CurrentUser() user: { sub?: string; userId?: string }) {
    return this.auth.resendOtp(user.sub ?? user.userId!);
  }
}