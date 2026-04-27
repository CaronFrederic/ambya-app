/*
  Warnings:

  - You are about to drop the column `openingHours` on the `Salon` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('CLIENT_APP', 'PRO_DASHBOARD', 'EMPLOYEE', 'IMPORT');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'LEAVE', 'ABSENT', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AbsenceSource" AS ENUM ('MANUAL', 'LEAVE_REQUEST', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClientPreferenceType" AS ENUM ('SERVICE', 'EMPLOYEE', 'SCHEDULE', 'OTHER');

-- CreateEnum
CREATE TYPE "LoginMethod" AS ENUM ('PHONE', 'EMAIL');

-- CreateEnum
CREATE TYPE "SalonPayoutMethod" AS ENUM ('MOBILE_MONEY', 'BANK');

-- CreateEnum
CREATE TYPE "MobileMoneyOperator" AS ENUM ('AIRTEL', 'MOOV', 'MTN', 'ORANGE');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'IN_PROGRESS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeaveRequestStatus" ADD VALUE 'ACCEPTED';
ALTER TYPE "LeaveRequestStatus" ADD VALUE 'REFUSED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ServiceCategory" ADD VALUE 'BEAUTE';
ALTER TYPE "ServiceCategory" ADD VALUE 'BIENETRE';
ALTER TYPE "ServiceCategory" ADD VALUE 'FORMATION';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SALON_MANAGER';

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorUserId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "depositAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "remainingAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salonClientId" TEXT,
ADD COLUMN     "source" "AppointmentSource" NOT NULL DEFAULT 'PRO_DASHBOARD',
ADD COLUMN     "subtotalAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "email" TEXT,
ADD COLUMN     "hireDate" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "roleLabel" TEXT,
ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "PaymentIntent" ADD COLUMN     "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" "PaymentType";

-- AlterTable
ALTER TABLE "Salon" DROP COLUMN "openingHours",
ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'XAF',
ADD COLUMN     "depositEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depositPercentage" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "establishmentType" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramHandle" TEXT,
ADD COLUMN     "mobileMoneyNumber" TEXT,
ADD COLUMN     "mobileMoneyOperator" "MobileMoneyOperator",
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openingHoursJson" JSONB,
ADD COLUMN     "paymentMethod" "SalonPayoutMethod",
ADD COLUMN     "paymentSettings" JSONB,
ADD COLUMN     "showInstagramFeed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showTikTokFeed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teamSize" INTEGER,
ADD COLUMN     "tiktokHandle" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Africa/Libreville',
ADD COLUMN     "websiteUrl" TEXT,
ADD COLUMN     "workstations" INTEGER;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptedNewsletterAt" TIMESTAMP(3),
ADD COLUMN     "acceptedNotificationsAt" TIMESTAMP(3),
ADD COLUMN     "acceptedTermsAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otpChannel" "LoginMethod",
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredLoginMethod" "LoginMethod",
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AppointmentService" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "serviceId" TEXT,
    "employeeId" TEXT,
    "serviceNameSnapshot" TEXT NOT NULL,
    "durationMinSnapshot" INTEGER NOT NULL,
    "priceSnapshot" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonClient" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "isRegular" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isDepositExempt" BOOLEAN NOT NULL DEFAULT false,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "firstVisitAt" TIMESTAMP(3),
    "lastVisitAt" TIMESTAMP(3),
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "bookingCount" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "canceledCount" INTEGER NOT NULL DEFAULT 0,
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientNote" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "salonClientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPreference" (
    "id" TEXT NOT NULL,
    "salonClientId" TEXT NOT NULL,
    "type" "ClientPreferenceType" NOT NULL,
    "value" TEXT NOT NULL,
    "serviceId" TEXT,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonClientPreferredEmployee" (
    "id" TEXT NOT NULL,
    "salonClientId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SalonClientPreferredEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLeaveRequest" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "reason" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeLeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAbsence" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveRequestId" TEXT,
    "reason" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "source" "AbsenceSource" NOT NULL DEFAULT 'MANUAL',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeAbsence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSchedule" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isWorking" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonSchedule" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'CONFIRMED',
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromotionType" NOT NULL,
    "value" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "appliesToAllServices" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionService" (
    "promotionId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "PromotionService_pkey" PRIMARY KEY ("promotionId","serviceId")
);

-- CreateTable
CREATE TABLE "LoyaltyConfig" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "cardName" TEXT,
    "pointsPerVisit" INTEGER NOT NULL DEFAULT 0,
    "pointsPerAmount" INTEGER NOT NULL DEFAULT 0,
    "rewardRulesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonOpeningHour" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonOpeningHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentService_appointmentId_idx" ON "AppointmentService"("appointmentId");

-- CreateIndex
CREATE INDEX "SalonClient_salonId_idx" ON "SalonClient"("salonId");

-- CreateIndex
CREATE INDEX "SalonClient_clientId_idx" ON "SalonClient"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "SalonClient_salonId_clientId_key" ON "SalonClient"("salonId", "clientId");

-- CreateIndex
CREATE INDEX "ClientNote_salonId_salonClientId_idx" ON "ClientNote"("salonId", "salonClientId");

-- CreateIndex
CREATE INDEX "ClientPreference_salonClientId_type_idx" ON "ClientPreference"("salonClientId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SalonClientPreferredEmployee_salonClientId_employeeId_key" ON "SalonClientPreferredEmployee"("salonClientId", "employeeId");

-- CreateIndex
CREATE INDEX "EmployeeLeaveRequest_salonId_status_idx" ON "EmployeeLeaveRequest"("salonId", "status");

-- CreateIndex
CREATE INDEX "EmployeeLeaveRequest_employeeId_idx" ON "EmployeeLeaveRequest"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAbsence_leaveRequestId_key" ON "EmployeeAbsence"("leaveRequestId");

-- CreateIndex
CREATE INDEX "EmployeeAbsence_salonId_employeeId_idx" ON "EmployeeAbsence"("salonId", "employeeId");

-- CreateIndex
CREATE INDEX "EmployeeSchedule_employeeId_dayOfWeek_idx" ON "EmployeeSchedule"("employeeId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "SalonSchedule_salonId_dayOfWeek_idx" ON "SalonSchedule"("salonId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Expense_salonId_expenseDate_idx" ON "Expense"("salonId", "expenseDate");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Promotion_salonId_isActive_idx" ON "Promotion"("salonId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyConfig_salonId_key" ON "LoyaltyConfig"("salonId");

-- CreateIndex
CREATE INDEX "SalonOpeningHour_salonId_idx" ON "SalonOpeningHour"("salonId");

-- CreateIndex
CREATE INDEX "SalonOpeningHour_salonId_dayOfWeek_idx" ON "SalonOpeningHour"("salonId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX "PaymentIntent_transactionDate_idx" ON "PaymentIntent"("transactionDate");

-- CreateIndex
CREATE INDEX "PaymentIntent_type_idx" ON "PaymentIntent"("type");

-- CreateIndex
CREATE INDEX "Salon_paymentMethod_idx" ON "Salon"("paymentMethod");

-- CreateIndex
CREATE INDEX "Salon_onboardingCompleted_idx" ON "Salon"("onboardingCompleted");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "Service"("category");

-- CreateIndex
CREATE INDEX "Service_status_idx" ON "Service"("status");

-- CreateIndex
CREATE INDEX "User_phoneVerified_idx" ON "User"("phoneVerified");

-- CreateIndex
CREATE INDEX "User_emailVerified_idx" ON "User"("emailVerified");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_salonClientId_fkey" FOREIGN KEY ("salonClientId") REFERENCES "SalonClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonClient" ADD CONSTRAINT "SalonClient_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonClient" ADD CONSTRAINT "SalonClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_salonClientId_fkey" FOREIGN KEY ("salonClientId") REFERENCES "SalonClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_salonClientId_fkey" FOREIGN KEY ("salonClientId") REFERENCES "SalonClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonClientPreferredEmployee" ADD CONSTRAINT "SalonClientPreferredEmployee_salonClientId_fkey" FOREIGN KEY ("salonClientId") REFERENCES "SalonClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonClientPreferredEmployee" ADD CONSTRAINT "SalonClientPreferredEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeaveRequest" ADD CONSTRAINT "EmployeeLeaveRequest_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeaveRequest" ADD CONSTRAINT "EmployeeLeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeaveRequest" ADD CONSTRAINT "EmployeeLeaveRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAbsence" ADD CONSTRAINT "EmployeeAbsence_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAbsence" ADD CONSTRAINT "EmployeeAbsence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAbsence" ADD CONSTRAINT "EmployeeAbsence_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "EmployeeLeaveRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAbsence" ADD CONSTRAINT "EmployeeAbsence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSchedule" ADD CONSTRAINT "EmployeeSchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonSchedule" ADD CONSTRAINT "SalonSchedule_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionService" ADD CONSTRAINT "PromotionService_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionService" ADD CONSTRAINT "PromotionService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyConfig" ADD CONSTRAINT "LoyaltyConfig_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonOpeningHour" ADD CONSTRAINT "SalonOpeningHour_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
