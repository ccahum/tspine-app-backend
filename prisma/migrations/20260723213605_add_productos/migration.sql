-- CreateTable
CREATE TABLE "productos" (
    "id_producto" TEXT NOT NULL,
    "usuario_id" TEXT,
    "marca_de_tiempo" TIMESTAMP(3),
    "sistema_id" TEXT,
    "referencia" TEXT,
    "nombre" TEXT,
    "categoria_id" TEXT,
    "importado" BOOLEAN NOT NULL DEFAULT false,
    "proveedor_id" TEXT,
    "costo_usd" DECIMAL(15,2),
    "costo_mxn" DECIMAL(15,2),
    "distribuidor" DECIMAL(15,2),
    "particulares" DECIMAL(15,2),
    "hospitales" DECIMAL(15,2),
    "aseguradora" DECIMAL(15,2),
    "orden" INTEGER,
    "imagen" TEXT,
    "observaciones" TEXT,
    "marca_id" TEXT,
    "se_puede_comprar" BOOLEAN NOT NULL DEFAULT false,
    "se_puede_vender" BOOLEAN NOT NULL DEFAULT false,
    "maneja_requisiciones" BOOLEAN NOT NULL DEFAULT false,
    "maneja_lote" BOOLEAN NOT NULL DEFAULT false,
    "actualizar" BOOLEAN,
    "denegar" BOOLEAN,
    "con_base_a_id" TEXT,
    "anos_vida_util" DECIMAL(10,2),
    "min" INTEGER,
    "h0" DECIMAL(10,2),
    "h1" DECIMAL(10,2),
    "maneja_existencias" BOOLEAN NOT NULL DEFAULT false,
    "udi" BOOLEAN,
    "se_reusa" BOOLEAN NOT NULL DEFAULT false,
    "genera_lista_precios" BOOLEAN NOT NULL DEFAULT false,
    "se_cotiza" BOOLEAN NOT NULL DEFAULT false,
    "crear_lista_precios" TEXT,
    "actualizar_costos" TEXT,
    "controlar_stock_remisiones" BOOLEAN NOT NULL DEFAULT false,
    "udem_id" TEXT,
    "codigo_sat" TEXT,
    "objeto_impuesto_id" TEXT,
    "registro_sanitario" TEXT,
    "fecha_vencimiento" DATE,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id_producto")
);

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistemas"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("categoria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id_marca") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_con_base_a_id_fkey" FOREIGN KEY ("con_base_a_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_udem_id_fkey" FOREIGN KEY ("udem_id") REFERENCES "unidades_medida_sat"("id_udem") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_objeto_impuesto_id_fkey" FOREIGN KEY ("objeto_impuesto_id") REFERENCES "objetos_impuesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
