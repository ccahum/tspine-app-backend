-- Firma dibujada por el usuario (PNG en base64), opcional — se agrega al crear la cotización o
-- después desde el detalle.
ALTER TABLE "cotizaciones" ADD COLUMN "firma" TEXT;
