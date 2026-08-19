-- CreateTable
CREATE TABLE "precios_especiales" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT,
    "contacto_id" TEXT,
    "precio" DECIMAL(15,2),
    "notas" TEXT,

    CONSTRAINT "precios_especiales_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "precios_especiales" ADD CONSTRAINT "precios_especiales_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precios_especiales" ADD CONSTRAINT "precios_especiales_contacto_id_fkey" FOREIGN KEY ("contacto_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
