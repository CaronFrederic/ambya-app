CREATE TABLE "ManualProductSale" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualProductSale_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManualProductSale_salonId_saleDate_idx"
ON "ManualProductSale"("salonId", "saleDate");

CREATE INDEX "ManualProductSale_createdById_idx"
ON "ManualProductSale"("createdById");

ALTER TABLE "ManualProductSale"
ADD CONSTRAINT "ManualProductSale_salonId_fkey"
FOREIGN KEY ("salonId") REFERENCES "Salon"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ManualProductSale"
ADD CONSTRAINT "ManualProductSale_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
