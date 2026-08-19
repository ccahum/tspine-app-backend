/**
 * import-gastos.ts
 * Puebla: gastos
 * Dependencias: Tercero (usuario, beneficiarioGasto, empresa, beneficiarioPago),
 *               Sede, FormaPago, Cuenta (cuentaBancaria, cuentaDestina),
 *               TipoPago, Proyecto, ClasificacionGasto, CatIva, CatIvaRet,
 *               CatIsrRet, Programacion (fuente)
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - Gastos.csv');

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

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
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

/** Número con comas de miles: "60,102.08" → 60102.08 */
function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

/** Porcentaje: "5.00%" → 5.00  |  "" → null */
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

/** Resuelve por valor numérico (tolera distinta precisión: "0.160000" ~ "0.16") */
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
  console.log('  IMPORT GASTOS');
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

  const sedesSet = new Set((await prisma.sede.findMany({ select: { id: true } })).map(s => s.id));
  console.log(`  ✓ ${sedesSet.size} sedes`);

  const formasPagoSet = new Set((await prisma.formaPago.findMany({ select: { id: true } })).map(f => f.id));
  console.log(`  ✓ ${formasPagoSet.size} formas de pago`);

  const cuentasSet = new Set((await prisma.cuenta.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${cuentasSet.size} cuentas`);

  const tiposPagoSet = new Set((await prisma.tipoPago.findMany({ select: { id: true } })).map(t => t.id));
  console.log(`  ✓ ${tiposPagoSet.size} tipos de pago`);

  const proyectosSet = new Set((await prisma.proyecto.findMany({ select: { id: true } })).map(p => p.id));
  console.log(`  ✓ ${proyectosSet.size} proyectos`);

  const clasificacionesSet = new Set((await prisma.clasificacionGasto.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${clasificacionesSet.size} clasificaciones de gasto`);

  const programacionesSet = new Set((await prisma.programacion.findMany({ select: { id: true } })).map(p => p.id));
  console.log(`  ✓ ${programacionesSet.size} programaciones`);

  const ivaMap    = buildNumericMap((await prisma.catIva.findMany({ select: { id: true } })).map(c => c.id));
  const ivaRetMap = buildNumericMap((await prisma.catIvaRet.findMany({ select: { id: true } })).map(c => c.id));
  const isrRetMap = buildNumericMap((await prisma.catIsrRet.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${ivaMap.size} tasas IVA, ${ivaRetMap.size} tasas IVA Ret, ${isrRetMap.size} tasas ISR Ret`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const usuariosNR:          UnresolvedMap = new Map();
  const beneficiariosGastoNR: UnresolvedMap = new Map();
  const empresasNR:          UnresolvedMap = new Map();
  const beneficiariosPagoNR: UnresolvedMap = new Map();
  const sedesNR:             UnresolvedMap = new Map();
  const formasPagoNR:        UnresolvedMap = new Map();
  const cuentasBancariaNR:   UnresolvedMap = new Map();
  const cuentasDestinaNR:    UnresolvedMap = new Map();
  const tiposGastoNR:        UnresolvedMap = new Map();
  const proyectosNR:         UnresolvedMap = new Map();
  const clasificacionesNR:   UnresolvedMap = new Map();
  const programacionesNR:    UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  const tercero = (val?: string) => (val ? tercerosByNombre.has(norm(val.toLowerCase())) : true);

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const usuario = getCol(row, 'USUARIO')?.trim();
    if (usuario && !tercero(usuario)) incMap(usuariosNR, usuario, id);

    const benGasto = getCol(row, 'BENEFICIARIO DEL GASTO')?.trim();
    if (benGasto && !tercero(benGasto)) incMap(beneficiariosGastoNR, benGasto, id);

    const empresa = getCol(row, 'EMPRESA')?.trim();
    if (empresa && !tercero(empresa)) incMap(empresasNR, empresa, id);

    const benPago = getCol(row, 'BENEFICIARIO PAGO')?.trim();
    if (benPago && !tercero(benPago)) incMap(beneficiariosPagoNR, benPago, id);

    const sede = getCol(row, 'SEDE')?.trim();
    if (sede && !sedesSet.has(slugify(sede))) incMap(sedesNR, sede, id);

    const formaPago = getCol(row, 'FORMA DE PAGO')?.trim();
    if (formaPago && !formasPagoSet.has(formaPago)) incMap(formasPagoNR, formaPago, id);

    const cuentaBanc = getCol(row, 'CUENTA BANCARIA')?.trim();
    if (cuentaBanc && !cuentasSet.has(cuentaBanc)) incMap(cuentasBancariaNR, cuentaBanc, id);

    const cuentaDest = getCol(row, 'CUENTA DESTINA')?.trim();
    if (cuentaDest && !cuentasSet.has(cuentaDest)) incMap(cuentasDestinaNR, cuentaDest, id);

    const tipoGasto = getCol(row, 'TIPO GASTO')?.trim();
    if (tipoGasto && !tiposPagoSet.has(tipoGasto)) incMap(tiposGastoNR, tipoGasto, id);

    const proyecto = getCol(row, 'PROYECTO')?.trim();
    if (proyecto && !proyectosSet.has(proyecto)) incMap(proyectosNR, proyecto, id);

    const clasificacion = getCol(row, 'CLASIFICACION')?.trim();
    if (clasificacion && !clasificacionesSet.has(clasificacion)) incMap(clasificacionesNR, clasificacion, id);

    const fuente = getCol(row, 'FUENTE')?.trim();
    if (fuente && !programacionesSet.has(fuente)) incMap(programacionesNR, fuente, id);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].slice(0, 8).forEach(([k, ids]) => console.log(`    - "${k}" (${ids.length}x)`));
    if (m.size > 8) console.log(`    ... y ${m.size - 8} más`);
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Usuario',              usuariosNR);
  printAnalysis('Beneficiario Gasto',   beneficiariosGastoNR);
  printAnalysis('Empresa',              empresasNR);
  printAnalysis('Beneficiario Pago',    beneficiariosPagoNR);
  printAnalysis('Sede',                 sedesNR);
  printAnalysis('Forma de Pago',        formasPagoNR);
  printAnalysis('Cuenta Bancaria',      cuentasBancariaNR);
  printAnalysis('Cuenta Destina',       cuentasDestinaNR);
  printAnalysis('Tipo Gasto',           tiposGastoNR);
  printAnalysis('Proyecto',             proyectosNR);
  printAnalysis('Clasificación',        clasificacionesNR);
  printAnalysis('Fuente (Programación)', programacionesNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando gastos...');
  await prisma.gasto.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  const resolveTercero = (val?: string) => val ? (tercerosByNombre.get(norm(val.toLowerCase())) ?? null) : null;

  for (const row of rows) {
    const id = getCol(row, 'ID')?.trim();
    if (!id) { omitidos++; continue; }

    const sedeRaw   = getCol(row, 'SEDE')?.trim();
    const sedeSlug  = sedeRaw ? slugify(sedeRaw) : null;

    const formaPagoRaw = getCol(row, 'FORMA DE PAGO')?.trim();
    const cuentaBancRaw = getCol(row, 'CUENTA BANCARIA')?.trim();
    const cuentaDestRaw = getCol(row, 'CUENTA DESTINA')?.trim();
    const tipoGastoRaw  = getCol(row, 'TIPO GASTO')?.trim();
    const proyectoRaw   = getCol(row, 'PROYECTO')?.trim();
    const clasifRaw     = getCol(row, 'CLASIFICACION')?.trim();
    const fuenteRaw      = getCol(row, 'FUENTE')?.trim();

    try {
      await prisma.gasto.create({
        data: {
          id,
          usuarioId:           resolveTercero(getCol(row, 'USUARIO')),
          marcaTiempo:         parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          numGasto:            getCol(row, 'N° GASTO')?.trim() || null,
          beneficiarioGastoId: resolveTercero(getCol(row, 'BENEFICIARIO DEL GASTO')),
          empresaId:           resolveTercero(getCol(row, 'EMPRESA')),
          sedeId:              sedeSlug && sedesSet.has(sedeSlug) ? sedeSlug : null,
          fechaGasto:          parseDate(getCol(row, 'FECHA GASTO')),
          formaPagoId:         formaPagoRaw && formasPagoSet.has(formaPagoRaw) ? formaPagoRaw : null,
          cuentaBancariaId:    cuentaBancRaw && cuentasSet.has(cuentaBancRaw) ? cuentaBancRaw : null,
          beneficiarioPagoId:  resolveTercero(getCol(row, 'BENEFICIARIO PAGO')),
          cuentaDestinaId:     cuentaDestRaw && cuentasSet.has(cuentaDestRaw) ? cuentaDestRaw : null,
          tipoGastoId:         tipoGastoRaw && tiposPagoSet.has(tipoGastoRaw) ? tipoGastoRaw : null,
          numDocumento:        getCol(row, 'N° DOCUMENTO')?.trim() || null,
          descripcion:         getCol(row, 'DESCRIPCIÓN')?.trim() || null,
          valor:               parseDecimal(getCol(row, 'VALOR')),
          imagenSoporte:       getCol(row, 'IMAGEN SOPORTE')?.trim() || null,
          archivoSoporte:      getCol(row, 'ARCHIVO SOPORTE')?.trim() || null,
          eliminar:            parseBool(getCol(row, 'ELIMINAR')) ?? false,
          ejecutar:            parseBool(getCol(row, 'EJECUTAR?')),
          proyectoId:          proyectoRaw && proyectosSet.has(proyectoRaw) ? proyectoRaw : null,
          clasificacionId:     clasifRaw && clasificacionesSet.has(clasifRaw) ? clasifRaw : null,
          ivaId:               resolveNumeric(getCol(row, 'IVA'), ivaMap),
          ivaRetId:            resolveNumeric(getCol(row, 'IVA RET'), ivaRetMap),
          isrRetId:            resolveNumeric(getCol(row, 'ISR RET'), isrRetMap),
          tipoPersona:         getCol(row, 'TIPO DE PERSONA')?.trim() || null,
          ivaManual:           parseDecimal(getCol(row, 'IVA MANUAL')),
          fuenteId:            fuenteRaw && programacionesSet.has(fuenteRaw) ? fuenteRaw : null,
          requiereFuente:      parseBool(getCol(row, 'REQUIERE FUENTE?')),
          ish:                 parseBool(getCol(row, 'ISH')),
          porcentaje:          parsePorcentaje(getCol(row, 'PORCENTAJE')),
          isrForma:            getCol(row, 'ISR FORMA')?.trim() || null,
          isrValor:            parseDecimal(getCol(row, 'ISR VALOR')),
          valorSinIva:         parseDecimal(getCol(row, 'VALOR SIN IVA')),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} gastos creados`);

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
