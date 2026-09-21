-- CreateTable
CREATE TABLE "terceros_grupos" (
    "nombre" TEXT NOT NULL,

    CONSTRAINT "terceros_grupos_pkey" PRIMARY KEY ("nombre")
);

-- Backfill: catálogo poblado con los nombres de grupo reales que ya existen en terceros.grupo.
-- Se excluye el literal "Sí" a propósito: el panel de administración de Terceros usaba esa
-- columna como un Sí/No (ver terceros-admin.service.ts) y llegó a escribir el texto "Sí" ahí en
-- vez del nombre real del grupo — ese valor no es un grupo real, así que no se cataloga.
INSERT INTO "terceros_grupos" ("nombre")
SELECT DISTINCT "grupo" FROM "terceros" WHERE "grupo" IS NOT NULL AND "grupo" <> '' AND "grupo" <> 'Sí';

-- Limpia el placeholder "Sí" que dejó el toggle Sí/No — ya no representa ningún grupo real.
UPDATE "terceros" SET "grupo" = NULL WHERE "grupo" = 'Sí';

-- AlterTable: terceros.grupo (texto libre) pasa a ser terceros.grupo_id (FK al catálogo nuevo).
ALTER TABLE "terceros" RENAME COLUMN "grupo" TO "grupo_id";

-- AddForeignKey
ALTER TABLE "terceros" ADD CONSTRAINT "terceros_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "terceros_grupos"("nombre") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "referencias_especiales" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT,
    "referencia" TEXT,
    "grupo_id" TEXT,

    CONSTRAINT "referencias_especiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nombres_productos_especiales" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT,
    "nombre_especial" TEXT,
    "grupo_id" TEXT,

    CONSTRAINT "nombres_productos_especiales_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "referencias_especiales" ADD CONSTRAINT "referencias_especiales_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referencias_especiales" ADD CONSTRAINT "referencias_especiales_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "terceros_grupos"("nombre") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nombres_productos_especiales" ADD CONSTRAINT "nombres_productos_especiales_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nombres_productos_especiales" ADD CONSTRAINT "nombres_productos_especiales_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "terceros_grupos"("nombre") ON DELETE SET NULL ON UPDATE CASCADE;
