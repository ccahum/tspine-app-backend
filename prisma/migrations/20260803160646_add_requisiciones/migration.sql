-- CreateTable
CREATE TABLE "requisiciones" (
    "id_movimiento" TEXT NOT NULL,
    "marca_de_tiempo" TIMESTAMP(3),
    "usuario_id" TEXT,
    "fecha" DATE,
    "status" TEXT,
    "id_relacionado" TEXT,
    "proviene_de_programacion" BOOLEAN,
    "programacion_id" TEXT,
    "folio" TEXT,
    "validacion" TEXT,
    "existe_programacion" BOOLEAN,
    "cubrimiento_id" TEXT,
    "tarifa_id" TEXT,
    "contacto_id" TEXT,
    "sede_origen_id" TEXT,

    CONSTRAINT "requisiciones_pkey" PRIMARY KEY ("id_movimiento")
);

-- AddForeignKey
ALTER TABLE "requisiciones" ADD CONSTRAINT "requisiciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisiciones" ADD CONSTRAINT "requisiciones_contacto_id_fkey" FOREIGN KEY ("contacto_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisiciones" ADD CONSTRAINT "requisiciones_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisiciones" ADD CONSTRAINT "requisiciones_cubrimiento_id_fkey" FOREIGN KEY ("cubrimiento_id") REFERENCES "subtarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisiciones" ADD CONSTRAINT "requisiciones_tarifa_id_fkey" FOREIGN KEY ("tarifa_id") REFERENCES "subtarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisiciones" ADD CONSTRAINT "requisiciones_sede_origen_id_fkey" FOREIGN KEY ("sede_origen_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
