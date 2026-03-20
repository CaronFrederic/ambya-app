DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ServiceCategory') THEN
    CREATE TYPE "ServiceCategory" AS ENUM ('HAIR', 'BARBER', 'NAILS', 'FACE', 'BODY', 'FITNESS', 'OTHER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeaveRequestStatus') THEN
    CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END $$;

ALTER TABLE "Employee"
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT;

ALTER TABLE "Service"
  ADD COLUMN IF NOT EXISTS "category" "ServiceCategory" NOT NULL DEFAULT 'OTHER';

CREATE TABLE IF NOT EXISTS "EmployeeBlockedSlot" (
  "id" TEXT NOT NULL,
  "salonId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "clientPhone" TEXT NOT NULL,
  "note" TEXT,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeBlockedSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeaveRequest" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedAt" TIMESTAMP(3),
  "managerNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmployeeBlockedSlot_salonId_startAt_idx" ON "EmployeeBlockedSlot"("salonId", "startAt");
CREATE INDEX IF NOT EXISTS "EmployeeBlockedSlot_employeeId_startAt_idx" ON "EmployeeBlockedSlot"("employeeId", "startAt");
CREATE INDEX IF NOT EXISTS "EmployeeBlockedSlot_status_idx" ON "EmployeeBlockedSlot"("status");

CREATE INDEX IF NOT EXISTS "LeaveRequest_employeeId_createdAt_idx" ON "LeaveRequest"("employeeId", "createdAt");
CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx" ON "LeaveRequest"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EmployeeBlockedSlot_salonId_fkey'
  ) THEN
    ALTER TABLE "EmployeeBlockedSlot"
      ADD CONSTRAINT "EmployeeBlockedSlot_salonId_fkey"
      FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EmployeeBlockedSlot_employeeId_fkey'
  ) THEN
    ALTER TABLE "EmployeeBlockedSlot"
      ADD CONSTRAINT "EmployeeBlockedSlot_employeeId_fkey"
      FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EmployeeBlockedSlot_serviceId_fkey'
  ) THEN
    ALTER TABLE "EmployeeBlockedSlot"
      ADD CONSTRAINT "EmployeeBlockedSlot_serviceId_fkey"
      FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LeaveRequest_employeeId_fkey'
  ) THEN
    ALTER TABLE "LeaveRequest"
      ADD CONSTRAINT "LeaveRequest_employeeId_fkey"
      FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
