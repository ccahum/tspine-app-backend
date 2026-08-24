-- CreateTable
CREATE TABLE "solicitudes_programacion" (
    "id" TEXT NOT NULL,
    "fecha_qx" DATE,
    "hora_qx" TEXT,
    "sede_id" TEXT,
    "hospital_id" TEXT,
    "consumo" TEXT,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "motivo_rechazo" TEXT,
    "solicitante_id" TEXT,
    "revisor_id" TEXT,
    "fecha_revision" TIMESTAMP(3),
    "programacion_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitudes_programacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitud_programacion_medicos" (
    "solicitud_id" TEXT NOT NULL,
    "medico_id" TEXT NOT NULL,

    CONSTRAINT "solicitud_programacion_medicos_pkey" PRIMARY KEY ("solicitud_id","medico_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_programacion_programacion_id_key" ON "solicitudes_programacion"("programacion_id");

-- AddForeignKey
ALTER TABLE "solicitudes_programacion" ADD CONSTRAINT "solicitudes_programacion_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_programacion" ADD CONSTRAINT "solicitudes_programacion_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_programacion" ADD CONSTRAINT "solicitudes_programacion_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_programacion" ADD CONSTRAINT "solicitudes_programacion_revisor_id_fkey" FOREIGN KEY ("revisor_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_programacion" ADD CONSTRAINT "solicitudes_programacion_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_programacion_medicos" ADD CONSTRAINT "solicitud_programacion_medicos_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes_programacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_programacion_medicos" ADD CONSTRAINT "solicitud_programacion_medicos_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "terceros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
