-- CreateTable
CREATE TABLE "abonos" (
    "id_abono" TEXT NOT NULL,
    "usuario_id" TEXT,
    "marca_tiempo" TIMESTAMP(3),
    "recaudo_id" TEXT,
    "saldo_actual" DECIMAL(15,2),
    "tercero_id" TEXT,
    "factura_id" TEXT,
    "fecha" DATE,
    "valor" DECIMAL(15,2),
    "forma_pago_id" TEXT,
    "cuenta_id" TEXT,
    "banco_caja_id" TEXT,
    "observaciones" TEXT,
    "saldo" DECIMAL(15,2),
    "no_factura" TEXT,
    "complemento" TEXT,
    "xml" TEXT,
    "estado_complemento" TEXT,
    "previous_balance_amount" DECIMAL(15,2),
    "remaining_balance_amount" DECIMAL(15,2),

    CONSTRAINT "abonos_pkey" PRIMARY KEY ("id_abono")
);

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_recaudo_id_fkey" FOREIGN KEY ("recaudo_id") REFERENCES "movimientos_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_tercero_id_fkey" FOREIGN KEY ("tercero_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id_factura") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_forma_pago_id_fkey" FOREIGN KEY ("forma_pago_id") REFERENCES "formas_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_banco_caja_id_fkey" FOREIGN KEY ("banco_caja_id") REFERENCES "bancos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
