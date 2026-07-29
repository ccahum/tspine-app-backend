-- Renombrar tabla conservando todos los datos
-- Usando IF EXISTS por si la migración falló a medias

ALTER TABLE "remisiones" DROP CONSTRAINT IF EXISTS "remisiones_cubrimiento_id_fkey";
ALTER TABLE "remisiones" DROP CONSTRAINT IF EXISTS "remisiones_tarifa_id_fkey";
ALTER TABLE "tarifas"    DROP CONSTRAINT IF EXISTS "tarifas_metodo_pago_id_fkey";
ALTER TABLE "tarifas"    DROP CONSTRAINT IF EXISTS "tarifas_tipo_cubrimiento_id_fkey";
ALTER TABLE "terceros"   DROP CONSTRAINT IF EXISTS "terceros_tarifa_id_fkey";

ALTER TABLE "tarifas" RENAME TO "subtarifas";
ALTER INDEX "tarifas_nombre_key" RENAME TO "subtarifas_nombre_key";

ALTER TABLE "subtarifas" ADD CONSTRAINT "subtarifas_tipo_cubrimiento_id_fkey"  FOREIGN KEY ("tipo_cubrimiento_id") REFERENCES "subtarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subtarifas" ADD CONSTRAINT "subtarifas_metodo_pago_id_fkey"       FOREIGN KEY ("metodo_pago_id")       REFERENCES "formas_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "terceros"   ADD CONSTRAINT "terceros_tarifa_id_fkey"               FOREIGN KEY ("tarifa_id")            REFERENCES "subtarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_tarifa_id_fkey"             FOREIGN KEY ("tarifa_id")            REFERENCES "subtarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_cubrimiento_id_fkey"        FOREIGN KEY ("cubrimiento_id")       REFERENCES "subtarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
