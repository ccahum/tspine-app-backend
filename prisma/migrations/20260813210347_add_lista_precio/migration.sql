-- CreateTable
CREATE TABLE "listas_precio" (
    "id_lista_precio" TEXT NOT NULL,
    "subtarifa_id" TEXT,
    "producto_id" TEXT,
    "costo_utilidad" DECIMAL(15,2),
    "porcentaje_ganancia" DECIMAL(7,2),
    "precio" DECIMAL(15,2),
    "forma_actualizacion" TEXT,

    CONSTRAINT "listas_precio_pkey" PRIMARY KEY ("id_lista_precio")
);

-- AddForeignKey
ALTER TABLE "listas_precio" ADD CONSTRAINT "listas_precio_subtarifa_id_fkey" FOREIGN KEY ("subtarifa_id") REFERENCES "subtarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listas_precio" ADD CONSTRAINT "listas_precio_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;
