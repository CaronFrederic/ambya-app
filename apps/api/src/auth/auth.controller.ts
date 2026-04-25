import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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