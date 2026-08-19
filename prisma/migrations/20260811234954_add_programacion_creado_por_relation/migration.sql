-- AddForeignKey
ALTER TABLE "programaciones" ADD CONSTRAINT "programaciones_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
