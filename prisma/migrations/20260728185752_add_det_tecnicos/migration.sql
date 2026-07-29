-- CreateTable
CREATE TABLE "det_tecnicos" (
    "id_det_tecnico" TEXT NOT NULL,
    "programacion_id" TEXT,
    "categoria" TEXT,
    "tipo" TEXT,
    "tecnico_id" TEXT,
    "vr_comision" DECIMAL(15,2),
    "observaciones" TEXT,
    "estado_actual" BOOLEAN,
    "es_programacion" BOOLEAN,
    "remision_id" TEXT,
    "quieres_desglosar" BOOLEAN,
    "seleccione_tipo" TEXT,
    "agregar_iva" BOOLEAN,
    "cargar_porcentaje" DECIMAL(5,2),

    CONSTRAINT "det_tecnicos_pkey" PRIMARY KEY ("id_det_tecnico")
);

-- AddForeignKey
ALTER TABLE "det_tecnicos" ADD CONSTRAINT "det_tecnicos_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "det_tecnicos" ADD CONSTRAINT "det_tecnicos_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "det_tecnicos" ADD CONSTRAINT "det_tecnicos_remision_id_fkey" FOREIGN KEY ("remision_id") REFERENCES "remisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
