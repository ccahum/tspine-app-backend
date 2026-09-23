-- DENEGAR en el CSV de Productos no es un booleano: trae ids de Tarifa/Subtarifa separados por
-- coma (ej. "1A1 , Orgoa") — el producto no se puede cotizar bajo esas tarifas. Se elimina la
-- columna boolean (que se quedaba siempre en NULL, ver commit anterior) y en su lugar se agrega
-- una tabla de relación, una fila por combinación producto+tarifa denegada, mismo patrón que
-- referencias_especiales/nombres_productos_especiales.

-- DropColumn
ALTER TABLE "productos" DROP COLUMN "denegar";

-- CreateTable
CREATE TABLE "producto_tarifas_denegadas" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT,
    "tarifa_id" TEXT,

    CONSTRAINT "producto_tarifas_denegadas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "producto_tarifas_denegadas" ADD CONSTRAINT "producto_tarifas_denegadas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_tarifas_denegadas" ADD CONSTRAINT "producto_tarifas_denegadas_tarifa_id_fkey" FOREIGN KEY ("tarifa_id") REFERENCES "subtarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
