-- CreateEnum
CREATE TYPE "ReglaCrud" AS ENUM ('READ_ONLY', 'ADDS_AND_UPDATES', 'ALL_CHANGES');

-- CreateEnum
CREATE TYPE "TablaProtegida" AS ENUM ('Cotizacion', 'Gastos', 'ProgramacionPagos', 'PagosEjecucion');

-- CreateTable
CREATE TABLE "sedes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "sedes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "reglas" "ReglaCrud" NOT NULL DEFAULT 'READ_ONLY',
    "vista_inicial" TEXT,

    CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terceros" (
    "id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "correo" TEXT,
    "password_hash" TEXT,
    "perfil_id" TEXT,
    "sede_id" TEXT,

    CONSTRAINT "terceros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "modulo" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "imagen" TEXT,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_vistas" (
    "perfil_id" TEXT NOT NULL,
    "vista_nombre" TEXT NOT NULL,

    CONSTRAINT "perfil_vistas_pkey" PRIMARY KEY ("perfil_id","vista_nombre")
);

-- CreateTable
CREATE TABLE "acceso_datos" (
    "tercero_id" TEXT NOT NULL,
    "tabla" "TablaProtegida" NOT NULL,
    "sede_id" TEXT NOT NULL,

    CONSTRAINT "acceso_datos_pkey" PRIMARY KEY ("tercero_id","tabla","sede_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "terceros_correo_key" ON "terceros"("correo");

-- AddForeignKey
ALTER TABLE "terceros" ADD CONSTRAINT "terceros_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terceros" ADD CONSTRAINT "terceros_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_vistas" ADD CONSTRAINT "perfil_vistas_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceso_datos" ADD CONSTRAINT "acceso_datos_tercero_id_fkey" FOREIGN KEY ("tercero_id") REFERENCES "terceros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceso_datos" ADD CONSTRAINT "acceso_datos_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
