-- Necesario para el cálculo agregado de "consumoNoValidado" en ProgramacionesRepositoryService.findAll,
-- que filtra val_consumo por det_consumo_id para saber si cada DetConsumo ya tiene alguna validación.
CREATE INDEX IF NOT EXISTS "val_consumo_det_consumo_id_idx" ON "val_consumo" ("det_consumo_id");
