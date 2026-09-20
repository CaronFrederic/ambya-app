CREATE TYPE "SubscriptionPlan" AS ENUM ('DISCOVERY', 'ESSENTIAL', 'PREMIUM');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'CANCELLED');
CREATE TYPE "SubscriptionPaymentMethod" AS ENUM ('AIRTEL_MONEY', 'MOOV_MONEY', 'CARD', 'MANUAL_MOBILE_MONEY');
CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

CREATE TABLE "SalonSubscription" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'DISCOVERY',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "pendingPlan" "SubscriptionPlan",
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalonSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "method" "SubscriptionPaymentMethod" NOT NULL,
    "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "providerRef" TEXT,
    "providerData" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SalonSubscription_salonId_key" ON "SalonSubscription"("salonId");
CREATE INDEX "SalonSubscription_plan_idx" ON "SalonSubscription"("plan");
CREATE INDEX "SalonSubscription_status_idx" ON "SalonSubscription"("status");
CREATE INDEX "SalonSubscription_currentPeriodEnd_idx" ON "SalonSubscription"("currentPeriodEnd");
CREATE INDEX "SubscriptionPayment_salonId_createdAt_idx" ON "SubscriptionPayment"("salonId", "createdAt");
CREATE INDEX "SubscriptionPayment_subscriptionId_createdAt_idx" ON "SubscriptionPayment"("subscriptionId", "createdAt");
CREATE INDEX "SubscriptionPayment_status_idx" ON "SubscriptionPayment"("status");
CREATE INDEX "SubscriptionPayment_plan_idx" ON "SubscriptionPayment"("plan");

ALTER TABLE "SalonSubscription"
ADD CONSTRAINT "SalonSubscription_salonId_fkey"
FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubscriptionPayment"
ADD CONSTRAINT "SubscriptionPayment_salonId_fkey"
FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubscriptionPayment"
ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "SalonSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
