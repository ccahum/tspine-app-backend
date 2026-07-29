/**
 * import-valconsumolotes.ts
 * Puebla: val_consumo_lotes
 * Dependencias: ValConsumo, Lote (por nombre), Sede (por nombre), Almacen (por ID), Tercero (por nombreCompleto)
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'node:fs';
import * as path from 'node:path';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(String.raw`C:\Users\ASUS\Desktop\tspine-csv`, 'SistemaTspine1.0 - ValConsumoLotes.csv');

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

// ── Parsers ───────────────────────────────────────────────────────────────────

/** D/M/YYYY H:MM:SS → Date (UTC) */
function parseDateTime(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  const [datePart, timePart] = val.trim().split(' ');
  if (!datePart) return null;
  const [d, m, y] = datePart.split('/');
  if (!d || !m || !y) return null;
  const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${timePart ?? '00:00:00'}Z`;
  const dt  = new Date(iso);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function parseInt_(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = Number.parseInt(val.trim().replaceAll(',', ''), 10);
  return Number.isNaN(n) ? null : n;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT VAL_CONSUMO_LOTES');
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

  // ── [1/4] Precargar catálogos ─────────────────────────────────────────────
  console.log('\n[1/4] Precargando catálogos...');

  const valConsumoSet = new Set(
    (await prisma.valConsumo.findMany({ select: { id: true } })).map(v => v.id),
  );
  console.log(`  ✓ ${valConsumoSet.size} val_consumos`);

  const lotesByNombre = new Map<string, string>();
  const allLotes = await prisma.lote.findMany({ select: { id: true, lote: true } });
  for (const l of allLotes) {
    if (l.lote) lotesByNombre.set(norm(l.lote.trim()), l.id);
  }
  console.log(`  ✓ ${allLotes.length} lotes`);

  const sedesByNombre = new Map<string, string>();
  const allSedes = await prisma.sede.findMany({ select: { id: true, nombre: true } });
  for (const s of allSedes) {
    sedesByNombre.set(norm(s.nombre.trim()), s.id);
  }
  console.log(`  ✓ ${allSedes.length} sedes`);

  const almacenesById = new Set(
    (await prisma.almacen.findMany({ select: { id: true } })).map(a => a.id),
  );
  console.log(`  ✓ ${almacenesById.size} almacenes`);

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const k = norm(t.nombreCompleto.trim());
    if (!tercerosByNombre.has(k)) tercerosByNombre.set(k, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  // ── [2/4] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/4] Analizando CSV...');

  const idCount        = new Map<string, number>();
  const valConsumoNR   = new Map<string, string[]>();
  const lotesNR        = new Map<string, string[]>();
  const sedesNR        = new Map<string, string[]>();
  const almacenesNR    = new Map<string, string[]>();
  const tercerosNR     = new Map<string, string[]>();

  function incMap(m: Map<string, string[]>, key: string, id: string) {
    const arr = m.get(key) ?? [];
    arr.push(id);
    m.set(key, arr);
  }

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const vc = getCol(row, 'VALCONSUMO')?.trim();
    if (vc && !valConsumoSet.has(vc)) incMap(valConsumoNR, vc, id);

    const lote = getCol(row, 'LOTE')?.trim();
    if (lote && !lotesByNombre.has(norm(lote))) incMap(lotesNR, lote, id);

    const sede = getCol(row, 'SEDE')?.trim();
    if (sede && !sedesByNombre.has(norm(sede))) incMap(sedesNR, sede, id);

    const ubic = getCol(row, 'UBICACION')?.trim();
    if (ubic && !almacenesById.has(ubic)) incMap(almacenesNR, ubic, id);

    const reg = getCol(row, 'REGISTRADO POR')?.trim();
    if (reg && !tercerosByNombre.has(norm(reg))) incMap(tercerosNR, reg, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: Map<string, string[]>) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver (primeros 5):`);
    [...m.entries()].slice(0, 5).forEach(([k, ids]) =>
      console.log(`    - "${k}" (${ids.length} reg.)`));
    if (m.size > 5) console.log(`    ... y ${m.size - 5} más`);
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else dupIds.forEach(([id, c]) => console.log(`  ⚠ Duplicado: ${id} (${c}x)`));

  printAnalysis('ValConsumo',   valConsumoNR);
  printAnalysis('Lote',         lotesNR);
  printAnalysis('Sede',         sedesNR);
  printAnalysis('Almacen',      almacenesNR);
  printAnalysis('RegistradoPor', tercerosNR);

  // ── [3/4] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[3/4] Truncando val_consumo_lotes...');
  await prisma.valConsumoLote.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [4/4] Importar ────────────────────────────────────────────────────────
  console.log('\n[4/4] Importando val_consumo_lotes...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidos++; continue; }

    const vcRaw      = getCol(row, 'VALCONSUMO')?.trim();
    const valConsumoId = vcRaw && valConsumoSet.has(vcRaw) ? vcRaw : null;

    const loteRaw = getCol(row, 'LOTE')?.trim();
    const loteId  = loteRaw ? (lotesByNombre.get(norm(loteRaw)) ?? null) : null;

    const cantidad = parseInt_(getCol(row, 'CANTIDAD'));

    const sedeRaw = getCol(row, 'SEDE')?.trim();
    const sedeId  = sedeRaw ? (sedesByNombre.get(norm(sedeRaw)) ?? null) : null;

    const ubicRaw = getCol(row, 'UBICACION')?.trim();
    const almacenId = ubicRaw && almacenesById.has(ubicRaw) ? ubicRaw : null;

    const regRaw        = getCol(row, 'REGISTRADO POR')?.trim();
    const registradoPorId = regRaw ? (tercerosByNombre.get(norm(regRaw)) ?? null) : null;

    const marcaTiempo = parseDateTime(getCol(row, 'MARCADETIEMPO'));

    try {
      await prisma.valConsumoLote.create({
        data: {
          id,
          valConsumoId,
          loteId,
          cantidad,
          sedeId,
          almacenId,
          registradoPorId,
          marcaTiempo,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} registros creados`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados               : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)        : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV    : ${dupIds.length}`);
  console.log(`  ⚠ ValConsumo s/resolver    : ${valConsumoNR.size}`);
  console.log(`  ⚠ Lote s/resolver          : ${lotesNR.size}`);
  console.log(`  ⚠ Sede s/resolver          : ${sedesNR.size}`);
  console.log(`  ⚠ Almacen s/resolver       : ${almacenesNR.size}`);
  console.log(`  ⚠ RegistradoPor s/resolver : ${tercerosNR.size}`);
  console.log(`  ❌ Errores                 : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
