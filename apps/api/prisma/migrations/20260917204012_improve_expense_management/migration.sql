/*
  Warnings:

  - A unique constraint covering the columns `[recurringSourceId,expenseDate]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ExpensePaymentMethod" AS ENUM ('CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "isInvestment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" "ExpensePaymentMethod",
ADD COLUMN     "receiptNumber" TEXT,
ADD COLUMN     "recurringSourceId" TEXT;

-- CreateIndex
CREATE INDEX "Expense_salonId_isRecurring_idx" ON "Expense"("salonId", "isRecurring");

-- CreateIndex
CREATE INDEX "Expense_salonId_isInvestment_idx" ON "Expense"("salonId", "isInvestment");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_recurringSourceId_expenseDate_key" ON "Expense"("recurringSourceId", "expenseDate");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringSourceId_fkey" FOREIGN KEY ("recurringSourceId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
