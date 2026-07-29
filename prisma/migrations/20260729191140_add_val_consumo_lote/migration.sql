-- CreateTable
CREATE TABLE "val_consumo_lotes" (
    "id_val_consumo_lote" TEXT NOT NULL,
    "val_consumo_id" TEXT,
    "lote_id" TEXT,
    "cantidad" INTEGER,
    "sede_id" TEXT,
    "almacen_id" TEXT,
    "registrado_por_id" TEXT,
    "marca_tiempo" TIMESTAMP(3),

    CONSTRAINT "val_consumo_lotes_pkey" PRIMARY KEY ("id_val_consumo_lote")
);

-- AddForeignKey
ALTER TABLE "val_consumo_lotes" ADD CONSTRAINT "val_consumo_lotes_val_consumo_id_fkey" FOREIGN KEY ("val_consumo_id") REFERENCES "val_consumo"("id_val_consumo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo_lotes" ADD CONSTRAINT "val_consumo_lotes_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id_lote") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo_lotes" ADD CONSTRAINT "val_consumo_lotes_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo_lotes" ADD CONSTRAINT "val_consumo_lotes_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id_almacen") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo_lotes" ADD CONSTRAINT "val_consumo_lotes_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
