-- CreateTable
CREATE TABLE "det_requisiciones" (
    "id_detalle" TEXT NOT NULL,
    "movimiento_id" TEXT,
    "lote_id" TEXT,
    "producto_id" TEXT,
    "cantidad" DECIMAL(10,2),
    "precio" DECIMAL(15,2),
    "tarifa_asociada_id" TEXT,

    CONSTRAINT "det_requisiciones_pkey" PRIMARY KEY ("id_detalle")
);

-- AddForeignKey
ALTER TABLE "det_requisiciones" ADD CONSTRAINT "det_requisiciones_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "requisiciones"("id_movimiento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "det_requisiciones" ADD CONSTRAINT "det_requisiciones_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id_lote") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "det_requisiciones" ADD CONSTRAINT "det_requisiciones_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "det_requisiciones" ADD CONSTRAINT "det_requisiciones_tarifa_asociada_id_fkey" FOREIGN KEY ("tarifa_asociada_id") REFERENCES "subtarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
