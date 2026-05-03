import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const authRateWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
  const authRateLimit = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20);
  const authAttempts = new Map<string, { count: number; resetAt: number }>();

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isLocalOrigin =
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('exp://') ||
        origin.startsWith('exps://') ||
        origin.includes('.ngrok-free.app');

      if (allowedOrigins.includes(origin) || isLocalOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  });

  app.use('/api/auth', (req, res, next) => {
    if (req.method === 'GET' || req.method === 'OPTIONS') {
      next();
      return;
    }

    const now = Date.now();
    const key = `${req.ip}:${req.path}`;
    const current = authAttempts.get(key);

    if (!current || current.resetAt <= now) {
      authAttempts.set(key, {
        count: 1,
        resetAt: now + authRateWindowMs,
      });
      next();
      return;
    }

    if (current.count >= authRateLimit) {
      res.status(429).json({
        message: 'Trop de tentatives. Merci de reessayer dans quelques minutes.',
      });
      return;
    }

    current.count += 1;
    authAttempts.set(key, current);
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}

bootstrap();
