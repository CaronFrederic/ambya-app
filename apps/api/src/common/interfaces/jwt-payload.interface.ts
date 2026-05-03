import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  salonId?: string | null;
  employeeId?: string | null;
}
