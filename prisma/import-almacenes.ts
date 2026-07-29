/**
 * import-almacenes.ts
 * Puebla: almacenes
 * Dependencias: Sede
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'node:fs';
import * as path from 'node:path';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(String.raw`C:\Users\ASUS\Desktop\tspine-csv`, 'SistemaTspine1.0 - Almacenes.csv');

// ── Column resolver ───────────────────────────────────────────────────────────

let _colIndex: Map<string, number> = new Map();

function buildColIndex(header: Record<string, string>) {
  _colIndex = new Map();
  Object.keys(header).forEach((key, idx) => {
    const n = key.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!_colIndex.has(n)) _colIndex.set(n, idx);
  });
}

function norm(name: string): string {
  return name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function getCol(row: Record<string, string>, name: string): string | undefined {
  const idx = _colIndex.get(norm(name));
  if (idx === undefined) return undefined;
  return Object.values(row)[idx];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT ALMACENES');
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

  const sedesById    = new Set<string>();
  const sedesByNombre = new Map<string, string>();
  const allSedes = await prisma.sede.findMany({ select: { id: true, nombre: true } });
  for (const s of allSedes) {
    sedesById.add(s.id);
    sedesByNombre.set(norm(s.nombre), s.id);
  }
  console.log(`  ✓ ${allSedes.length} sedes`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const sedesNR = new Map<string, number>();
  const idCount = new Map<string, number>();

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const sedeRaw = getCol(row, 'SEDE')?.trim();
    if (sedeRaw) {
      const resuelta = sedesById.has(sedeRaw) || sedesByNombre.has(norm(sedeRaw));
      if (!resuelta) sedesNR.set(sedeRaw, (sedesNR.get(sedeRaw) ?? 0) + 1);
    }
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);
  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else dupIds.forEach(([id, c]) => console.log(`  ⚠ Duplicado: ${id} (${c}x)`));

  if (sedesNR.size === 0) {
    console.log('  ✓ Todas las sedes resueltas');
  } else {
    console.log(`  ⚠ ${sedesNR.size} sedes sin resolver:`);
    sedesNR.forEach((c, k) => console.log(`    - "${k}" (${c} registro${c > 1 ? 's' : ''})`));
  }

  // ── [3/3] Upsert ─────────────────────────────────────────────────────────
  console.log('\n[3/3] Importando almacenes (upsert)...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidos++; continue; }

    const nombre  = getCol(row, 'NOMBRE')?.trim() ?? null;
    const tipo    = getCol(row, 'TIPO')?.trim() ?? null;

    const sedeRaw = getCol(row, 'SEDE')?.trim();
    let sedeId: string | null = null;
    if (sedeRaw) {
      if (sedesById.has(sedeRaw)) {
        sedeId = sedeRaw;
      } else {
        sedeId = sedesByNombre.get(norm(sedeRaw)) ?? null;
      }
    }

    try {
      await prisma.almacen.upsert({
        where:  { id },
        create: { id, nombre, sedeId, tipo },
        update: { nombre, sedeId, tipo },
      });
      importados++;
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados        : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID) : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados    : ${dupIds.length}`);
  console.log(`  ⚠ Sedes s/resolver  : ${sedesNR.size}`);
  console.log(`  ❌ Errores          : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
