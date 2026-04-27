import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
  salonId?: string | null;
  employeeId?: string | null;
}