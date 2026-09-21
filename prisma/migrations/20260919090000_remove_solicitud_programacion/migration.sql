-- Elimina el submódulo "Solicitud de Programación" (ya no se implementará): tabla hija primero
-- por su FK hacia la tabla padre, luego la tabla padre. CASCADE por si quedó algún índice o
-- constraint dependiente que Prisma no listó explícitamente.
DROP TABLE IF EXISTS "solicitud_programacion_medicos" CASCADE;
DROP TABLE IF EXISTS "solicitudes_programacion" CASCADE;
