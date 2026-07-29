/**
 * import-det-consumos.ts
 * Puebla: det_consumos
 * Requiere: programaciones + remisiones ya importados
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const CSV_PATH = path.join('C:\\Users\\ASUS\\Desktop\\tspine-csv', 'SistemaTspine1.0 - Det_Consumo.csv');

// ── Índice de columnas ────────────────────────────────────────────────────────

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

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseBool(val: string | undefined): boolean {
  if (!val) return false;
  const v = val.trim().toUpperCase();
  return v === 'TRUE' || v === '1';
}

function parseBoolNullable(val: string | undefined): boolean | null {
  if (!val || val.trim() === '') return null;
  const v = val.trim().toUpperCase();
  if (v === 'TRUE'  || v === '1') return true;
  if (v === 'FALSE' || v === '0') return false;
  return null;
}

function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

// ── Caches ────────────────────────────────────────────────────────────────────

const programacionCache = new Map<string, boolean>();
const remisionCache     = new Map<string, boolean>();

async function programacionExiste(id: string): Promise<boolean> {
  if (programacionCache.has(id)) return programacionCache.get(id)!;
  const p = await prisma.programacion.findUnique({ where: { id }, select: { id: true } });
  programacionCache.set(id, p !== null);
  return p !== null;
}

async function remisionExiste(id: string): Promise<boolean> {
  if (remisionCache.has(id)) return remisionCache.get(id)!;
  const r = await prisma.remision.findUnique({ where: { id }, select: { id: true } });
  remisionCache.set(id, r !== null);
  return r !== null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT DET_CONSUMOS');
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

  // ── [1/2] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[1/2] Truncando det_consumos...');
  await prisma.detConsumo.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [2/2] Importar ────────────────────────────────────────────────────────
  console.log('\n[2/2] Importando det_consumos...');

  let importadas  = 0;
  let omitidas    = 0;
  const sinId:           string[] = [];
  const sinProgramacion: string[] = [];
  const sinRemision:     string[] = [];
  const errores:         string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID_DETALLE')?.trim();
    if (!id) { omitidas++; continue; }

    try {
      const progId    = getCol(row, 'N° PROGRAMACION')?.trim() || getCol(row, 'N° PROGRAMACIÓN')?.trim();
      const remId     = getCol(row, 'N° REMISION')?.trim()     || getCol(row, 'N° REMISIÓN')?.trim();

      if (progId && !await programacionExiste(progId)) sinProgramacion.push(`${id} → "${progId}"`);
      if (remId  && !await remisionExiste(remId))      sinRemision.push(`${id} → "${remId}"`);

      await prisma.detConsumo.upsert({
        where:  { id },
        update: {},
        create: {
          id,
          programacionId:  progId && await programacionExiste(progId) ? progId : null,
          remisionId:      remId  && await remisionExiste(remId)      ? remId  : null,
          referencia:      getCol(row, 'REFERENCIA')?.trim()      || null,
          descripcion:     getCol(row, 'DESCRIPCION')?.trim()     || getCol(row, 'DESCRIPCIÓN')?.trim() || null,
          cantidad:        parseDecimal(getCol(row, 'CANTIDAD')),
          valorUnitario:   parseDecimal(getCol(row, 'VALOR UNITARIO')),
          cantidadUsada:   parseDecimal(getCol(row, 'CANT. USADA')),
          observaciones:   getCol(row, 'OBSERVACIONES')?.trim()   || null,
          eliminar:        parseBool(getCol(row, 'ELIMINAR')),
          folioValidacion: getCol(row, 'FOLIO VALIDACION')?.trim() || getCol(row, 'FOLIO VALIDACIÓN')?.trim() || null,
          switch:          parseBoolNullable(getCol(row, 'SWITCH')),
        },
      });

      importadas++;
      if (importadas % 500 === 0) console.log(`  → ${importadas} importadas...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importadas                 : ${importadas}`);
  console.log(`  ✗ Omitidas (sin ID_DETALLE)  : ${omitidas}`);
  console.log(`  ⚠ Sin programación en DB     : ${sinProgramacion.length}`);
  console.log(`  ⚠ Sin remisión en DB         : ${sinRemision.length}`);
  console.log(`  ❌ Errores                   : ${errores.length}`);

  if (sinProgramacion.length > 0) {
    console.log('\n  N° PROGRAMACIÓN no encontrado en DB:');
    sinProgramacion.forEach(m => console.log(`    - ${m}`));
  }

  if (sinRemision.length > 0) {
    console.log('\n  N° REMISIÓN no encontrado en DB:');
    sinRemision.forEach(m => console.log(`    - ${m}`));
  }

  if (errores.length > 0) {
    console.log('\n  Errores de inserción:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
