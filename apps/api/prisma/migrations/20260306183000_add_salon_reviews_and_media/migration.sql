ALTER TABLE "Salon"
  ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "galleryImageUrls" JSONB,
  ADD COLUMN IF NOT EXISTS "socialLinks" JSONB;

CREATE TABLE IF NOT EXISTS "SalonReview" (
  "id" TEXT NOT NULL,
  "salonId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalonReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SalonReview_salonId_createdAt_idx" ON "SalonReview"("salonId", "createdAt");
CREATE INDEX IF NOT EXISTS "SalonReview_clientId_createdAt_idx" ON "SalonReview"("clientId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SalonReview_salonId_fkey'
  ) THEN
    ALTER TABLE "SalonReview"
      ADD CONSTRAINT "SalonReview_salonId_fkey"
      FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SalonReview_clientId_fkey'
  ) THEN
    ALTER TABLE "SalonReview"
      ADD CONSTRAINT "SalonReview_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
