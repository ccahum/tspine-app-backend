-- DropForeignKey
ALTER TABLE "tecnicos_sugeridos" DROP CONSTRAINT "tecnicos_sugeridos_programacion_id_fkey";

-- AddForeignKey
ALTER TABLE "tecnicos_sugeridos" ADD CONSTRAINT "tecnicos_sugeridos_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
