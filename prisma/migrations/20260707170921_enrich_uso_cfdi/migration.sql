/*
  Warnings:

  - You are about to drop the column `ciudad` on the `hospitales` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "hospitales" DROP COLUMN "ciudad";

-- AlterTable
ALTER TABLE "tarifas" ADD COLUMN     "actualizado_por" TEXT,
ADD COLUMN     "actualizar" INTEGER,
ADD COLUMN     "comentarios" TEXT,
ADD COLUMN     "especial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metodo_pago_id" TEXT,
ADD COLUMN     "orden" INTEGER,
ADD COLUMN     "porcentaje_precio" DECIMAL(7,2),
ADD COLUMN     "tipo_actualizacion" BOOLEAN,
ADD COLUMN     "tipo_cubrimiento_id" TEXT,
ADD COLUMN     "ultima_actualizacion" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "usos_cfdi" ADD COLUMN     "aplica_persona_fisica" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aplica_persona_moral" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "formas_pago" (
    "id" TEXT NOT NULL,
    "forma" TEXT NOT NULL,
    "efectivo" BOOLEAN NOT NULL DEFAULT false,
    "tc" BOOLEAN,

    CONSTRAINT "formas_pago_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tarifas" ADD CONSTRAINT "tarifas_tipo_cubrimiento_id_fkey" FOREIGN KEY ("tipo_cubrimiento_id") REFERENCES "tarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas" ADD CONSTRAINT "tarifas_metodo_pago_id_fkey" FOREIGN KEY ("metodo_pago_id") REFERENCES "formas_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
