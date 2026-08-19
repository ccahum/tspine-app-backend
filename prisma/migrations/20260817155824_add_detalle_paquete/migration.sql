-- CreateTable
CREATE TABLE "detalle_paquetes" (
    "id_detalle_paquete" TEXT NOT NULL,
    "paquete_id" TEXT,
    "producto_id" TEXT,
    "nivel_1" INTEGER,
    "nivel_2" INTEGER,
    "nivel_3" INTEGER,
    "nivel_4" INTEGER,
    "nivel_5" INTEGER,
    "nivel_6" INTEGER,

    CONSTRAINT "detalle_paquetes_pkey" PRIMARY KEY ("id_detalle_paquete")
);

-- AddForeignKey
ALTER TABLE "detalle_paquetes" ADD CONSTRAINT "detalle_paquetes_paquete_id_fkey" FOREIGN KEY ("paquete_id") REFERENCES "paquetes_cotizaciones"("id_paquete") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_paquetes" ADD CONSTRAINT "detalle_paquetes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;
