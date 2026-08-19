-- CreateTable
CREATE TABLE "entradas_por_compra" (
    "id_val_lote_compra" TEXT NOT NULL,
    "detalle_compra_id" TEXT,
    "producto_id" TEXT,
    "costo" DECIMAL(15,2),
    "cantidad" DECIMAL(10,2),
    "lote_id" TEXT,
    "contador" INTEGER,
    "almacen_pz" INTEGER,
    "contendedor_pz" INTEGER,
    "h0" DECIMAL(10,2),
    "h1" DECIMAL(10,2),
    "emp_bm" TEXT,
    "temp" TEXT,
    "desviacion" TEXT,
    "ac" TEXT,
    "estado" TEXT,
    "validado_por_id" TEXT,
    "hora_de_validacion" TIMESTAMP(3),
    "notas" TEXT,

    CONSTRAINT "entradas_por_compra_pkey" PRIMARY KEY ("id_val_lote_compra")
);

-- AddForeignKey
ALTER TABLE "entradas_por_compra" ADD CONSTRAINT "entradas_por_compra_detalle_compra_id_fkey" FOREIGN KEY ("detalle_compra_id") REFERENCES "detalle_compras"("id_detalle_compra") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas_por_compra" ADD CONSTRAINT "entradas_por_compra_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas_por_compra" ADD CONSTRAINT "entradas_por_compra_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id_lote") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas_por_compra" ADD CONSTRAINT "entradas_por_compra_validado_por_id_fkey" FOREIGN KEY ("validado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
