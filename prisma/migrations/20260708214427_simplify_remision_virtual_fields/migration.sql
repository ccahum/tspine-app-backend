/*
  Warnings:

  - You are about to drop the column `ciudad_id` on the `remisiones` table. All the data in the column will be lost.
  - You are about to drop the column `consumo` on the `remisiones` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_qx` on the `remisiones` table. All the data in the column will be lost.
  - You are about to drop the column `hora_qx` on the `remisiones` table. All the data in the column will be lost.
  - You are about to drop the column `hospital_id` on the `remisiones` table. All the data in the column will be lost.
  - You are about to drop the column `observaciones` on the `remisiones` table. All the data in the column will be lost.
  - You are about to drop the column `sede_id` on the `remisiones` table. All the data in the column will be lost.
  - You are about to drop the `remision_medicos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "remision_medicos" DROP CONSTRAINT "remision_medicos_medico_id_fkey";

-- DropForeignKey
ALTER TABLE "remision_medicos" DROP CONSTRAINT "remision_medicos_remision_id_fkey";

-- DropForeignKey
ALTER TABLE "remisiones" DROP CONSTRAINT "remisiones_ciudad_id_fkey";

-- DropForeignKey
ALTER TABLE "remisiones" DROP CONSTRAINT "remisiones_hospital_id_fkey";

-- DropForeignKey
ALTER TABLE "remisiones" DROP CONSTRAINT "remisiones_sede_id_fkey";

-- AlterTable
ALTER TABLE "remisiones" DROP COLUMN "ciudad_id",
DROP COLUMN "consumo",
DROP COLUMN "fecha_qx",
DROP COLUMN "hora_qx",
DROP COLUMN "hospital_id",
DROP COLUMN "observaciones",
DROP COLUMN "sede_id";

-- DropTable
DROP TABLE "remision_medicos";
