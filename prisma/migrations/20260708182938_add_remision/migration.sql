-- CreateTable
CREATE TABLE "remisiones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "creado_en" TIMESTAMP(3),
    "programacion_id" TEXT,
    "fecha_qx" DATE,
    "hora_qx" TEXT,
    "sede_id" TEXT,
    "ciudad_id" TEXT,
    "hospital_id" TEXT,
    "tarifa_id" TEXT,
    "consumo" TEXT,
    "observaciones" TEXT,
    "num_remision" TEXT,
    "empresa_id" TEXT,
    "paciente" TEXT,
    "cirugia_realizada" TEXT,
    "impuestos" TEXT,
    "cubrimiento_id" TEXT,
    "responsable_economico_id" TEXT,
    "anestesiologo" TEXT,
    "tiene_dcto" BOOLEAN NOT NULL DEFAULT false,
    "porcentaje_dcto" DECIMAL(5,2),
    "vr_dcto_pesos" DECIMAL(15,2),
    "estado" TEXT,
    "firma" TEXT,
    "imagen" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "vr_factura" DECIMAL(15,2),
    "diferencia" DECIMAL(15,2),
    "tiene_cotizacion" BOOLEAN NOT NULL DEFAULT false,
    "cotizacion" TEXT,
    "actualizar_folio" BOOLEAN,
    "tiene_factura" BOOLEAN NOT NULL DEFAULT false,
    "estado_factura" TEXT,
    "no_factura" TEXT,
    "fecha_facturacion" DATE,
    "facturado_por" TEXT,
    "cliente_id" TEXT,
    "switch" BOOLEAN,
    "contador" INTEGER,
    "num_factura" TEXT,
    "cxc" BOOLEAN,
    "aseguradora_country" TEXT,

    CONSTRAINT "remisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remision_medicos" (
    "remision_id" TEXT NOT NULL,
    "medico_id" TEXT NOT NULL,

    CONSTRAINT "remision_medicos_pkey" PRIMARY KEY ("remision_id","medico_id")
);

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_ciudad_id_fkey" FOREIGN KEY ("ciudad_id") REFERENCES "ciudades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_tarifa_id_fkey" FOREIGN KEY ("tarifa_id") REFERENCES "tarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_cubrimiento_id_fkey" FOREIGN KEY ("cubrimiento_id") REFERENCES "tarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_responsable_economico_id_fkey" FOREIGN KEY ("responsable_economico_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remision_medicos" ADD CONSTRAINT "remision_medicos_remision_id_fkey" FOREIGN KEY ("remision_id") REFERENCES "remisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remision_medicos" ADD CONSTRAINT "remision_medicos_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "terceros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
