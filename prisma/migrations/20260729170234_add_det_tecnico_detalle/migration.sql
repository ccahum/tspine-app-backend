-- CreateTable
CREATE TABLE "det_tecnicos_detalles" (
    "id_det_tecnico_detalle" TEXT NOT NULL,
    "det_tecnico_id" TEXT,
    "programacion_id" TEXT,
    "remision_id" TEXT,
    "producto_id" TEXT,
    "valor" DECIMAL(15,2),

    CONSTRAINT "det_tecnicos_detalles_pkey" PRIMARY KEY ("id_det_tecnico_detalle")
);

-- AddForeignKey
ALTER TABLE "det_tecnicos_detalles" ADD CONSTRAINT "det_tecnicos_detalles_det_tecnico_id_fkey" FOREIGN KEY ("det_tecnico_id") REFERENCES "det_tecnicos"("id_det_tecnico") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "det_tecnicos_detalles" ADD CONSTRAINT "det_tecnicos_detalles_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "det_tecnicos_detalles" ADD CONSTRAINT "det_tecnicos_detalles_remision_id_fkey" FOREIGN KEY ("remision_id") REFERENCES "remisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "det_tecnicos_detalles" ADD CONSTRAINT "det_tecnicos_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;
