/*
  Warnings:

  - The values [CASH,CARD] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA');
ALTER TABLE "Sale" ALTER COLUMN "payment" TYPE "PaymentMethod_new" USING ("payment"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_patient_id_fkey";

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "customer_dni" TEXT,
ADD COLUMN     "customer_name" TEXT,
ALTER COLUMN "patient_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
