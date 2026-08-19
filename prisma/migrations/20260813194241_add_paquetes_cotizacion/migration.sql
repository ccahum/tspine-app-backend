-- CreateTable
CREATE TABLE "paquetes_cotizaciones" (
    "id_paquete" TEXT NOT NULL,
    "nombre_paquete" TEXT,
    "descripcion" TEXT,
    "estado" TEXT,

    CONSTRAINT "paquetes_cotizaciones_pkey" PRIMARY KEY ("id_paquete")
);
