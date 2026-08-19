/*
  Warnings:

  - You are about to drop the `conceptos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "conceptos";

-- CreateTable
CREATE TABLE "conceptos_movimientos" (
    "id" TEXT NOT NULL,
    "concepto" TEXT,
    "tipo" TEXT,

    CONSTRAINT "conceptos_movimientos_pkey" PRIMARY KEY ("id")
);
