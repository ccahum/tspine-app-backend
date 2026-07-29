-- CreateTable
CREATE TABLE "facturas" (
    "id_factura" TEXT NOT NULL,
    "marca_de_tiempo" TIMESTAMP(3),
    "fecha_creacion" DATE,
    "generada_por_id" TEXT,
    "remision_id" TEXT,
    "empresa_id" TEXT,
    "cliente_id" TEXT,
    "folio_facturacion" TEXT,
    "doctor" TEXT,
    "hospital" TEXT,
    "paciente" TEXT,
    "fecha_cirugia" DATE,
    "descuento_global" DECIMAL(15,2),
    "sede_id" TEXT,
    "observaciones" TEXT,
    "impuestos" TEXT,
    "fecha_factura" DATE,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id_factura")
);

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_generada_por_id_fkey" FOREIGN KEY ("generada_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_remision_id_fkey" FOREIGN KEY ("remision_id") REFERENCES "remisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
