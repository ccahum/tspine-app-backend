-- CreateTable
CREATE TABLE "vehiculo_catalogo" (
    "id" TEXT NOT NULL,
    "placas" TEXT,
    "nombre" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "fotografia" TEXT,
    "km_actual" INTEGER,
    "sede_id" TEXT,
    "estado" TEXT,

    CONSTRAINT "vehiculo_catalogo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vehiculo_catalogo" ADD CONSTRAINT "vehiculo_catalogo_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
