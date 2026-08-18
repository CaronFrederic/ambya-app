import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { SalonSettingsService } from './salon-settings.service';
import { UpsertSalonSettingsDto } from './dto/upsert-salon-settings.dto';

@Controller('pro/salon-settings')
@UseGuards(JwtAuthGuard)
export class SalonSettingsController {
  constructor(
    private readonly salonSettingsService: SalonSettingsService,
  ) {}

  @Get()
  getSettings(@CurrentUser() user: JwtUser) {
    return this.salonSettingsService.getSettings({
      userId: user.userId,
      role: user.role,
    });
  }

  @Post('photos/upload')
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
  uploadPhoto(
    @CurrentUser() user: JwtUser,
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

    const baseUrl = `${protocol}://${host}`;

    return this.salonSettingsService.uploadPhoto(
      {
        userId: user.userId,
        role: user.role,
      },
      file,
      baseUrl,
    );
  }

  @Put()
  updateSettings(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpsertSalonSettingsDto,
  ) {
    return this.salonSettingsService.upsertSettings(
      {
        userId: user.userId,
        role: user.role,
      },
      dto,
    );
  }
}