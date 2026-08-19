-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "marca_tiempo" TIMESTAMP(3),
    "empresa_id" TEXT,
    "sede_id" TEXT,
    "tipo" TEXT,
    "contacto_id" TEXT,
    "num_recaudo" TEXT,
    "fecha" DATE,
    "forma_recaudo_id" TEXT,
    "cuenta_id" TEXT,
    "destino_id" TEXT,
    "valor" DECIMAL(15,2),
    "porcentaje_comision" DECIMAL(5,2),
    "funcionario_recibe_id" TEXT,
    "concepto_id" TEXT,
    "observaciones" TEXT,
    "no_rec" TEXT,
    "status" TEXT,
    "tipo_de_recaudo" TEXT,
    "porcentaje" DECIMAL(5,2),
    "imagen_soporte" TEXT,
    "archivo_soporte" TEXT,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_contacto_id_fkey" FOREIGN KEY ("contacto_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_forma_recaudo_id_fkey" FOREIGN KEY ("forma_recaudo_id") REFERENCES "formas_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_destino_id_fkey" FOREIGN KEY ("destino_id") REFERENCES "bancos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_funcionario_recibe_id_fkey" FOREIGN KEY ("funcionario_recibe_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_concepto_id_fkey" FOREIGN KEY ("concepto_id") REFERENCES "conceptos_movimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
