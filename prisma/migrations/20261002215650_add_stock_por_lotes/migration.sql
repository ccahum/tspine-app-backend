-- CreateTable
CREATE TABLE "stock_por_lotes" (
    "id_existencia" TEXT NOT NULL,
    "lote_id" TEXT,
    "producto_id" TEXT,
    "sede_id" TEXT,
    "almacen_id" TEXT,
    "origen" TEXT,
    "registrado_por_id" TEXT,
    "marca_tiempo" TIMESTAMP(3),
    "validaciones_id" TEXT,

    CONSTRAINT "stock_por_lotes_pkey" PRIMARY KEY ("id_existencia")
);

-- AddForeignKey
ALTER TABLE "stock_por_lotes" ADD CONSTRAINT "stock_por_lotes_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id_lote") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_por_lotes" ADD CONSTRAINT "stock_por_lotes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_por_lotes" ADD CONSTRAINT "stock_por_lotes_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_por_lotes" ADD CONSTRAINT "stock_por_lotes_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id_almacen") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_por_lotes" ADD CONSTRAINT "stock_por_lotes_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
