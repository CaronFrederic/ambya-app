-- CreateEnum
CREATE TYPE "EmployeeSpecialty" AS ENUM ('HAIR_STYLIST', 'ESTHETICIAN', 'BARBER', 'MASSAGE_THERAPIST', 'MANICURIST', 'FITNESS_COACH', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('HAIR', 'BARBER', 'NAILS', 'FACE', 'BODY', 'FITNESS', 'OTHER');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "servicecategory" "ServiceCategory" NOT NULL DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE "EmployeeSpecialtyAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "specialty" "EmployeeSpecialty" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeSpecialtyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeSpecialtyAssignment_specialty_idx" ON "EmployeeSpecialtyAssignment"("specialty");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSpecialtyAssignment_employeeId_specialty_key" ON "EmployeeSpecialtyAssignment"("employeeId", "specialty");

-- AddForeignKey
ALTER TABLE "EmployeeSpecialtyAssignment" ADD CONSTRAINT "EmployeeSpecialtyAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
