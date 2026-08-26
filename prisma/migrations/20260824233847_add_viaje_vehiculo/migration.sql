-- CreateTable
CREATE TABLE "viajes_vehiculo" (
    "id" TEXT NOT NULL,
    "marca_tiempo" TIMESTAMP(3),
    "conductor_id" TEXT,
    "sede_tercero_id" TEXT,
    "vehiculo_id" TEXT,
    "kilometraje_actual" INTEGER,
    "sitio_origen" TEXT,
    "sitio_destino" TEXT,
    "foto_tablero" TEXT,
    "diligencia" TEXT,
    "novedades_estado" TEXT,
    "estado_actual" BOOLEAN,
    "motivo" TEXT,
    "baja_por_id" TEXT,
    "baja_el" DATE,

    CONSTRAINT "viajes_vehiculo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "viajes_vehiculo" ADD CONSTRAINT "viajes_vehiculo_conductor_id_fkey" FOREIGN KEY ("conductor_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes_vehiculo" ADD CONSTRAINT "viajes_vehiculo_sede_tercero_id_fkey" FOREIGN KEY ("sede_tercero_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes_vehiculo" ADD CONSTRAINT "viajes_vehiculo_baja_por_id_fkey" FOREIGN KEY ("baja_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes_vehiculo" ADD CONSTRAINT "viajes_vehiculo_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculo_catalogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
