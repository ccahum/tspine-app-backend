/**
 * import-listas-precio.ts
 * Puebla: listas_precio
 * Dependencias: Tarifa (subtarifa), Producto
 *
 * Notas de mapeo:
 * - SUBTARIFA viene como el id de la subtarifa (ej. "GNP", "Inbursa") → match directo contra Tarifa.id.
 * - PRODUCTO viene como el mismo valor que REFERENCIA (Producto.id === Producto.referencia
 *   en los productos verificados), así que se resuelve por match directo contra Producto.id.
 * - % GANANCIA viene mezclado como "0" o "0.00%" → se limpia el símbolo % antes de parsear.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - ListasPrecio.csv');

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

/** "0.00%" → 0 ; "0" → 0 */
function parsePercent(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/%/g, '').replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT LISTAS DE PRECIO');
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

  const tarifasSet = new Set(
    (await prisma.tarifa.findMany({ select: { id: true } })).map(t => t.id)
  );
  console.log(`  ✓ ${tarifasSet.size} subtarifas`);

  const productosSet = new Set(
    (await prisma.producto.findMany({ select: { id: true } })).map(p => p.id)
  );
  console.log(`  ✓ ${productosSet.size} productos`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const subtarifasNR: UnresolvedMap = new Map();
  const productosNR:  UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  for (const row of rows) {
    const id = getCol(row, 'IDLISTAPRECIO')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const subtarifa = getCol(row, 'SUBTARIFA')?.trim();
    if (subtarifa && !tarifasSet.has(subtarifa)) incMap(subtarifasNR, subtarifa, id);

    const producto = getCol(row, 'PRODUCTO')?.trim();
    if (producto && !productosSet.has(producto)) incMap(productosNR, producto, id);
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

  printAnalysis('Subtarifa', subtarifasNR);
  printAnalysis('Producto',  productosNR);

  // ── [3/3] Truncar + Importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando listas_precio...');
  await prisma.listaPrecio.deleteMany();
  console.log('  ✓ Tabla limpia');

  console.log('\nImportando listas de precio...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'IDLISTAPRECIO')?.trim();
    if (!id) { omitidos++; continue; }

    const subtarifaRaw = getCol(row, 'SUBTARIFA')?.trim();
    const subtarifaId  = subtarifaRaw && tarifasSet.has(subtarifaRaw) ? subtarifaRaw : null;

    const productoRaw = getCol(row, 'PRODUCTO')?.trim();
    const productoId  = productoRaw && productosSet.has(productoRaw) ? productoRaw : null;

    try {
      await prisma.listaPrecio.create({
        data: {
          id,
          subtarifaId,
          productoId,
          costoUtilidad:      parseDecimal(getCol(row, 'COSTO UTILIDAD')),
          porcentajeGanancia: parsePercent(getCol(row, '% GANANCIA')),
          precio:             parseDecimal(getCol(row, 'PRECIO')),
          formaActualizacion: getCol(row, 'FORMA DE ACTUALIZACION')?.trim() || null,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} listas de precio creadas`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados            : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)     : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV : ${dupIds.length}`);
  console.log(`  ⚠ Subtarifa s/resolver  : ${subtarifasNR.size}`);
  console.log(`  ⚠ Producto s/resolver   : ${productosNR.size}`);
  console.log(`  ❌ Errores               : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.slice(0, 20).forEach(e => console.log(`    - ${e}`));
    if (errores.length > 20) console.log(`    ... y ${errores.length - 20} más`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
