import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register-owner')
  registerOwner(@Body() dto: CreateOwnerDto) {
    return this.authService.registerOwner(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { sub: string }) {
    return this.authService.me(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-otp')
  verifyOtp(
    @CurrentUser() user: { sub: string },
    @Body() dto: VerifyOtpDto,
  ) {
    return this.authService.verifyOtp(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-otp')
  resendOtp(@CurrentUser() user: { sub: string }) {
    return this.authService.resendOtp(user.sub);
  }
}