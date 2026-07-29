-- CreateTable
CREATE TABLE "val_consumo" (
    "id_val_consumo" TEXT NOT NULL,
    "usuario_id" TEXT,
    "marca_tiempo" TIMESTAMP(3),
    "programacion_id" TEXT,
    "remision_id" TEXT,
    "numero_oc" TEXT,
    "det_consumo_id" TEXT,
    "sede_consumo_id" TEXT,
    "existencia" INTEGER,
    "existencia_almacen" INTEGER,
    "existencia_contenedor" INTEGER,
    "lote" TEXT,
    "prod_real_consumido" BOOLEAN,
    "producto_id" TEXT,
    "prod_de_tspine" BOOLEAN,
    "almacen_pz" INTEGER,
    "contenedor_pz" INTEGER,
    "sistema_id" TEXT,
    "observaciones_alm" TEXT,
    "eliminar" BOOLEAN NOT NULL DEFAULT false,
    "idoc" TEXT,
    "costo_actual" DECIMAL(15,2),
    "id_det_consumo_validado" TEXT,
    "estado_autorizacion" TEXT,
    "motivo" TEXT,
    "fecha_autorizacion" TIMESTAMP(3),
    "usuario_autorizador_id" TEXT,
    "sede_usuario_id" TEXT,
    "se_compra" BOOLEAN,
    "metodo_pago_id" TEXT,

    CONSTRAINT "val_consumo_pkey" PRIMARY KEY ("id_val_consumo")
);

-- AddForeignKey
ALTER TABLE "val_consumo" ADD CONSTRAINT "val_consumo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo" ADD CONSTRAINT "val_consumo_usuario_autorizador_id_fkey" FOREIGN KEY ("usuario_autorizador_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo" ADD CONSTRAINT "val_consumo_programacion_id_fkey" FOREIGN KEY ("programacion_id") REFERENCES "programaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo" ADD CONSTRAINT "val_consumo_remision_id_fkey" FOREIGN KEY ("remision_id") REFERENCES "remisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo" ADD CONSTRAINT "val_consumo_det_consumo_id_fkey" FOREIGN KEY ("det_consumo_id") REFERENCES "det_consumos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo" ADD CONSTRAINT "val_consumo_sede_consumo_id_fkey" FOREIGN KEY ("sede_consumo_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo" ADD CONSTRAINT "val_consumo_sede_usuario_id_fkey" FOREIGN KEY ("sede_usuario_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo" ADD CONSTRAINT "val_consumo_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo" ADD CONSTRAINT "val_consumo_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "val_consumo" ADD CONSTRAINT "val_consumo_metodo_pago_id_fkey" FOREIGN KEY ("metodo_pago_id") REFERENCES "formas_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
