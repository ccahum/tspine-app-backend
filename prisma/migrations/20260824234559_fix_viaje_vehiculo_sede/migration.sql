/*
  Warnings:

  - You are about to drop the column `sede_tercero_id` on the `viajes_vehiculo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "viajes_vehiculo" DROP CONSTRAINT "viajes_vehiculo_sede_tercero_id_fkey";

-- AlterTable
ALTER TABLE "viajes_vehiculo" DROP COLUMN "sede_tercero_id",
ADD COLUMN     "sede_id" TEXT;

-- AddForeignKey
ALTER TABLE "viajes_vehiculo" ADD CONSTRAINT "viajes_vehiculo_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
