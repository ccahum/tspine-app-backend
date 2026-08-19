-- CreateTable
CREATE TABLE "conceptos" (
    "id" TEXT NOT NULL,
    "concepto" TEXT,
    "tipo" TEXT,

    CONSTRAINT "conceptos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" TEXT NOT NULL,
    "marca_tiempo" TIMESTAMP(3),
    "orden_a_validar" TEXT,
    "folio" TEXT,
    "fecha" DATE,
    "almacen_destino_id" TEXT,
    "ubicacion_destino_id" TEXT,
    "forma" TEXT,
    "proveedor_id" TEXT,
    "fecha_vencimiento" DATE,
    "registrado_por_id" TEXT,
    "estado" TEXT,
    "contador" INTEGER,
    "status" TEXT,
    "tipo_compra" BOOLEAN,
    "proyecto_id" TEXT,
    "forma_pago_id" TEXT,
    "solicitud_cotizacion" TEXT,
    "tipo_persona" TEXT,
    "contador_compras" INTEGER,
    "pdf" TEXT,
    "condiciones_pago" TEXT,
    "uso_cfdi" TEXT,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_almacen_destino_id_fkey" FOREIGN KEY ("almacen_destino_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_ubicacion_destino_id_fkey" FOREIGN KEY ("ubicacion_destino_id") REFERENCES "almacenes"("id_almacen") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_forma_pago_id_fkey" FOREIGN KEY ("forma_pago_id") REFERENCES "formas_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
