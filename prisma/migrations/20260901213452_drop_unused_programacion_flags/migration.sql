/*
  Warnings:

  - You are about to drop the column `cerrada` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `consumo_no_validado` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `sin_comision` on the `programaciones` table. All the data in the column will be lost.
  - You are about to drop the column `sin_remision` on the `programaciones` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "programaciones" DROP COLUMN "cerrada",
DROP COLUMN "consumo_no_validado",
DROP COLUMN "sin_comision",
DROP COLUMN "sin_remision";
