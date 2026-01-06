-- CreateTable
CREATE TABLE "VitalSigns" (
    "id" SERIAL NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "nurse_id" INTEGER NOT NULL,
    "blood_pressure" TEXT,
    "heart_rate" INTEGER,
    "respiratory_rate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "oxygen_saturation" DOUBLE PRECISION,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VitalSigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VitalSigns_appointment_id_key" ON "VitalSigns"("appointment_id");

-- CreateIndex
CREATE INDEX "VitalSigns_appointment_id_idx" ON "VitalSigns"("appointment_id");

-- CreateIndex
CREATE INDEX "VitalSigns_patient_id_idx" ON "VitalSigns"("patient_id");

-- CreateIndex
CREATE INDEX "VitalSigns_nurse_id_idx" ON "VitalSigns"("nurse_id");

-- AddForeignKey
ALTER TABLE "VitalSigns" ADD CONSTRAINT "VitalSigns_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSigns" ADD CONSTRAINT "VitalSigns_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSigns" ADD CONSTRAINT "VitalSigns_nurse_id_fkey" FOREIGN KEY ("nurse_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
