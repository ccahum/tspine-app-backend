/*
  Warnings:

  - You are about to drop the column `descripcion` on the `det_consumos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "det_consumos" DROP COLUMN "descripcion",
ADD COLUMN     "producto_id" TEXT,
ADD COLUMN     "valor" DECIMAL(15,2);

-- AddForeignKey
ALTER TABLE "det_consumos" ADD CONSTRAINT "det_consumos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;
