-- Firma personal del usuario (PNG en base64), opcional — se le ofrece configurarla al iniciar
-- sesión por primera vez, y de ahí en adelante se puede reutilizar en el formulario de
-- crear/editar cotización en vez de tener que dibujarla cada vez.
ALTER TABLE "terceros" ADD COLUMN "firma" TEXT;
