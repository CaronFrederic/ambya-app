import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: any) => {
          const token = request?.query?.token;
          return typeof token === 'string' ? token : null;
        },
      ]),
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
    });
  }

  validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      role: payload.role,
      salonId: payload.salonId ?? null,
      employeeId: payload.employeeId ?? null,
    };
  }
}