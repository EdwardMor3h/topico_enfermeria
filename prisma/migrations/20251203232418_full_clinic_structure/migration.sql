/*
  Warnings:

  - You are about to drop the column `appointment_id` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `scheduled_at` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `Appointment` table. All the data in the column will be lost.
  - The `status` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `deleted_at` on the `MedicalSupply` table. All the data in the column will be lost.
  - You are about to drop the column `expiration_date` on the `MedicalSupply` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `MedicalSupply` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `ActivityLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplyMovement` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `level` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Made the column `message` on table `Alert` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Appointment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `diagnosis` on table `Consultation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Consultation` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `unit_price` to the `MedicalSupply` table without a default value. This is not possible if the table is not empty.
  - Made the column `updated_at` on table `MedicalSupply` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Patient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DOCTOR', 'NURSE');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'ATTENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'YAPE', 'PLIN');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "SupplyMovement" DROP CONSTRAINT "SupplyMovement_consultation_id_fkey";

-- DropForeignKey
ALTER TABLE "SupplyMovement" DROP CONSTRAINT "SupplyMovement_supply_id_fkey";

-- AlterTable
ALTER TABLE "Alert" DROP COLUMN "appointment_id",
DROP COLUMN "scheduled_at",
DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "level" "AlertLevel" NOT NULL,
ALTER COLUMN "message" SET NOT NULL;

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "deleted_at",
DROP COLUMN "status",
ADD COLUMN     "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "Consultation" ALTER COLUMN "diagnosis" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "MedicalSupply" DROP COLUMN "deleted_at",
DROP COLUMN "expiration_date",
DROP COLUMN "type",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expiration" TIMESTAMP(3),
ADD COLUMN     "supplier" TEXT,
ADD COLUMN     "unit_price" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "Patient" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'DOCTOR',
ALTER COLUMN "updated_at" SET NOT NULL;

-- DropTable
DROP TABLE "ActivityLog";

-- DropTable
DROP TABLE "SupplyMovement";

-- CreateTable
CREATE TABLE "ClinicalHistory" (
    "id" SERIAL NOT NULL,
    "consultation_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "blood_pressure" TEXT,
    "heart_rate" INTEGER,
    "respiratory_rate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "oxygen_saturation" DOUBLE PRECISION,
    "diagnosis" TEXT,
    "medical_signature" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedure" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureRecord" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "procedure_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "observations" TEXT,

    CONSTRAINT "ProcedureRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "payment" "PaymentMethod" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleDetail" (
    "id" SERIAL NOT NULL,
    "sale_id" INTEGER NOT NULL,
    "medicalSupply_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SaleDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalHistory_consultation_id_key" ON "ClinicalHistory"("consultation_id");

-- AddForeignKey
ALTER TABLE "ClinicalHistory" ADD CONSTRAINT "ClinicalHistory_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "Consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalHistory" ADD CONSTRAINT "ClinicalHistory_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalHistory" ADD CONSTRAINT "ClinicalHistory_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "Procedure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureRecord" ADD CONSTRAINT "ProcedureRecord_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDetail" ADD CONSTRAINT "SaleDetail_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDetail" ADD CONSTRAINT "SaleDetail_medicalSupply_id_fkey" FOREIGN KEY ("medicalSupply_id") REFERENCES "MedicalSupply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
