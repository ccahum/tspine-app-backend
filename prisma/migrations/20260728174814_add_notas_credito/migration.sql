-- CreateTable
CREATE TABLE "notas_credito" (
    "id_nota_credito" TEXT NOT NULL,
    "marca_tiempo" TIMESTAMP(3),
    "fecha_remision" DATE,
    "fecha_nota_credito" DATE,
    "factura_id" TEXT,
    "total" DECIMAL(15,2),
    "forma_descuento" TEXT,
    "valor" DECIMAL(15,2),
    "porcentaje" DECIMAL(5,2),
    "aplicada_por_id" TEXT,
    "notas" TEXT,
    "valor_nc" DECIMAL(15,2),

    CONSTRAINT "notas_credito_pkey" PRIMARY KEY ("id_nota_credito")
);

-- AddForeignKey
ALTER TABLE "notas_credito" ADD CONSTRAINT "notas_credito_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id_factura") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_credito" ADD CONSTRAINT "notas_credito_aplicada_por_id_fkey" FOREIGN KEY ("aplicada_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
