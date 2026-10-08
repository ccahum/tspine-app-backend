-- AlterTable
ALTER TABLE "cotizaciones" ADD COLUMN "firmado_por_id" TEXT;
ALTER TABLE "cotizaciones" ADD COLUMN "firmado_en" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_firmado_por_id_fkey" FOREIGN KEY ("firmado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
