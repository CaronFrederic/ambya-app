import { apiFetch } from "./client";

export type CountryCode = "+241" | "+243" | "+242" | "+237" | "+225";
export type LoginMethod = "phone" | "email";
export type PaymentMethod = "mobile-money" | "bank";
export type ServiceType = "individual" | "group";

export type TimeSlotPayload = {
  start: string;
  end: string;
};

export type DaySchedulePayload = {
  isOpen: boolean;
  slots: TimeSlotPayload[];
};

export type GroupSettingsPayload = {
  maxCapacity: number;
  minCapacity?: number;
  alertThreshold?: number;
  cancellationPolicy: string;
  waitingList: boolean;
};

export type ProServicePayload = {
  name: string;
  category: string;
  description?: string;
  duration: string;
  price: number;
  type?: ServiceType;
  groupSettings?: GroupSettingsPayload;
};

export type RegisterProfessionalPayload = {
  establishmentName?: string;
  establishmentType?: string;
  customType?: string;
  categories?: string[];

  countryCode?: CountryCode;
  phone?: string;
  email?: string;

  address?: string;
  city?: string;
  district?: string;
  customDistrict?: string;

  schedule?: Record<string, DaySchedulePayload>;
  teamSize?: number;
  workstations?: number;

  services?: ProServicePayload[];

  loginMethod?: LoginMethod;
  password: string;
  confirmPassword?: string;

  paymentMethod?: PaymentMethod;
  mobileMoneyOperator?: "airtel" | "moov" | "mtn" | "orange";
  mobileMoneyNumber?: string;

  depositEnabled?: boolean;
  depositPercentage?: number;

  acceptTerms?: boolean;
  acceptNotifications?: boolean;
  acceptNewsletter?: boolean;

  // compat ancien flux
  salonName?: string;
};

export type RegisterProfessionalResponse = {
  accessToken: string;
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    role: string;
    isActive: boolean;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    preferredLoginMethod?: string | null;
    createdAt?: string;
  };
  salon: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    ownerId?: string;
    establishmentType?: string | null;
    district?: string | null;
    categories?: string[];
    teamSize?: number | null;
    workstations?: number | null;
    paymentMethod?: string | null;
    mobileMoneyOperator?: string | null;
    mobileMoneyNumber?: string | null;
    depositEnabled?: boolean;
    depositPercentage?: number | null;
    onboardingCompleted?: boolean;
  };
  verificationRequired: boolean;
  verificationChannel: "sms" | "email" | "none";
  otpDebugCode?: string | null;
};

export async function registerProfessional(
  payload: RegisterProfessionalPayload,
) {
  return apiFetch<RegisterProfessionalResponse>("/auth/register-owner", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}