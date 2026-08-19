-- CreateTable
CREATE TABLE "detalle_compras" (
    "id_detalle_compra" TEXT NOT NULL,
    "compra_id" TEXT,
    "producto_id" TEXT,
    "costo" DECIMAL(15,2),
    "cantidad" DECIMAL(10,2),
    "costo_actual" DECIMAL(15,2),
    "actualizar_costo" TEXT,
    "enviado_el" TIMESTAMP(3),
    "enviador_por_id" TEXT,
    "actualizar_solo_costo" BOOLEAN,
    "notas" TEXT,
    "iva_id" TEXT,
    "iva_ret_id" TEXT,
    "isr_ret_id" TEXT,

    CONSTRAINT "detalle_compras_pkey" PRIMARY KEY ("id_detalle_compra")
);

-- AddForeignKey
ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_enviador_por_id_fkey" FOREIGN KEY ("enviador_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_iva_id_fkey" FOREIGN KEY ("iva_id") REFERENCES "cat_iva"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_iva_ret_id_fkey" FOREIGN KEY ("iva_ret_id") REFERENCES "cat_iva_ret"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_isr_ret_id_fkey" FOREIGN KEY ("isr_ret_id") REFERENCES "cat_isr_ret"("id") ON DELETE SET NULL ON UPDATE CASCADE;
