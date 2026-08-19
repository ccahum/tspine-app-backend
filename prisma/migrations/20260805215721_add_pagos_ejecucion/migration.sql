-- CreateTable
CREATE TABLE "pagos_ejecucion" (
    "id_pago" TEXT NOT NULL,
    "registrado_por_id" TEXT,
    "marca_tiempo" TIMESTAMP(3),
    "programacion_pago_id" TEXT,
    "fecha_de_registro" DATE,
    "ejecutado" BOOLEAN,
    "fecha_programado" DATE,
    "fecha_de_ejecucion_fecha" DATE,
    "beneficiario_gasto_id" TEXT,
    "beneficiario_pago_id" TEXT,
    "saldo_por_conciliar" DECIMAL(15,2),
    "monto" DECIMAL(15,2),
    "forma_pago_id" TEXT,
    "cuenta_id" TEXT,
    "origen_id" TEXT,
    "notas" TEXT,
    "folio_relacionado" TEXT,
    "comprobante_pago" TEXT,
    "conciliar_pagos_id" TEXT,
    "archivo_pago" TEXT,
    "saldo" DECIMAL(15,2),
    "tipo_de_comprobante" TEXT,
    "archivo_pago_2" TEXT,
    "imagen" TEXT,
    "fiscal" BOOLEAN,
    "valor_bruto" DECIMAL(15,2),
    "iva" DECIMAL(15,2),
    "iva_ret" DECIMAL(15,2),
    "isr_ret" DECIMAL(15,2),
    "iva_porcentaje" DECIMAL(5,2),
    "iva_ret_porcentaje" DECIMAL(5,2),
    "isr_ret_monto" DECIMAL(15,2),
    "sede" TEXT,
    "ejecutado_por" TEXT,
    "fecha_de_ejecucion" TIMESTAMP(3),

    CONSTRAINT "pagos_ejecucion_pkey" PRIMARY KEY ("id_pago")
);

-- AddForeignKey
ALTER TABLE "pagos_ejecucion" ADD CONSTRAINT "pagos_ejecucion_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_ejecucion" ADD CONSTRAINT "pagos_ejecucion_programacion_pago_id_fkey" FOREIGN KEY ("programacion_pago_id") REFERENCES "programacion_pagos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_ejecucion" ADD CONSTRAINT "pagos_ejecucion_beneficiario_gasto_id_fkey" FOREIGN KEY ("beneficiario_gasto_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_ejecucion" ADD CONSTRAINT "pagos_ejecucion_beneficiario_pago_id_fkey" FOREIGN KEY ("beneficiario_pago_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_ejecucion" ADD CONSTRAINT "pagos_ejecucion_forma_pago_id_fkey" FOREIGN KEY ("forma_pago_id") REFERENCES "formas_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_ejecucion" ADD CONSTRAINT "pagos_ejecucion_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_ejecucion" ADD CONSTRAINT "pagos_ejecucion_origen_id_fkey" FOREIGN KEY ("origen_id") REFERENCES "bancos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_ejecucion" ADD CONSTRAINT "pagos_ejecucion_conciliar_pagos_id_fkey" FOREIGN KEY ("conciliar_pagos_id") REFERENCES "movimientos_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
