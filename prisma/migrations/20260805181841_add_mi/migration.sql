-- CreateTable
CREATE TABLE "mir" (
    "id" TEXT NOT NULL,
    "marca_tiempo" TIMESTAMP(3),
    "tipo_movimiento" TEXT,
    "concepto_movimiento" TEXT,
    "genera_comision" BOOLEAN,
    "tipo_pago_id" TEXT,
    "comision" DECIMAL(5,2),
    "usuario_id" TEXT,
    "num_registro" TEXT,
    "fecha" DATE,
    "origen_id" TEXT,
    "cuenta_origen_id" TEXT,
    "forma_movimiento_id" TEXT,
    "destino_id" TEXT,
    "cuenta_destino_id" TEXT,
    "valor" DECIMAL(15,2),
    "descripcion" TEXT,
    "imagen_soporte" TEXT,
    "archivo_pdf" TEXT,
    "proyecto_id" TEXT,
    "pertenece_a_proyecto" BOOLEAN,

    CONSTRAINT "mir_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mir" ADD CONSTRAINT "mir_tipo_pago_id_fkey" FOREIGN KEY ("tipo_pago_id") REFERENCES "tipos_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mir" ADD CONSTRAINT "mir_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mir" ADD CONSTRAINT "mir_origen_id_fkey" FOREIGN KEY ("origen_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mir" ADD CONSTRAINT "mir_cuenta_origen_id_fkey" FOREIGN KEY ("cuenta_origen_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mir" ADD CONSTRAINT "mir_forma_movimiento_id_fkey" FOREIGN KEY ("forma_movimiento_id") REFERENCES "formas_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mir" ADD CONSTRAINT "mir_destino_id_fkey" FOREIGN KEY ("destino_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mir" ADD CONSTRAINT "mir_cuenta_destino_id_fkey" FOREIGN KEY ("cuenta_destino_id") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mir" ADD CONSTRAINT "mir_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
