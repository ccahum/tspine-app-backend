/*
  Warnings:

  - You are about to drop the column `alerta_consumos` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `base_ingreso` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `comisiones` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `costo_total` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `descuentos` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `estado_requisicion` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `nc` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `saldo` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `utilidad_bruta` on the `programaciones` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "programaciones" DROP COLUMN "alerta_consumos",
DROP COLUMN "base_ingreso",
DROP COLUMN "comisiones",
DROP COLUMN "costo_total",
DROP COLUMN "descuentos",
DROP COLUMN "estado_requisicion",
DROP COLUMN "nc",
DROP COLUMN "saldo",
DROP COLUMN "total",
DROP COLUMN "utilidad_bruta",
ADD COLUMN     "folio_requisicion" TEXT;
