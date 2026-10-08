-- AlterTable
ALTER TABLE "cotizaciones" ADD COLUMN "editado_por_id" TEXT;
ALTER TABLE "cotizaciones" ADD COLUMN "editado_en" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_editado_por_id_fkey" FOREIGN KEY ("editado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
