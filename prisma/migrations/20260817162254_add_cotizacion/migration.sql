-- CreateTable
CREATE TABLE "cotizaciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "marca_de_tiempo" TIMESTAMP(3),
    "num_cotizacion" TEXT,
    "fecha" DATE,
    "dirigido_a" TEXT,
    "medico" TEXT,
    "hospital_id" TEXT,
    "cirugia" TEXT,
    "cubrimiento_id" TEXT,
    "responsable_economico_id" TEXT,
    "num_proveedor" TEXT,
    "tarifa_id" TEXT,
    "tiempo_entrega" TEXT,
    "observaciones" TEXT,
    "tiene_dcto" BOOLEAN NOT NULL DEFAULT false,
    "porcentaje_dcto" DECIMAL(5,2),
    "vr_dcto" DECIMAL(15,2),
    "vr_dcto_pesos" DECIMAL(15,2),
    "impuestos" TEXT,
    "nota" TEXT,
    "imagen" TEXT,
    "empresa_id" TEXT,
    "status" TEXT,
    "sede_id" TEXT,
    "paquete_id" TEXT,
    "productos_paquete_id" TEXT,
    "contador_paquetes" INTEGER,
    "nivel" TEXT,

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_cubrimiento_id_fkey" FOREIGN KEY ("cubrimiento_id") REFERENCES "subtarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_responsable_economico_id_fkey" FOREIGN KEY ("responsable_economico_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_tarifa_id_fkey" FOREIGN KEY ("tarifa_id") REFERENCES "subtarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_paquete_id_fkey" FOREIGN KEY ("paquete_id") REFERENCES "paquetes_cotizaciones"("id_paquete") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_productos_paquete_id_fkey" FOREIGN KEY ("productos_paquete_id") REFERENCES "detalle_paquetes"("id_detalle_paquete") ON DELETE SET NULL ON UPDATE CASCADE;
