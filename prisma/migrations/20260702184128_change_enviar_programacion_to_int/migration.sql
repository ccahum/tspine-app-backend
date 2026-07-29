/*
  Warnings:

  - The `enviar_programacion` column on the `programaciones` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "programaciones" DROP COLUMN "enviar_programacion",
ADD COLUMN     "enviar_programacion" INTEGER;
