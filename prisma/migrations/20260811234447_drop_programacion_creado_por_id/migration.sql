/*
  Warnings:

  - You are about to drop the column `creado_por_id` on the `programaciones` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "programaciones" DROP CONSTRAINT "programaciones_creado_por_id_fkey";

-- AlterTable
ALTER TABLE "programaciones" DROP COLUMN "creado_por_id";
