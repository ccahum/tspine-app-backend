/**
 * import-programacionpagos.ts
 * Puebla: programacion_pagos
 * Dependencias: Tercero (programadoPor, beneficiarioGasto, beneficiarioPago),
 *               Gasto (folioGasto), Compra (folioCompra), DetTecnico (folioComisiones),
 *               Mir (folioMir), MovimientoCaja (folioCaja)
 * Nota: TIPO DE PAGO y SEDE no son relaciones (no se declararon como tal), quedan como texto libre.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - ProgramacionPagos.csv');

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

/** D/M/YYYY */
function parseDate(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  const parts = val.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const dt  = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

/** Número con comas de miles: "5594.1" / "233,067.20" → decimal */
function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT PROGRAMACION PAGOS');
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

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto.trim().toLowerCase());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  const gastosSet = new Set((await prisma.gasto.findMany({ select: { id: true } })).map(g => g.id));
  console.log(`  ✓ ${gastosSet.size} gastos`);

  const comprasSet = new Set((await prisma.compra.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${comprasSet.size} compras`);

  const detTecnicosSet = new Set((await prisma.detTecnico.findMany({ select: { id: true } })).map(d => d.id));
  console.log(`  ✓ ${detTecnicosSet.size} det_tecnicos`);

  const mirsSet = new Set((await prisma.mir.findMany({ select: { id: true } })).map(m => m.id));
  console.log(`  ✓ ${mirsSet.size} mir`);

  const movimientosCajaSet = new Set((await prisma.movimientoCaja.findMany({ select: { id: true } })).map(m => m.id));
  console.log(`  ✓ ${movimientosCajaSet.size} movimientos de caja`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const programadoPorNR:     UnresolvedMap = new Map();
  const beneficiarioGastoNR: UnresolvedMap = new Map();
  const beneficiarioPagoNR:  UnresolvedMap = new Map();
  const gastosNR:            UnresolvedMap = new Map();
  const comprasNR:           UnresolvedMap = new Map();
  const detTecnicosNR:       UnresolvedMap = new Map();
  const mirsNR:              UnresolvedMap = new Map();
  const movimientosCajaNR:   UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  const tercero = (val?: string) => (val ? tercerosByNombre.has(norm(val.toLowerCase())) : true);

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const programadoPor = getCol(row, 'PROGRAMADO POR')?.trim();
    if (programadoPor && !tercero(programadoPor)) incMap(programadoPorNR, programadoPor, id);

    const beneficiarioGasto = getCol(row, 'BENEFICIAR DE GASTO')?.trim();
    if (beneficiarioGasto && !tercero(beneficiarioGasto)) incMap(beneficiarioGastoNR, beneficiarioGasto, id);

    const beneficiarioPago = getCol(row, 'BENEFICIAR DE PAGO')?.trim();
    if (beneficiarioPago && !tercero(beneficiarioPago)) incMap(beneficiarioPagoNR, beneficiarioPago, id);

    const folioGasto = getCol(row, 'FOLIO GASTO')?.trim();
    if (folioGasto && !gastosSet.has(folioGasto)) incMap(gastosNR, folioGasto, id);

    const folioCompra = getCol(row, 'FOLIO COMPRA')?.trim();
    if (folioCompra && !comprasSet.has(folioCompra)) incMap(comprasNR, folioCompra, id);

    const folioComisiones = getCol(row, 'FOLIO COMISIONES')?.trim();
    if (folioComisiones && !detTecnicosSet.has(folioComisiones)) incMap(detTecnicosNR, folioComisiones, id);

    const folioMir = getCol(row, 'FOLIO MIR')?.trim();
    if (folioMir && !mirsSet.has(folioMir)) incMap(mirsNR, folioMir, id);

    const folioCaja = getCol(row, 'FOLIO CAJA')?.trim();
    if (folioCaja && !movimientosCajaSet.has(folioCaja)) incMap(movimientosCajaNR, folioCaja, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Programado Por',         programadoPorNR);
  printAnalysis('Beneficiario de Gasto',  beneficiarioGastoNR);
  printAnalysis('Beneficiario de Pago',   beneficiarioPagoNR);
  printAnalysis('Folio Gasto',            gastosNR);
  printAnalysis('Folio Compra',           comprasNR);
  printAnalysis('Folio Comisiones (Det_Tecnicos)', detTecnicosNR);
  printAnalysis('Folio MIR',              mirsNR);
  printAnalysis('Folio Caja (Movimientos de Caja)', movimientosCajaNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando programacion_pagos...');
  await prisma.programacionPago.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  const resolveTercero = (val?: string) => val ? (tercerosByNombre.get(norm(val.toLowerCase())) ?? null) : null;

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidos++; continue; }

    const folioGastoRaw = getCol(row, 'FOLIO GASTO')?.trim();
    const folioGastoId  = folioGastoRaw && gastosSet.has(folioGastoRaw) ? folioGastoRaw : null;

    const folioCompraRaw = getCol(row, 'FOLIO COMPRA')?.trim();
    const folioCompraId  = folioCompraRaw && comprasSet.has(folioCompraRaw) ? folioCompraRaw : null;

    const folioComisionesRaw = getCol(row, 'FOLIO COMISIONES')?.trim();
    const folioComisionesId  = folioComisionesRaw && detTecnicosSet.has(folioComisionesRaw) ? folioComisionesRaw : null;

    const folioMirRaw = getCol(row, 'FOLIO MIR')?.trim();
    const folioMirId  = folioMirRaw && mirsSet.has(folioMirRaw) ? folioMirRaw : null;

    const folioCajaRaw = getCol(row, 'FOLIO CAJA')?.trim();
    const folioCajaId  = folioCajaRaw && movimientosCajaSet.has(folioCajaRaw) ? folioCajaRaw : null;

    try {
      await prisma.programacionPago.create({
        data: {
          id,
          marcaTiempo:           parseDateTime(getCol(row, 'MARCATIEMPO')),
          fechaOrigenMovimiento: parseDate(getCol(row, 'FECHA ORIGEN MOVIMIENTO')),
          fechaPago:             parseDate(getCol(row, 'FECHA PAGO')),
          programadoPorId:       resolveTercero(getCol(row, 'PROGRAMADO POR')),
          beneficiarioGastoId:   resolveTercero(getCol(row, 'BENEFICIAR DE GASTO')),
          beneficiarioPagoId:    resolveTercero(getCol(row, 'BENEFICIAR DE PAGO')),
          folioRelacionado:      getCol(row, 'FOLIO RELACIONADO')?.trim() || null,
          tipo:                  getCol(row, 'TIPO')?.trim()              || null,
          provieneDe:            getCol(row, 'PROVIENE DE')?.trim()       || null,
          folioGastoId,
          folioCompraId,
          folioComisionesId,
          folioMirId,
          segmentador:           getCol(row, 'SEGMENTADOR')?.trim()       || null,
          tipoDePago:            getCol(row, 'TIPO DE PAGO')?.trim()      || null,
          cuentaContable:        getCol(row, 'CUENTA CONTABLE')?.trim()   || null,
          folioCajaId,
          comision:              parseDecimal(getCol(row, 'COMISION')),
          sede:                  getCol(row, 'SEDE')?.trim()              || null,
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} programacion_pagos creados`);

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
