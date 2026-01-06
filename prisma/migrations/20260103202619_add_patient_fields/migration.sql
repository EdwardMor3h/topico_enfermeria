-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "place_of_origin" TEXT;
