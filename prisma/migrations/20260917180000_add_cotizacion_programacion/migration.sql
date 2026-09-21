-- Vincula una Cotización a la Programación en la que se usó (campo "Cotización" de Nueva
-- Programación, donde se buscan y seleccionan cotizaciones por el nombre del médico).
ALTER TABLE "cotizaciones" ADD COLUMN "programacion_id" TEXT;

ALTER TABLE "cotizaciones"
  ADD CONSTRAINT "cotizaciones_programacion_id_fkey"
  FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "cotizaciones_programacion_id_idx" ON "cotizaciones"("programacion_id");
