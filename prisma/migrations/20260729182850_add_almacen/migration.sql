-- CreateTable
CREATE TABLE "almacenes" (
    "id_almacen" TEXT NOT NULL,
    "nombre" TEXT,
    "sede_id" TEXT,
    "tipo" TEXT,

    CONSTRAINT "almacenes_pkey" PRIMARY KEY ("id_almacen")
);

-- AddForeignKey
ALTER TABLE "almacenes" ADD CONSTRAINT "almacenes_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
