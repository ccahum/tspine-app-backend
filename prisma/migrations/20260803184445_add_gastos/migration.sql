-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "marca_tiempo" TIMESTAMP(3),
    "num_gasto" TEXT,
    "beneficiario_gasto_id" TEXT,
    "empresa_id" TEXT,
    "sede_id" TEXT,
    "fecha_gasto" DATE,
    "forma_pago_id" TEXT,
    "cuenta_bancaria_id" TEXT,
    "beneficiario_pago_id" TEXT,
    "cuenta_destina_id" TEXT,
    "tipo_gasto_id" TEXT,
    "num_documento" TEXT,
    "descripcion" TEXT,
    "valor" DECIMAL(15,2),
    "imagen_soporte" TEXT,
    "archivo_soporte" TEXT,
    "eliminar" BOOLEAN NOT NULL DEFAULT false,
    "ejecutar" BOOLEAN,
    "proyecto_id" TEXT,
    "clasificacion_id" TEXT,
    "iva_id" TEXT,
    "iva_ret_id" TEXT,
    "isr_ret_id" TEXT,
    "tipo_persona" TEXT,
    "iva_manual" DECIMAL(15,2),
    "fuente_id" TEXT,
    "requiere_fuente" BOOLEAN,
    "ish" BOOLEAN,
    "porcentaje" DECIMAL(7,2),
    "isr_forma" TEXT,
    "isr_valor" DECIMAL(15,2),
    "valor_sin_iva" DECIMAL(15,2),

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_beneficiario_gasto_id_fkey" FOREIGN KEY ("beneficiario_gasto_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_beneficiario_pago_id_fkey" FOREIGN KEY ("beneficiario_pago_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_forma_pago_id_fkey" FOREIGN KEY ("forma_pago_id") REFERENCES "formas_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_cuenta_bancaria_id_fkey" FOREIGN KEY ("cuenta_bancaria_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_cuenta_destina_id_fkey" FOREIGN KEY ("cuenta_destina_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_tipo_gasto_id_fkey" FOREIGN KEY ("tipo_gasto_id") REFERENCES "tipos_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_clasificacion_id_fkey" FOREIGN KEY ("clasificacion_id") REFERENCES "clasificaciones_gasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_iva_id_fkey" FOREIGN KEY ("iva_id") REFERENCES "cat_iva"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_iva_ret_id_fkey" FOREIGN KEY ("iva_ret_id") REFERENCES "cat_iva_ret"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_isr_ret_id_fkey" FOREIGN KEY ("isr_ret_id") REFERENCES "cat_isr_ret"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "programaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
