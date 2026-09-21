-- Índices para los campos usados en ORDER BY de Listas de Precio (producto.nombre,
-- subtarifa.orden) y Precios Especiales (contacto.nombre_completo), más las FKs de
-- listas_precio/precios_especiales que tampoco tenían índice (afectan el JOIN, no solo el orden).
CREATE INDEX "productos_nombre_idx" ON "productos"("nombre");
CREATE INDEX "subtarifas_orden_idx" ON "subtarifas"("orden");
CREATE INDEX "terceros_nombre_completo_idx" ON "terceros"("nombre_completo");

CREATE INDEX "listas_precio_producto_id_idx" ON "listas_precio"("producto_id");
CREATE INDEX "listas_precio_subtarifa_id_idx" ON "listas_precio"("subtarifa_id");

CREATE INDEX "precios_especiales_producto_id_idx" ON "precios_especiales"("producto_id");
CREATE INDEX "precios_especiales_contacto_id_idx" ON "precios_especiales"("contacto_id");
