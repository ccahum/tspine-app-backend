-- CreateTable
CREATE TABLE "det_consumos" (
    "id" TEXT NOT NULL,
    "programacion_id" TEXT,
    "remision_id" TEXT,
    "referencia" TEXT,
    "descripcion" TEXT,
    "cantidad" DECIMAL(10,2),
    "valor_unitario" DECIMAL(15,2),
    "cantidad_usada" DECIMAL(10,2),
    "observaciones" TEXT,
    "eliminar" BOOLEAN NOT NULL DEFAULT false,
    "folio_validacion" TEXT,
    "switch" BOOLEAN,

    CONSTRAINT "det_consumos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "det_consumos" ADD CONSTRAINT "det_consumos_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "det_consumos" ADD CONSTRAINT "det_consumos_remision_id_fkey" FOREIGN KEY ("remision_id") REFERENCES "remisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
