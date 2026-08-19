-- CreateTable
CREATE TABLE "detalles_factura" (
    "id" TEXT NOT NULL,
    "facturacion_id" TEXT,
    "producto_id" TEXT,
    "descripcion" TEXT,
    "cantidad" DECIMAL(10,2),
    "precio_unitario" DECIMAL(15,2),
    "descuento" DECIMAL(15,2),
    "codigo_sat" TEXT,
    "unidad_medida_id" TEXT,
    "iva_id" TEXT,
    "iva_ret_id" TEXT,
    "isr_id" TEXT,
    "objeto_impuesto_id" TEXT,

    CONSTRAINT "detalles_factura_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "detalles_factura" ADD CONSTRAINT "detalles_factura_facturacion_id_fkey" FOREIGN KEY ("facturacion_id") REFERENCES "facturas"("id_factura") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_factura" ADD CONSTRAINT "detalles_factura_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_factura" ADD CONSTRAINT "detalles_factura_unidad_medida_id_fkey" FOREIGN KEY ("unidad_medida_id") REFERENCES "unidades_medida_sat"("id_udem") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_factura" ADD CONSTRAINT "detalles_factura_iva_id_fkey" FOREIGN KEY ("iva_id") REFERENCES "cat_iva"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_factura" ADD CONSTRAINT "detalles_factura_iva_ret_id_fkey" FOREIGN KEY ("iva_ret_id") REFERENCES "cat_iva_ret"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_factura" ADD CONSTRAINT "detalles_factura_isr_id_fkey" FOREIGN KEY ("isr_id") REFERENCES "cat_isr_ret"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_factura" ADD CONSTRAINT "detalles_factura_objeto_impuesto_id_fkey" FOREIGN KEY ("objeto_impuesto_id") REFERENCES "objetos_impuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
