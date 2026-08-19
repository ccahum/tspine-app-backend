/**
 * import-mir.ts
 * Puebla: mir
 * Dependencias: TipoPago, Tercero (usuario, origen, destino), Cuenta (cuentaOrigen, cuentaDestino),
 *               FormaPago (formaMovimiento), Proyecto
 * Nota: CONCEPTO MOVIMIENTO no es relación (no coincide con el catálogo ConceptosMovimientos), es texto libre.
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - MIR.csv');

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

/** Número con comas de miles: "406,354.26" → 406354.26 */
function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

/** Porcentaje: "8.00%" → 8.00  |  "" → null */
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
  console.log('  IMPORT MIR');
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

  const tiposPagoSet = new Set((await prisma.tipoPago.findMany({ select: { id: true } })).map(t => t.id));
  console.log(`  ✓ ${tiposPagoSet.size} tipos de pago`);

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto.trim().toLowerCase());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  const cuentasSet = new Set((await prisma.cuenta.findMany({ select: { id: true } })).map(c => c.id));
  console.log(`  ✓ ${cuentasSet.size} cuentas`);

  const formasPagoSet = new Set((await prisma.formaPago.findMany({ select: { id: true } })).map(f => f.id));
  console.log(`  ✓ ${formasPagoSet.size} formas de pago`);

  const proyectosSet = new Set((await prisma.proyecto.findMany({ select: { id: true } })).map(p => p.id));
  console.log(`  ✓ ${proyectosSet.size} proyectos`);

  // ── [2/3] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/3] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedMap = Map<string, string[]>;
  const tiposPagoNR:     UnresolvedMap = new Map();
  const usuariosNR:      UnresolvedMap = new Map();
  const origenesNR:      UnresolvedMap = new Map();
  const cuentasOrigenNR: UnresolvedMap = new Map();
  const formasMovNR:     UnresolvedMap = new Map();
  const destinosNR:      UnresolvedMap = new Map();
  const cuentasDestNR:   UnresolvedMap = new Map();
  const proyectosNR:     UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(id);
  }

  const tercero = (val?: string) => (val ? tercerosByNombre.has(norm(val.toLowerCase())) : true);

  for (const row of rows) {
    const id = getCol(row, 'ID MOVIMIENTO')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const tipoPago = getCol(row, 'TIPO DE PAGO')?.trim();
    if (tipoPago && !tiposPagoSet.has(tipoPago)) incMap(tiposPagoNR, tipoPago, id);

    const usuario = getCol(row, 'USUARIO')?.trim();
    if (usuario && !tercero(usuario)) incMap(usuariosNR, usuario, id);

    const origen = getCol(row, 'ORIGEN')?.trim();
    if (origen && !tercero(origen)) incMap(origenesNR, origen, id);

    const cuentaOrigen = getCol(row, 'CUENTA ORIGEN')?.trim();
    if (cuentaOrigen && !cuentasSet.has(cuentaOrigen)) incMap(cuentasOrigenNR, cuentaOrigen, id);

    const formaMov = getCol(row, 'FORMA DE MOVIMIENTO')?.trim();
    if (formaMov && !formasPagoSet.has(formaMov)) incMap(formasMovNR, formaMov, id);

    const destino = getCol(row, 'DESTINO')?.trim();
    if (destino && !tercero(destino)) incMap(destinosNR, destino, id);

    const cuentaDestino = getCol(row, 'CUENTA DESTINO')?.trim();
    if (cuentaDestino && !cuentasSet.has(cuentaDestino)) incMap(cuentasDestNR, cuentaDestino, id);

    const proyecto = getCol(row, 'PROYECTO')?.trim();
    if (proyecto && !proyectosSet.has(proyecto)) incMap(proyectosNR, proyecto, id);
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

  printAnalysis('Tipo de Pago',           tiposPagoNR);
  printAnalysis('Usuario',                usuariosNR);
  printAnalysis('Origen',                 origenesNR);
  printAnalysis('Cuenta Origen',          cuentasOrigenNR);
  printAnalysis('Forma de Movimiento',    formasMovNR);
  printAnalysis('Destino',                destinosNR);
  printAnalysis('Cuenta Destino',         cuentasDestNR);
  printAnalysis('Proyecto',               proyectosNR);

  // ── [3/3] Truncar e importar ───────────────────────────────────────────────
  console.log('\n[3/3] Truncando e importando MIR...');
  await prisma.mir.deleteMany();

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  const resolveTercero = (val?: string) => val ? (tercerosByNombre.get(norm(val.toLowerCase())) ?? null) : null;

  for (const row of rows) {
    const id = getCol(row, 'ID MOVIMIENTO')?.trim();
    if (!id) { omitidos++; continue; }

    const tipoPagoRaw = getCol(row, 'TIPO DE PAGO')?.trim();
    const tipoPagoId  = tipoPagoRaw && tiposPagoSet.has(tipoPagoRaw) ? tipoPagoRaw : null;

    const cuentaOrigenRaw = getCol(row, 'CUENTA ORIGEN')?.trim();
    const cuentaOrigenId  = cuentaOrigenRaw && cuentasSet.has(cuentaOrigenRaw) ? cuentaOrigenRaw : null;

    const formaMovRaw = getCol(row, 'FORMA DE MOVIMIENTO')?.trim();
    const formaMovimientoId = formaMovRaw && formasPagoSet.has(formaMovRaw) ? formaMovRaw : null;

    const cuentaDestinoRaw = getCol(row, 'CUENTA DESTINO')?.trim();
    const cuentaDestinoId  = cuentaDestinoRaw && cuentasSet.has(cuentaDestinoRaw) ? cuentaDestinoRaw : null;

    const proyectoRaw = getCol(row, 'PROYECTO')?.trim();
    const proyectoId  = proyectoRaw && proyectosSet.has(proyectoRaw) ? proyectoRaw : null;

    try {
      await prisma.mir.create({
        data: {
          id,
          marcaTiempo:        parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          tipoMovimiento:     getCol(row, 'TIPO DE MOVIMIENTO')?.trim()     || null,
          conceptoMovimiento: getCol(row, 'CONCEPTO MOVIMIENTO')?.trim()    || null,
          generaComision:     parseBool(getCol(row, 'GENERA COMISION?')),
          tipoPagoId,
          comision:           parsePorcentaje(getCol(row, 'COMISION')),
          usuarioId:          resolveTercero(getCol(row, 'USUARIO')),
          numRegistro:        getCol(row, 'N° REGISTRO')?.trim()           || null,
          fecha:              parseDate(getCol(row, 'FECHA')),
          origenId:           resolveTercero(getCol(row, 'ORIGEN')),
          cuentaOrigenId,
          formaMovimientoId,
          destinoId:          resolveTercero(getCol(row, 'DESTINO')),
          cuentaDestinoId,
          valor:              parseDecimal(getCol(row, 'VALOR')),
          descripcion:        getCol(row, 'DESCRIPCIÓN')?.trim()           || null,
          imagenSoporte:      getCol(row, 'IMAGEN SOPORTE')?.trim()        || null,
          archivoPdf:         getCol(row, 'ARCHIVO_PDF')?.trim()           || null,
          proyectoId,
          perteneceAProyecto: parseBool(getCol(row, 'PERTENECE A UN PROYECTO?')),
        },
      });
      importados++;
      if (importados % 500 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} movimientos MIR creados`);

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
