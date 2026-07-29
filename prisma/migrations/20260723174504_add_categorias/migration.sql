-- CreateTable
CREATE TABLE "categorias" (
    "categoria" TEXT NOT NULL,
    "tarifas" BOOLEAN NOT NULL DEFAULT false,
    "depreciacion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("categoria")
);
