/**
 * import-stockporlotes.ts
 * Puebla: stock_por_lotes
 * Dependencias: Lote, Producto, Sede (ALMACEN), Almacen (UBICACIÓN), Tercero (USUARIO REGISTRADOR)
 * Nota: cada fila de esta hoja es una existencia (unidad de stock) actualmente disponible para
 * un Lote+Producto+Sede+Ubicación — es una tabla física de AppSheet, no una vista calculada.
 * VALIDACIONESID es solo la concatenación de Lote+Producto+Almacen+Ubicación (un valor derivado
 * de AppSheet); se conserva tal cual por fidelidad con el origen pero no se usa para resolver
 * ninguna relación.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - StockPorLotes.csv');

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

/** D/M/YY H:MM (ej. 02/03/25 19:20) — tratado como UTC para evitar desfase de zona */
function parseDateTime(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  const [datePart, timePart] = val.trim().split(' ');
  if (!datePart) return null;
  const [d, m, yRaw] = datePart.split('/');
  if (!d || !m || !yRaw) return null;
  const y = yRaw.length === 2 ? `20${yRaw}` : yRaw.padStart(4, '0');
  const timeNormalized = (timePart ?? '00:00').split(':').map(p => p.padStart(2, '0')).join(':');
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${timeNormalized}:00Z`;
  const dt  = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

// ── Resolución de referencias por ID o por nombre ─────────────────────────────

function resolveByIdOrName(raw: string | undefined, byId: Set<string>, byNombre: Map<string, string>): string | null {
  if (!raw) return null;
  if (byId.has(raw)) return raw;
  return byNombre.get(norm(raw)) ?? null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT STOCK POR LOTES');
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

  const lotesSet = new Set((await prisma.lote.findMany({ select: { id: true } })).map(l => l.id));
  console.log(`  ✓ ${lotesSet.size} lotes`);

  const productosSet = new Set((await prisma.producto.findMany({ select: { id: true } })).map(p => p.id));
  console.log(`  ✓ ${productosSet.size} productos`);

  const sedesById     = new Set<string>();
  const sedesByNombre = new Map<string, string>();
  for (const s of await prisma.sede.findMany({ select: { id: true, nombre: true } })) {
    sedesById.add(s.id);
    sedesByNombre.set(norm(s.nombre), s.id);
  }
  console.log(`  ✓ ${sedesById.size} sedes`);

  const almacenesById     = new Set<string>();
  const almacenesByNombre = new Map<string, string>();
  for (const a of await prisma.almacen.findMany({ select: { id: true, nombre: true } })) {
    almacenesById.add(a.id);
    if (a.nombre) almacenesByNombre.set(norm(a.nombre), a.id);
  }
  console.log(`  ✓ ${almacenesById.size} almacenes`);

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto.trim());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, number>;
  const lotesNR      : UnresolvedMap = new Map();
  const productosNR  : UnresolvedMap = new Map();
  const sedesNR      : UnresolvedMap = new Map();
  const almacenesNR  : UnresolvedMap = new Map();
  const registradorNR: UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string) {
    m.set(key, (m.get(key) ?? 0) + 1);
  }

  for (const row of rows) {
    const id = getCol(row, 'IDEXISTENCIA')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const lote = getCol(row, 'LOTE')?.trim();
    if (lote && !lotesSet.has(lote)) incMap(lotesNR, lote);

    const producto = getCol(row, 'PRODUCTO')?.trim();
    if (producto && !productosSet.has(producto)) incMap(productosNR, producto);

    const sede = getCol(row, 'ALMACEN')?.trim();
    if (sede && !sedesById.has(sede) && !sedesByNombre.has(norm(sede))) incMap(sedesNR, sede);

    const ubicacion = getCol(row, 'UBICACIÓN')?.trim() || getCol(row, 'UBICACION')?.trim();
    if (ubicacion && !almacenesById.has(ubicacion) && !almacenesByNombre.has(norm(ubicacion))) incMap(almacenesNR, ubicacion);

    const registrador = getCol(row, 'USUARIO REGISTRADOR')?.trim();
    if (registrador && !tercerosByNombre.has(norm(registrador))) incMap(registradorNR, registrador);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].slice(0, 20).forEach(([k, c]) => console.log(`    - "${k}" (${c}x)`));
    if (m.size > 20) console.log(`    ... y ${m.size - 20} más`);
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Lotes',               lotesNR);
  printAnalysis('Productos',           productosNR);
  printAnalysis('Sedes (ALMACEN)',     sedesNR);
  printAnalysis('Ubicaciones',         almacenesNR);
  printAnalysis('Usuarios Registrador', registradorNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando stock_por_lotes...');
  await prisma.stockPorLote.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'IDEXISTENCIA')?.trim();
    if (!id) { omitidos++; continue; }

    const loteRaw = getCol(row, 'LOTE')?.trim();
    const loteId  = loteRaw && lotesSet.has(loteRaw) ? loteRaw : null;

    const productoRaw = getCol(row, 'PRODUCTO')?.trim();
    const productoId  = productoRaw && productosSet.has(productoRaw) ? productoRaw : null;

    const sedeId    = resolveByIdOrName(getCol(row, 'ALMACEN')?.trim(), sedesById, sedesByNombre);
    const ubicacionRaw = getCol(row, 'UBICACIÓN')?.trim() || getCol(row, 'UBICACION')?.trim();
    const almacenId = resolveByIdOrName(ubicacionRaw, almacenesById, almacenesByNombre);

    const registradorRaw = getCol(row, 'USUARIO REGISTRADOR')?.trim();
    const registradoPorId = registradorRaw ? (tercerosByNombre.get(norm(registradorRaw)) ?? null) : null;

    try {
      await prisma.stockPorLote.create({
        data: {
          id,
          loteId,
          productoId,
          sedeId,
          almacenId,
          origen:         getCol(row, 'ORIGEN')?.trim() || null,
          registradoPorId,
          marcaTiempo:    parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          validacionesId: getCol(row, 'VALIDACIONESID')?.trim() || null,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados            : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)     : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV : ${dupIds.length}`);
  console.log(`  ❌ Errores              : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.slice(0, 20).forEach(e => console.log(`    - ${e}`));
    if (errores.length > 20) console.log(`    ... y ${errores.length - 20} más`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
