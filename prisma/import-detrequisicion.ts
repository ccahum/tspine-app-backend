/**
 * import-detrequisicion.ts
 * Puebla: det_requisiciones
 * Dependencias: Requisicion (movimiento), Lote, Producto, Tarifa (tarifaAsociada)
 *
 * Notas de mapeo (confirmadas contra AppSheet y la BD real):
 * - MOVIMIENTO viene como "Folio - <id>" → se quita el prefijo antes de resolver.
 * - PRODUCTO viene como el mismo valor que REFERENCIA (Producto.id === Producto.referencia
 *   en los productos verificados), así que se resuelve por match directo contra Producto.id.
 * - SISTEMA, REFERENCIA, DESCRIPCION, CATEGORIA y FECHA NO se importan: son columnas
 *   virtuales de AppSheet (fórmulas sobre Producto/Requisicion), se calculan en vivo
 *   en el backend (ver findDetallesByRequisicion), no se almacenan.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - DetalleRequisicion.csv');

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

function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

/** "Folio - 01c46505" → "01c46505" */
function stripFolioPrefix(val: string | undefined): string | null {
  if (!val || val.trim() === '') return null;
  const trimmed = val.trim();
  const match = trimmed.match(/^Folio\s*-\s*(.+)$/i);
  return (match ? match[1] : trimmed).trim();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT DETALLE REQUISICION');
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

  const requisicionesSet = new Set(
    (await prisma.requisicion.findMany({ select: { id: true } })).map(r => r.id)
  );
  console.log(`  ✓ ${requisicionesSet.size} requisiciones`);

  const lotesByNombre = new Map<string, string>();
  const allLotes = await prisma.lote.findMany({ select: { id: true, lote: true } });
  for (const l of allLotes) {
    if (!l.lote) continue;
    const n = norm(l.lote.trim());
    if (!lotesByNombre.has(n)) lotesByNombre.set(n, l.id);
  }
  console.log(`  ✓ ${allLotes.length} lotes`);

  const productosSet = new Set(
    (await prisma.producto.findMany({ select: { id: true } })).map(p => p.id)
  );
  console.log(`  ✓ ${productosSet.size} productos`);

  const tarifasSet = new Set(
    (await prisma.tarifa.findMany({ select: { id: true } })).map(t => t.id)
  );
  console.log(`  ✓ ${tarifasSet.size} tarifas`);

  // ── [2/4] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/4] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const movimientosNR: UnresolvedMap = new Map();
  const lotesNR:        UnresolvedMap = new Map();
  const productosNR:    UnresolvedMap = new Map();
  const tarifasNR:      UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  for (const row of rows) {
    const id = getCol(row, 'ID DETALLE')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const movimientoRaw = getCol(row, 'MOVIMIENTO')?.trim();
    const movimiento = stripFolioPrefix(movimientoRaw);
    if (movimiento && !requisicionesSet.has(movimiento)) incMap(movimientosNR, movimientoRaw!, id);

    const lote = getCol(row, 'LOTE')?.trim();
    if (lote && !lotesByNombre.has(norm(lote))) incMap(lotesNR, lote, id);

    const producto = getCol(row, 'PRODUCTO')?.trim();
    if (producto && !productosSet.has(producto)) incMap(productosNR, producto, id);

    const tarifa = getCol(row, 'TARIFAASOCIADA')?.trim();
    if (tarifa && !tarifasSet.has(tarifa)) incMap(tarifasNR, tarifa, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, ids]) => {
      console.log(`    - "${k}" (${ids.length}x)`);
    });
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Movimiento (Requisición)', movimientosNR);
  printAnalysis('Lote',                     lotesNR);
  printAnalysis('Producto',                 productosNR);
  printAnalysis('Tarifa Asociada',          tarifasNR);

  // ── [3/4] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[3/4] Truncando det_requisiciones...');
  await prisma.detRequisicion.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [4/4] Importar ────────────────────────────────────────────────────────
  console.log('\n[4/4] Importando detalle de requisiciones...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID DETALLE')?.trim();
    if (!id) { omitidos++; continue; }

    const movimientoRaw = stripFolioPrefix(getCol(row, 'MOVIMIENTO'));
    const requisicionId = movimientoRaw && requisicionesSet.has(movimientoRaw) ? movimientoRaw : null;

    const loteRaw = getCol(row, 'LOTE')?.trim();
    const loteId  = loteRaw ? (lotesByNombre.get(norm(loteRaw)) ?? null) : null;

    const productoRaw = getCol(row, 'PRODUCTO')?.trim();
    const productoId  = productoRaw && productosSet.has(productoRaw) ? productoRaw : null;

    const tarifaRaw = getCol(row, 'TARIFAASOCIADA')?.trim();
    const tarifaAsociadaId = tarifaRaw && tarifasSet.has(tarifaRaw) ? tarifaRaw : null;

    try {
      await prisma.detRequisicion.create({
        data: {
          id,
          requisicionId,
          loteId,
          productoId,
          cantidad: parseDecimal(getCol(row, 'CANTIDAD')),
          precio:   parseDecimal(getCol(row, 'PRECIO')),
          tarifaAsociadaId,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} insumos creados`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados               : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)        : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV    : ${dupIds.length}`);
  console.log(`  ⚠ Movimiento s/resolver    : ${movimientosNR.size}`);
  console.log(`  ⚠ Lote s/resolver          : ${lotesNR.size}`);
  console.log(`  ⚠ Producto s/resolver      : ${productosNR.size}`);
  console.log(`  ⚠ Tarifa Asociada s/resolver: ${tarifasNR.size}`);
  console.log(`  ❌ Errores                  : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.slice(0, 20).forEach(e => console.log(`    - ${e}`));
    if (errores.length > 20) console.log(`    ... y ${errores.length - 20} más`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
