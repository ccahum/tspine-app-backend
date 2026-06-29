-- CreateTable
CREATE TABLE "hospitales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT,

    CONSTRAINT "hospitales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programaciones" (
    "id" TEXT NOT NULL,
    "id_legacy" TEXT,
    "creado_por" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_qx" DATE,
    "hora_qx" TEXT,
    "sede_id" TEXT,
    "hospital_id" TEXT,
    "consumo" TEXT,
    "observaciones" TEXT,
    "num_program" TEXT,
    "avance" DECIMAL(5,2),
    "sin_remision" BOOLEAN NOT NULL DEFAULT false,
    "consumo_no_validado" BOOLEAN NOT NULL DEFAULT false,
    "sin_comision" BOOLEAN NOT NULL DEFAULT false,
    "cerrada" BOOLEAN NOT NULL DEFAULT false,
    "total" DECIMAL(15,2),
    "descuentos" DECIMAL(15,2),
    "nc" DECIMAL(15,2),
    "base_ingreso" DECIMAL(15,2),
    "comisiones" DECIMAL(15,2),
    "utilidad_bruta" DECIMAL(15,2),
    "costo_total" DECIMAL(15,4),
    "saldo" DECIMAL(15,2),
    "monto_tecnicos" DECIMAL(15,2),
    "monto_inversionistas" DECIMAL(15,2),
    "monto_plus" DECIMAL(15,2),
    "estado_requisicion" TEXT,

    CONSTRAINT "programaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programacion_medicos" (
    "programacion_id" TEXT NOT NULL,
    "medico_id" TEXT NOT NULL,

    CONSTRAINT "programacion_medicos_pkey" PRIMARY KEY ("programacion_id","medico_id")
);

-- CreateTable
CREATE TABLE "programacion_tecnicos" (
    "programacion_id" TEXT NOT NULL,
    "tecnico_id" TEXT NOT NULL,

    CONSTRAINT "programacion_tecnicos_pkey" PRIMARY KEY ("programacion_id","tecnico_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programaciones_id_legacy_key" ON "programaciones"("id_legacy");

-- AddForeignKey
ALTER TABLE "programaciones" ADD CONSTRAINT "programaciones_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programaciones" ADD CONSTRAINT "programaciones_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programacion_medicos" ADD CONSTRAINT "programacion_medicos_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programacion_medicos" ADD CONSTRAINT "programacion_medicos_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "terceros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programacion_tecnicos" ADD CONSTRAINT "programacion_tecnicos_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programacion_tecnicos" ADD CONSTRAINT "programacion_tecnicos_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "terceros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
