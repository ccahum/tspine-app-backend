-- CreateTable
CREATE TABLE "lotes" (
    "id_lote" TEXT NOT NULL,
    "lote" TEXT,
    "fecha_registro" DATE,
    "fecha_caducidad" DATE,
    "fecha_alerta" DATE,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id_lote")
);
