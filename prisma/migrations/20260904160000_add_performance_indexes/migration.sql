-- Índices para columnas usadas frecuentemente en filtros/orden (auditoría de rendimiento)
CREATE INDEX IF NOT EXISTS "programaciones_fecha_qx_idx" ON "programaciones" ("fecha_qx");
CREATE INDEX IF NOT EXISTS "programaciones_sede_id_idx" ON "programaciones" ("sede_id");
CREATE INDEX IF NOT EXISTS "remisiones_programacion_id_idx" ON "remisiones" ("programacion_id");
CREATE INDEX IF NOT EXISTS "remisiones_creado_en_idx" ON "remisiones" ("creado_en");
