-- Soft-delete para cotizaciones: "Eliminar" ya no borra el registro, solo lo marca como inactivo
-- (activo = false) para que deje de aparecer en el listado pero el dato quede conservado.
ALTER TABLE "cotizaciones" ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;
