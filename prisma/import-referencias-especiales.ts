/**
 * import-referencias-especiales.ts
 * Puebla: referencias_especiales
 * Dependencias: Producto, Terceros (para el catálogo de grupos — ver getOrCreateTerceroGrupo)
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - ReferenciasEspeciales.csv');

// ── Column resolver ───────────────────────────────────────────────────────────

let _colIndex: Map<string, number> = new Map();

function buildColIndex(header: Record<string, string>) {
  _colIndex = new Map();
  Object.keys(header).forEach((key, idx) => {
    const n = key.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!_colIndex.has(n)) _colIndex.set(n, idx);
  });
}

function getCol(row: Record<string, string>, name: string): string | undefined {
  const norm = name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const idx  = _colIndex.get(norm);
  if (idx === undefined) return undefined;
  return Object.values(row)[idx];
}

// ── Grupos (catálogo por nombre, ver TerceroGrupo) ────────────────────────────

const grupoCache = new Map<string, string>();

async function getOrCreateTerceroGrupo(nombre: string): Promise<string> {
  if (grupoCache.has(nombre)) return grupoCache.get(nombre)!;
  const r = await prisma.terceroGrupo.upsert({ where: { nombre }, update: {}, create: { nombre } });
  grupoCache.set(nombre, r.nombre);
  return r.nombre;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT REFERENCIAS ESPECIALES');
  console.log('═'.repeat(60));

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\n❌ CSV no encontrado: ${CSV_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows: Record<string, string>[] = parse(content, {
    columns:            true,
    skip_empty_lines:   true,
    relax_quotes:       true,
    relax_column_count: true,
    bom:                true,
  });

  if (rows.length > 0) buildColIndex(rows[0]);
  console.log(`\n📂 CSV cargado: ${rows.length} filas`);

  // ── [1/3] Precargar catálogos ─────────────────────────────────────────────
  console.log('\n[1/3] Precargando catálogos...');

  const productosSet = new Set(
    (await prisma.producto.findMany({ select: { id: true } })).map(p => p.id)
  );
  console.log(`  ✓ ${productosSet.size} productos`);

  // ── [2/3] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[2/3] Truncando referencias_especiales...');
  await prisma.referenciaEspecial.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [3/3] Importar ────────────────────────────────────────────────────────
  console.log('\n[3/3] Importando referencias especiales...');

  let importadas = 0;
  let omitidas   = 0;
  const productosNR: string[] = [];
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidas++; continue; }

    const productoCol = getCol(row, 'PRODUCTO')?.trim() || null;
    const referencia  = getCol(row, 'REFERENCIA')?.trim() || null;
    const grupoNombre = getCol(row, 'GRUPO')?.trim() || null;

    const productoId = productoCol && productosSet.has(productoCol) ? productoCol : null;
    if (productoCol && !productoId) productosNR.push(`${id}: "${productoCol}"`);

    try {
      await prisma.referenciaEspecial.upsert({
        where:  { id },
        update: {},
        create: {
          id,
          productoId,
          referencia,
          grupoId: grupoNombre ? await getOrCreateTerceroGrupo(grupoNombre) : null,
        },
      });
      importadas++;
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importadas          : ${importadas}`);
  console.log(`  ✗ Omitidas (sin ID)   : ${omitidas}`);
  console.log(`  ⚠ Producto s/resolver : ${productosNR.length}`);
  productosNR.slice(0, 20).forEach(p => console.log(`    - ${p}`));
  if (productosNR.length > 20) console.log(`    ... y ${productosNR.length - 20} más`);
  console.log(`  ❌ Errores             : ${errores.length}`);
  errores.forEach(e => console.log(`    - ${e}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
