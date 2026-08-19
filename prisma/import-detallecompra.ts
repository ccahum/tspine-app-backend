/**
 * import-detallecompra.ts
 * Puebla: detalle_compras
 * Dependencias: Compra, Producto (descripcion), Tercero (enviadorPor),
 *               CatIva, CatIvaRet, CatIsrRet
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - DetalleCompra.csv');

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

/** D/M/YYYY H:MM:SS — tratado como UTC para evitar desfase de zona */
function parseDateTime(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  const [datePart, timePart] = val.trim().split(' ');
  if (!datePart) return null;
  const [d, m, y] = datePart.split('/');
  if (!d || !m || !y) return null;
  const timeNormalized = (timePart ?? '00:00:00').split(':').map(p => p.padStart(2, '0')).join(':');
  const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${timeNormalized}Z`;
  const dt  = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

/** Número con comas de miles y/o signo de $: " $ 1,666.75 " → 1666.75 */
function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/\$/g, '').replace(/,/g, '').trim());
  return isNaN(num) ? null : num;
}

function parseBool(val: string | undefined): boolean | null {
  const v = val?.trim()?.toUpperCase();
  if (v === 'TRUE'  || v === '1') return true;
  if (v === 'FALSE' || v === '0') return false;
  return null;
}

function buildNumericMap(ids: string[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const id of ids) {
    const n = parseFloat(id);
    if (!isNaN(n) && !map.has(n)) map.set(n, id);
  }
  return map;
}

function resolveNumeric(val: string | undefined, map: Map<number, string>): string | null {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val.trim());
  if (isNaN(n)) return null;
  return map.get(n) ?? null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT DETALLE COMPRA');
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

  const comprasSet = new Set((await prisma.compra.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${comprasSet.size} compras`);

  const productosSet = new Set((await prisma.producto.findMany({ select: { id: true } })).map(p => p.id));
  console.log(`  ✓ ${productosSet.size} productos`);

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto.trim().toLowerCase());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  const ivaMap    = buildNumericMap((await prisma.catIva.findMany({ select: { id: true } })).map(c => c.id));
  const ivaRetMap = buildNumericMap((await prisma.catIvaRet.findMany({ select: { id: true } })).map(c => c.id));
  const isrRetMap = buildNumericMap((await prisma.catIsrRet.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${ivaMap.size} tasas IVA, ${ivaRetMap.size} tasas IVA Ret, ${isrRetMap.size} tasas ISR Ret`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const comprasNR:   UnresolvedMap = new Map();
  const productosNR: UnresolvedMap = new Map();
  const enviadorNR:  UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  const tercero = (val?: string) => (val ? tercerosByNombre.has(norm(val.toLowerCase())) : true);

  for (const row of rows) {
    const id = getCol(row, 'IDDETALLECOMPRA')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const compra = getCol(row, 'COMPRAS')?.trim();
    if (compra && !comprasSet.has(compra)) incMap(comprasNR, compra, id);

    const producto = getCol(row, 'DESCRIPCION')?.trim();
    if (producto && !productosSet.has(producto)) incMap(productosNR, producto, id);

    const enviador = getCol(row, 'ENVIADOR POR')?.trim();
    if (enviador && !tercero(enviador)) incMap(enviadorNR, enviador, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Compra',        comprasNR);
  printAnalysis('Producto',      productosNR);
  printAnalysis('Enviador Por',  enviadorNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando detalle_compras...');
  await prisma.detalleCompra.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  const resolveTercero = (val?: string) => val ? (tercerosByNombre.get(norm(val.toLowerCase())) ?? null) : null;

  for (const row of rows) {
    const id = getCol(row, 'IDDETALLECOMPRA')?.trim();
    if (!id) { omitidos++; continue; }

    const compraRaw = getCol(row, 'COMPRAS')?.trim();
    const compraId  = compraRaw && comprasSet.has(compraRaw) ? compraRaw : null;

    const productoRaw = getCol(row, 'DESCRIPCION')?.trim();
    const productoId  = productoRaw && productosSet.has(productoRaw) ? productoRaw : null;

    try {
      await prisma.detalleCompra.create({
        data: {
          id,
          compraId,
          productoId,
          costo:               parseDecimal(getCol(row, 'COSTO')),
          cantidad:            parseDecimal(getCol(row, 'CANTIDAD')),
          costoActual:         parseDecimal(getCol(row, 'COSTO ACTUAL')),
          actualizarCosto:     getCol(row, 'ACTUALIZAR COSTO')?.trim() || null,
          enviadoEl:           parseDateTime(getCol(row, 'ENVIADO EL')),
          enviadorPorId:       resolveTercero(getCol(row, 'ENVIADOR POR')),
          actualizarSoloCosto: parseBool(getCol(row, 'ACTUALIZAR SOLO COSTO')),
          notas:               getCol(row, 'NOTAS')?.trim() || null,
          ivaId:               resolveNumeric(getCol(row, 'IVA'), ivaMap),
          ivaRetId:            resolveNumeric(getCol(row, 'IVA RET'), ivaRetMap),
          isrRetId:            resolveNumeric(getCol(row, 'ISR RET'), isrRetMap),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} detalle_compras creados`);

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
