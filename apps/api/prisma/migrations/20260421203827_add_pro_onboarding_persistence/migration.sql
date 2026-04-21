-- CreateEnum
CREATE TYPE "LoginMethod" AS ENUM ('PHONE', 'EMAIL');

-- CreateEnum
CREATE TYPE "SalonPayoutMethod" AS ENUM ('MOBILE_MONEY', 'BANK');

-- CreateEnum
CREATE TYPE "MobileMoneyOperator" AS ENUM ('AIRTEL', 'MOOV', 'MTN', 'ORANGE');

-- AlterTable
ALTER TABLE "Salon" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "district" TEXT,
ADD COLUMN     "establishmentType" TEXT,
ADD COLUMN     "mobileMoneyNumber" TEXT,
ADD COLUMN     "mobileMoneyOperator" "MobileMoneyOperator",
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" "SalonPayoutMethod",
ADD COLUMN     "teamSize" INTEGER,
ADD COLUMN     "workstations" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptedNewsletterAt" TIMESTAMP(3),
ADD COLUMN     "acceptedNotificationsAt" TIMESTAMP(3),
ADD COLUMN     "acceptedTermsAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otpChannel" "LoginMethod",
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredLoginMethod" "LoginMethod";

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
CREATE INDEX "SalonOpeningHour_salonId_idx" ON "SalonOpeningHour"("salonId");

-- CreateIndex
CREATE INDEX "SalonOpeningHour_salonId_dayOfWeek_idx" ON "SalonOpeningHour"("salonId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Salon_paymentMethod_idx" ON "Salon"("paymentMethod");

-- CreateIndex
CREATE INDEX "Salon_onboardingCompleted_idx" ON "Salon"("onboardingCompleted");

-- CreateIndex
CREATE INDEX "User_phoneVerified_idx" ON "User"("phoneVerified");

-- CreateIndex
CREATE INDEX "User_emailVerified_idx" ON "User"("emailVerified");

-- AddForeignKey
ALTER TABLE "SalonOpeningHour" ADD CONSTRAINT "SalonOpeningHour_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
