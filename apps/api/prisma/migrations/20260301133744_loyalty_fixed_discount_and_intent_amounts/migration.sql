-- AlterTable
ALTER TABLE "LoyaltyAccount" ADD COLUMN     "pendingDiscountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pendingDiscountConsumedAt" TIMESTAMP(3),
ADD COLUMN     "pendingDiscountConsumedIntentId" TEXT,
ADD COLUMN     "pendingDiscountIssuedAt" TIMESTAMP(3),
ADD COLUMN     "pendingDiscountTier" "LoyaltyTier";

-- AlterTable
ALTER TABLE "PaymentIntent" ADD COLUMN     "appliedDiscountTier" "LoyaltyTier",
ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payableAmount" INTEGER NOT NULL DEFAULT 0;
