-- CreateTable
CREATE TABLE "det_cotiza" (
    "id_detalle" TEXT NOT NULL,
    "cotizacion_id" TEXT,
    "marca_de_tiempo" TIMESTAMP(3),
    "hospital_id" TEXT,
    "referencia" TEXT,
    "producto_id" TEXT,
    "cantidad" DECIMAL(10,2),
    "valor_unitario" DECIMAL(15,2),
    "valor" DECIMAL(15,2),
    "observaciones" TEXT,
    "sede" TEXT,
    "usuario" TEXT,

    CONSTRAINT "det_cotiza_pkey" PRIMARY KEY ("id_detalle")
);

-- AddForeignKey
ALTER TABLE "det_cotiza" ADD CONSTRAINT "det_cotiza_cotizacion_id_fkey" FOREIGN KEY ("cotizacion_id") REFERENCES "cotizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "det_cotiza" ADD CONSTRAINT "det_cotiza_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "det_cotiza" ADD CONSTRAINT "det_cotiza_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;
