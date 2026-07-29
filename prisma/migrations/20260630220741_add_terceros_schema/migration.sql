/*
  Warnings:

  - A unique constraint covering the columns `[tercero_id]` on the table `hospitales` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_legacy]` on the table `terceros` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ClasificacionTercero" AS ENUM ('PARTICULAR', 'DISTRIBUIDOR', 'ASEGURADORA', 'CLIENTE', 'EMPLEADO', 'HOSPITAL', 'DOCTOR', 'COMISIONISTA', 'INVERSIONISTA', 'EMPRESA', 'PROVEEDOR', 'SEDE', 'ALMACEN', 'GRUPO', 'OTROS');

-- AlterTable
ALTER TABLE "hospitales" ADD COLUMN     "ciudad_id" TEXT,
ADD COLUMN     "tercero_id" TEXT;

-- AlterTable
ALTER TABLE "sedes" ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "observaciones" TEXT;

-- AlterTable
ALTER TABLE "terceros" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cargo_id" TEXT,
ADD COLUMN     "ciudad_id" TEXT,
ADD COLUMN     "creado_en" TIMESTAMP(3),
ADD COLUMN     "creado_por" TEXT,
ADD COLUMN     "estado_id" TEXT,
ADD COLUMN     "fecha_nacimiento" DATE,
ADD COLUMN     "foto_perfil_url" TEXT,
ADD COLUMN     "grupo" TEXT,
ADD COLUMN     "id_legacy" TEXT,
ADD COLUMN     "mir" BOOLEAN DEFAULT false,
ADD COLUMN     "nombre_comercial" TEXT,
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "pais_id" TEXT,
ADD COLUMN     "primer_apellido" TEXT,
ADD COLUMN     "primer_nombre" TEXT,
ADD COLUMN     "segundo_apellido" TEXT,
ADD COLUMN     "segundo_nombre" TEXT,
ADD COLUMN     "tarifa_id" TEXT,
ADD COLUMN     "tipo_contacto" BOOLEAN,
ADD COLUMN     "tipo_persona" BOOLEAN;

-- CreateTable
CREATE TABLE "paises" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "paises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pais_id" TEXT,

    CONSTRAINT "estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciudades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado_id" TEXT,

    CONSTRAINT "ciudades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regimenes_fiscales" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "regimenes_fiscales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usos_cfdi" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "usos_cfdi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tercero_clasificaciones" (
    "tercero_id" TEXT NOT NULL,
    "clasificacion" "ClasificacionTercero" NOT NULL,

    CONSTRAINT "tercero_clasificaciones_pkey" PRIMARY KEY ("tercero_id","clasificacion")
);

-- CreateTable
CREATE TABLE "datos_fiscales" (
    "id" TEXT NOT NULL,
    "tercero_id" TEXT NOT NULL,
    "rfc" TEXT,
    "razon_social" TEXT,
    "regimen_fiscal_id" TEXT,
    "codigo_postal_fiscal" TEXT,
    "uso_cfdi_id" TEXT,
    "direccion_fiscal" TEXT,

    CONSTRAINT "datos_fiscales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tercero_sedes_disponibles" (
    "tercero_id" TEXT NOT NULL,
    "sede_id" TEXT NOT NULL,

    CONSTRAINT "tercero_sedes_disponibles_pkey" PRIMARY KEY ("tercero_id","sede_id")
);

-- CreateTable
CREATE TABLE "tercero_sedes_autorizaciones" (
    "tercero_id" TEXT NOT NULL,
    "sede_id" TEXT NOT NULL,

    CONSTRAINT "tercero_sedes_autorizaciones_pkey" PRIMARY KEY ("tercero_id","sede_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paises_nombre_key" ON "paises"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cargos_nombre_key" ON "cargos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tarifas_nombre_key" ON "tarifas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "datos_fiscales_tercero_id_key" ON "datos_fiscales"("tercero_id");

-- CreateIndex
CREATE UNIQUE INDEX "hospitales_tercero_id_key" ON "hospitales"("tercero_id");

-- CreateIndex
CREATE UNIQUE INDEX "terceros_id_legacy_key" ON "terceros"("id_legacy");

-- AddForeignKey
ALTER TABLE "estados" ADD CONSTRAINT "estados_pais_id_fkey" FOREIGN KEY ("pais_id") REFERENCES "paises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciudades" ADD CONSTRAINT "ciudades_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terceros" ADD CONSTRAINT "terceros_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terceros" ADD CONSTRAINT "terceros_tarifa_id_fkey" FOREIGN KEY ("tarifa_id") REFERENCES "tarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terceros" ADD CONSTRAINT "terceros_ciudad_id_fkey" FOREIGN KEY ("ciudad_id") REFERENCES "ciudades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terceros" ADD CONSTRAINT "terceros_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terceros" ADD CONSTRAINT "terceros_pais_id_fkey" FOREIGN KEY ("pais_id") REFERENCES "paises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tercero_clasificaciones" ADD CONSTRAINT "tercero_clasificaciones_tercero_id_fkey" FOREIGN KEY ("tercero_id") REFERENCES "terceros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datos_fiscales" ADD CONSTRAINT "datos_fiscales_tercero_id_fkey" FOREIGN KEY ("tercero_id") REFERENCES "terceros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datos_fiscales" ADD CONSTRAINT "datos_fiscales_regimen_fiscal_id_fkey" FOREIGN KEY ("regimen_fiscal_id") REFERENCES "regimenes_fiscales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datos_fiscales" ADD CONSTRAINT "datos_fiscales_uso_cfdi_id_fkey" FOREIGN KEY ("uso_cfdi_id") REFERENCES "usos_cfdi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tercero_sedes_disponibles" ADD CONSTRAINT "tercero_sedes_disponibles_tercero_id_fkey" FOREIGN KEY ("tercero_id") REFERENCES "terceros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tercero_sedes_disponibles" ADD CONSTRAINT "tercero_sedes_disponibles_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tercero_sedes_autorizaciones" ADD CONSTRAINT "tercero_sedes_autorizaciones_tercero_id_fkey" FOREIGN KEY ("tercero_id") REFERENCES "terceros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tercero_sedes_autorizaciones" ADD CONSTRAINT "tercero_sedes_autorizaciones_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitales" ADD CONSTRAINT "hospitales_ciudad_id_fkey" FOREIGN KEY ("ciudad_id") REFERENCES "ciudades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitales" ADD CONSTRAINT "hospitales_tercero_id_fkey" FOREIGN KEY ("tercero_id") REFERENCES "terceros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
