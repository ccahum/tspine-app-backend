-- AlterTable
ALTER TABLE "det_tecnicos" ADD COLUMN "registrado_por_id" TEXT;

-- AddForeignKey
ALTER TABLE "det_tecnicos" ADD CONSTRAINT "det_tecnicos_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
