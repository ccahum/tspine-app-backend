/*
  Warnings:

  - You are about to drop the column `id_legacy` on the `programaciones` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "programaciones_id_legacy_key";

-- AlterTable
ALTER TABLE "programaciones" DROP COLUMN "id_legacy";
