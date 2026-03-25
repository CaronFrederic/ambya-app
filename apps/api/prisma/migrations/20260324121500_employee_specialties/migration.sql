DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmployeeSpecialty') THEN
    CREATE TYPE "EmployeeSpecialty" AS ENUM (
      'HAIR_STYLIST',
      'ESTHETICIAN',
      'BARBER',
      'MASSAGE_THERAPIST',
      'MANICURIST',
      'FITNESS_COACH',
      'OTHER'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "EmployeeSpecialtyAssignment" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "specialty" "EmployeeSpecialty" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmployeeSpecialtyAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeSpecialtyAssignment_employeeId_specialty_key"
  ON "EmployeeSpecialtyAssignment"("employeeId", "specialty");

CREATE INDEX IF NOT EXISTS "EmployeeSpecialtyAssignment_specialty_idx"
  ON "EmployeeSpecialtyAssignment"("specialty");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'EmployeeSpecialtyAssignment_employeeId_fkey'
  ) THEN
    ALTER TABLE "EmployeeSpecialtyAssignment"
      ADD CONSTRAINT "EmployeeSpecialtyAssignment_employeeId_fkey"
      FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
