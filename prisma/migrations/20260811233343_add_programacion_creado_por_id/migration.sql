-- AlterTable
ALTER TABLE "programaciones" ADD COLUMN     "creado_por_id" TEXT;

-- AddForeignKey
ALTER TABLE "programaciones" ADD CONSTRAINT "programaciones_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
