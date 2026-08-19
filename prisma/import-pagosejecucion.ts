/**
 * import-pagosejecucion.ts
 * Puebla: pagos_ejecucion
 * Dependencias: Tercero (registradoPor, beneficiarioGasto, beneficiarioPago), ProgramacionPago,
 *               FormaPago, Cuenta, Banco (origen), MovimientoCaja (conciliarPagos)
 * Nota: El CSV tiene dos columnas que normalizan al mismo nombre "FECHA DE EJECUCION"
 *       (una con acento en fecha, sin hora — columna 8; otra sin acento, con hora — última columna).
 *       Como el resolver de columnas por nombre solo guarda el primer match, la segunda se lee por
 *       posición fija (última columna del CSV).
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - PagosEjecucion.csv');

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

/** Lee una columna por posición fija (0-based) — para la 2ª "FECHA DE EJECUCION" duplicada. */
function getColByIndex(row: Record<string, string>, idx: number): string | undefined {
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

/** Número con comas de miles: "6,000.00" → 6000.00 */
function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

/** Porcentaje: "0%" → 0  |  "" → null */
function parsePorcentaje(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace('%', '').trim());
  return isNaN(num) ? null : num;
}

function parseBool(val: string | undefined): boolean | null {
  const v = val?.trim()?.toUpperCase();
  if (v === 'TRUE')  return true;
  if (v === 'FALSE') return false;
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT PAGOS EJECUCION');
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

  const programacionPagosSet = new Set((await prisma.programacionPago.findMany({ select: { id: true } })).map(p => p.id));
  console.log(`  ✓ ${programacionPagosSet.size} programacion_pagos`);

  const formasPagoSet = new Set((await prisma.formaPago.findMany({ select: { id: true } })).map(f => f.id));
  console.log(`  ✓ ${formasPagoSet.size} formas de pago`);

  const cuentasSet = new Set((await prisma.cuenta.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${cuentasSet.size} cuentas`);

  const bancosSet = new Set((await prisma.banco.findMany({ select: { id: true } })).map(b => b.id));
  console.log(`  ✓ ${bancosSet.size} bancos`);

  const movimientosCajaSet = new Set((await prisma.movimientoCaja.findMany({ select: { id: true } })).map(m => m.id));
  console.log(`  ✓ ${movimientosCajaSet.size} movimientos de caja`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const registradoPorNR:      UnresolvedMap = new Map();
  const programacionPagoNR:   UnresolvedMap = new Map();
  const beneficiarioGastoNR:  UnresolvedMap = new Map();
  const beneficiarioPagoNR:   UnresolvedMap = new Map();
  const formasPagoNR:         UnresolvedMap = new Map();
  const cuentasNR:            UnresolvedMap = new Map();
  const origenesNR:           UnresolvedMap = new Map();
  const conciliarPagosNR:     UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  const tercero = (val?: string) => (val ? tercerosByNombre.has(norm(val.toLowerCase())) : true);

  for (const row of rows) {
    const id = getCol(row, 'ID_PAGO')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const registradoPor = getCol(row, 'REGISTRADO POR')?.trim();
    if (registradoPor && !tercero(registradoPor)) incMap(registradoPorNR, registradoPor, id);

    const programacionPago = getCol(row, 'PROGRAMACIÓN')?.trim();
    if (programacionPago && !programacionPagosSet.has(programacionPago)) incMap(programacionPagoNR, programacionPago, id);

    const beneficiarioGasto = getCol(row, 'BENEFICIAR DE GASTO')?.trim();
    if (beneficiarioGasto && !tercero(beneficiarioGasto)) incMap(beneficiarioGastoNR, beneficiarioGasto, id);

    const beneficiarioPago = getCol(row, 'BENEFICIAR DE PAGO')?.trim();
    if (beneficiarioPago && !tercero(beneficiarioPago)) incMap(beneficiarioPagoNR, beneficiarioPago, id);

    const formaPago = getCol(row, 'FORMA DE PAGO')?.trim();
    if (formaPago && !formasPagoSet.has(formaPago)) incMap(formasPagoNR, formaPago, id);

    const cuenta = getCol(row, 'CUENTA')?.trim();
    if (cuenta && !cuentasSet.has(cuenta)) incMap(cuentasNR, cuenta, id);

    const origen = getCol(row, 'ORIGEN')?.trim();
    if (origen && !bancosSet.has(origen)) incMap(origenesNR, origen, id);

    const conciliarPagos = getCol(row, 'CONCILIAR PAGOS')?.trim();
    if (conciliarPagos && !movimientosCajaSet.has(conciliarPagos)) incMap(conciliarPagosNR, conciliarPagos, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Registrado Por',              registradoPorNR);
  printAnalysis('Programación (ProgramacionPago)', programacionPagoNR);
  printAnalysis('Beneficiario de Gasto',       beneficiarioGastoNR);
  printAnalysis('Beneficiario de Pago',        beneficiarioPagoNR);
  printAnalysis('Forma de Pago',               formasPagoNR);
  printAnalysis('Cuenta',                      cuentasNR);
  printAnalysis('Origen (Banco)',              origenesNR);
  printAnalysis('Conciliar Pagos (Movimiento de Caja)', conciliarPagosNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando pagos_ejecucion...');
  await prisma.pagoEjecucion.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  const resolveTercero = (val?: string) => val ? (tercerosByNombre.get(norm(val.toLowerCase())) ?? null) : null;

  for (const row of rows) {
    const id = getCol(row, 'ID_PAGO')?.trim();
    if (!id) { omitidos++; continue; }

    const programacionPagoRaw = getCol(row, 'PROGRAMACIÓN')?.trim();
    const programacionPagoId  = programacionPagoRaw && programacionPagosSet.has(programacionPagoRaw) ? programacionPagoRaw : null;

    const formaPagoRaw = getCol(row, 'FORMA DE PAGO')?.trim();
    const formaPagoId  = formaPagoRaw && formasPagoSet.has(formaPagoRaw) ? formaPagoRaw : null;

    const cuentaRaw = getCol(row, 'CUENTA')?.trim();
    const cuentaId  = cuentaRaw && cuentasSet.has(cuentaRaw) ? cuentaRaw : null;

    const origenRaw = getCol(row, 'ORIGEN')?.trim();
    const origenId  = origenRaw && bancosSet.has(origenRaw) ? origenRaw : null;

    const conciliarPagosRaw = getCol(row, 'CONCILIAR PAGOS')?.trim();
    const conciliarPagosId  = conciliarPagosRaw && movimientosCajaSet.has(conciliarPagosRaw) ? conciliarPagosRaw : null;

    try {
      await prisma.pagoEjecucion.create({
        data: {
          id,
          registradoPorId:       resolveTercero(getCol(row, 'REGISTRADO POR')),
          marcaTiempo:           parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          programacionPagoId,
          fechaDeRegistro:       parseDate(getCol(row, 'FECHA DE REGISTRO')),
          ejecutado:             parseBool(getCol(row, 'EJECUTADO?')),
          fechaProgramado:       parseDate(getCol(row, 'FECHA PROGRAMADO')),
          fechaDeEjecucionFecha: parseDate(getCol(row, 'FECHA DE EJECUCIÓN')),
          beneficiarioGastoId:   resolveTercero(getCol(row, 'BENEFICIAR DE GASTO')),
          beneficiarioPagoId:    resolveTercero(getCol(row, 'BENEFICIAR DE PAGO')),
          saldoPorConciliar:     parseDecimal(getCol(row, 'SALDO POR CONCILIAR')),
          monto:                 parseDecimal(getCol(row, 'MONTO')),
          formaPagoId,
          cuentaId,
          origenId,
          notas:                 getCol(row, 'NOTAS')?.trim()               || null,
          folioRelacionado:      getCol(row, 'FOLIO RELACIONADO')?.trim()   || null,
          comprobantePago:       getCol(row, 'COMPROBANTE DE PAGO')?.trim() || null,
          conciliarPagosId,
          archivoPago:           getCol(row, 'ARCHIVO DE PAGO')?.trim()     || null,
          saldo:                 parseDecimal(getCol(row, 'SALDO')),
          tipoDeComprobante:     getCol(row, 'TIPO DE COMBROBANTE')?.trim() || null,
          archivoPago2:          getCol(row, 'ARCHIVO DE PAGO 2')?.trim()   || null,
          imagen:                getCol(row, 'IMAGEN')?.trim()             || null,
          fiscal:                parseBool(getCol(row, 'FISCAL?')),
          valorBruto:            parseDecimal(getCol(row, 'VALOR BRUTO')),
          iva:                   parseDecimal(getCol(row, 'IVA')),
          ivaRet:                parseDecimal(getCol(row, 'IVA RET')),
          isrRet:                parseDecimal(getCol(row, 'ISR RET')),
          ivaPorcentaje:         parsePorcentaje(getCol(row, 'IVA %')),
          ivaRetPorcentaje:      parsePorcentaje(getCol(row, 'IVA RET %')),
          isrRetMonto:           parseDecimal(getCol(row, 'ISR RET$')),
          sede:                  getCol(row, 'SEDE')?.trim()               || null,
          ejecutadoPor:          getCol(row, 'EJECUTADO POR')?.trim()      || null,
          fechaDeEjecucion:      parseDateTime(getColByIndex(row, 34)),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} pagos de ejecución creados`);

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
