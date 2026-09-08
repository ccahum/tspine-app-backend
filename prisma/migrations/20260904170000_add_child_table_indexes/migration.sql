-- programacionId/remisionId son, por lejos, las columnas más filtradas en todo el código
-- (63 y 17 apariciones respectivamente en where/relations) — se replican en las tablas hijas
-- que cuelgan de Programación/Remisión.
CREATE INDEX IF NOT EXISTS "det_consumos_programacion_id_idx" ON "det_consumos" ("programacion_id");
CREATE INDEX IF NOT EXISTS "det_consumos_remision_id_idx" ON "det_consumos" ("remision_id");
CREATE INDEX IF NOT EXISTS "det_tecnicos_programacion_id_idx" ON "det_tecnicos" ("programacion_id");
CREATE INDEX IF NOT EXISTS "det_tecnicos_remision_id_idx" ON "det_tecnicos" ("remision_id");
CREATE INDEX IF NOT EXISTS "val_consumo_programacion_id_idx" ON "val_consumo" ("programacion_id");
CREATE INDEX IF NOT EXISTS "val_consumo_remision_id_idx" ON "val_consumo" ("remision_id");
CREATE INDEX IF NOT EXISTS "det_tecnicos_detalles_programacion_id_idx" ON "det_tecnicos_detalles" ("programacion_id");
CREATE INDEX IF NOT EXISTS "det_tecnicos_detalles_remision_id_idx" ON "det_tecnicos_detalles" ("remision_id");
CREATE INDEX IF NOT EXISTS "rem_tecnicos_programacion_id_idx" ON "rem_tecnicos" ("programacion_id");
CREATE INDEX IF NOT EXISTS "rem_tecnicos_remision_id_idx" ON "rem_tecnicos" ("remision_id");
CREATE INDEX IF NOT EXISTS "requisiciones_programacion_id_idx" ON "requisiciones" ("programacion_id");
CREATE INDEX IF NOT EXISTS "facturas_remision_id_idx" ON "facturas" ("remision_id");
