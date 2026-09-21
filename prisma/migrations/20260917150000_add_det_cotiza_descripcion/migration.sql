-- AlterTable
ALTER TABLE "det_cotiza" ADD COLUMN "descripcion" TEXT;

-- Backfill: los consumos ya existentes no tenían esta columna — se rellenan con el nombre actual
-- de su producto, para que no aparezcan en blanco. De aquí en adelante, este valor se fija al
-- momento de agregar el consumo (igual que "referencia"), usando el nombre especial del producto
-- si el hospital de la cotización pertenece a un grupo que lo tenga (ver ReferenciaEspecial /
-- NombreProductoEspecial).
UPDATE "det_cotiza" dc
SET "descripcion" = p."nombre"
FROM "productos" p
WHERE dc."producto_id" = p."id_producto" AND dc."descripcion" IS NULL;
