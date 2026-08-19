/**
 * import-detallefactura.ts
 * Puebla: detalles_factura
 * Dependencias: Factura (facturacion), Producto (productoId), UnidadMedidaSat,
 *               CatIva, CatIvaRet, CatIsrRet, ObjetoImpuesto
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine - DetalleDeLaFactura.csv');

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

/** Número con comas de miles: "60,102.08" → 60102.08 */
function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT DETALLE DE LA FACTURA');
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

  const facturasSet = new Set((await prisma.factura.findMany({ select: { id: true } })).map(f => f.id));
  console.log(`  ✓ ${facturasSet.size} facturas`);

  const productosSet = new Set((await prisma.producto.findMany({ select: { id: true } })).map(p => p.id));
  console.log(`  ✓ ${productosSet.size} productos`);

  const udemsSet = new Set((await prisma.unidadMedidaSat.findMany({ select: { id: true } })).map(u => u.id));
  console.log(`  ✓ ${udemsSet.size} unidades de medida`);

  const ivaMap    = new Map<number, string>();
  (await prisma.catIva.findMany({ select: { id: true } })).forEach(c => { const n = parseFloat(c.id); if (!isNaN(n)) ivaMap.set(n, c.id); });
  const ivaRetMap = new Map<number, string>();
  (await prisma.catIvaRet.findMany({ select: { id: true } })).forEach(c => { const n = parseFloat(c.id); if (!isNaN(n)) ivaRetMap.set(n, c.id); });
  const isrMap    = new Map<number, string>();
  (await prisma.catIsrRet.findMany({ select: { id: true } })).forEach(c => { const n = parseFloat(c.id); if (!isNaN(n)) isrMap.set(n, c.id); });
  console.log(`  ✓ ${ivaMap.size} tasas IVA, ${ivaRetMap.size} tasas IVA Ret, ${isrMap.size} tasas ISR Ret`);

  const objetosSet = new Set((await prisma.objetoImpuesto.findMany({ select: { id: true } })).map(o => o.id));
  console.log(`  ✓ ${objetosSet.size} objetos de impuesto`);

  function resolveNumeric(val: string | undefined, map: Map<number, string>): string | null {
    if (!val || val.trim() === '') return null;
    const n = parseFloat(val.trim());
    if (isNaN(n)) return null;
    return map.get(n) ?? null;
  }

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();
  const facturasNR  = new Map<string, string[]>();
  const productosNR = new Map<string, string[]>();

  function incMap(m: Map<string, string[]>, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  for (const row of rows) {
    const id = getCol(row, 'IdDetalle')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const facturacion = getCol(row, 'Facturacion')?.trim();
    if (facturacion && !facturasSet.has(facturacion)) incMap(facturasNR, facturacion, id);

    const productoid = getCol(row, 'Productoid')?.trim();
    if (productoid && !productosSet.has(productoid)) incMap(productosNR, productoid, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: Map<string, string[]>) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].slice(0, 10).forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
    if (m.size > 10) console.log(`    ... y ${m.size - 10} más`);
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Facturación (Productoid Facturacion → Factura)', facturasNR);
  printAnalysis('Producto (probablemente "Producto Saldo Inicial")', productosNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando detalles_factura...');
  await prisma.detalleFactura.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'IdDetalle')?.trim();
    if (!id) { omitidos++; continue; }

    const facturacionRaw = getCol(row, 'Facturacion')?.trim();
    const facturacionId  = facturacionRaw && facturasSet.has(facturacionRaw) ? facturacionRaw : null;

    const productoRaw = getCol(row, 'Productoid')?.trim();
    const productoId  = productoRaw && productosSet.has(productoRaw) ? productoRaw : null;

    const udemRaw = getCol(row, 'Unidad De Medida')?.trim();
    const unidadMedidaId = udemRaw && udemsSet.has(udemRaw) ? udemRaw : null;

    const objetoRaw = getCol(row, 'Objeto De Impuesto')?.trim();
    const objetoImpuestoId = objetoRaw && objetosSet.has(objetoRaw) ? objetoRaw : null;

    try {
      await prisma.detalleFactura.create({
        data: {
          id,
          facturacionId,
          productoId,
          descripcion:    getCol(row, 'Descripcion')?.trim() || null,
          cantidad:       parseDecimal(getCol(row, 'Cantidad')),
          precioUnitario: parseDecimal(getCol(row, 'Preciounitario')),
          descuento:      parseDecimal(getCol(row, 'Descuento')),
          codigoSat:      getCol(row, 'Código Sat')?.trim() || null,
          unidadMedidaId,
          ivaId:          resolveNumeric(getCol(row, 'Iva'), ivaMap),
          ivaRetId:       resolveNumeric(getCol(row, 'Iva Ret'), ivaRetMap),
          isrId:          resolveNumeric(getCol(row, 'Isr'), isrMap),
          objetoImpuestoId,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} detalles de factura creados`);

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
