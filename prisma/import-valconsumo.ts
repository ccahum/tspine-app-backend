/**
 * import-valconsumo.ts
 * Puebla: val_consumo
 * Dependencias: Tercero (usuario, usuarioAutorizador), Programacion, Remision,
 *               DetConsumo, Sede (sedeConsumo, sedeUsuario), Producto, Sistema, FormaPago
 * Omitidos (denormalizados): FECHA QX, DOCTOR, HOSPITAL, REFERENCIA, CANTIDAD,
 *   VALOR UNITARIO, VALOR, CANT. USADA, OBSERVACIONES, VAL CANT. USADA,
 *   PROVEEDOR_PRINICPAL, H0, H1
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - ValConsumo.csv');

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

function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const num = parseFloat(val.trim().replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

function parseInt_(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseInt(val.trim().replace(/,/g, ''), 10);
  return isNaN(n) ? null : n;
}

function parseBool(val: string | undefined): boolean | null {
  if (!val || val.trim() === '') return null;
  const v = val.trim().toUpperCase();
  if (v === 'TRUE' || v === 'SI' || v === 'YES' || v === '1') return true;
  if (v === 'FALSE' || v === 'NO' || v === '0') return false;
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT VAL_CONSUMO');
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

  const tercerosByNombre = new Map<string, string>();
  const allTerceros = await prisma.tercero.findMany({ select: { id: true, nombreCompleto: true } });
  for (const t of allTerceros) {
    const n = norm(t.nombreCompleto.trim().toLowerCase());
    if (!tercerosByNombre.has(n)) tercerosByNombre.set(n, t.id);
  }
  console.log(`  ✓ ${allTerceros.length} terceros`);

  const programacionesSet = new Set(
    (await prisma.programacion.findMany({ select: { id: true } })).map(p => p.id)
  );
  console.log(`  ✓ ${programacionesSet.size} programaciones`);

  const remisionesSet = new Set(
    (await prisma.remision.findMany({ select: { id: true } })).map(r => r.id)
  );
  console.log(`  ✓ ${remisionesSet.size} remisiones`);

  const detConsumosSet = new Set(
    (await prisma.detConsumo.findMany({ select: { id: true } })).map(d => d.id)
  );
  console.log(`  ✓ ${detConsumosSet.size} det_consumos`);

  const sedesByNombre = new Map<string, string>();
  const allSedes = await prisma.sede.findMany({ select: { id: true, nombre: true } });
  for (const s of allSedes) {
    const n = norm(s.nombre.trim().toLowerCase());
    if (!sedesByNombre.has(n)) sedesByNombre.set(n, s.id);
  }
  console.log(`  ✓ ${allSedes.length} sedes`);

  const productosSet = new Set(
    (await prisma.producto.findMany({ select: { id: true } })).map(p => p.id)
  );
  console.log(`  ✓ ${productosSet.size} productos`);

  const sistemasSet = new Set(
    (await prisma.sistema.findMany({ select: { id: true } })).map(s => s.id)
  );
  console.log(`  ✓ ${sistemasSet.size} sistemas`);

  const formasPagoSet = new Set(
    (await prisma.formaPago.findMany({ select: { id: true } })).map(f => f.id)
  );
  console.log(`  ✓ ${formasPagoSet.size} formas de pago`);

  // ── [2/4] Análisis previo ─────────────────────────────────────────────────
  console.log('\n[2/4] Analizando CSV...');

  const idCount = new Map<string, number>();

  type UnresolvedEntry = { id: string; ts: string };
  type UnresolvedMap   = Map<string, UnresolvedEntry[]>;
  const usuariosNR:      UnresolvedMap = new Map();
  const programacionNR:  UnresolvedMap = new Map();
  const remisionNR:      UnresolvedMap = new Map();
  const detConsumoNR:    UnresolvedMap = new Map();
  const sedeConsumoNR:   UnresolvedMap = new Map();
  const productoNR:      UnresolvedMap = new Map();
  const sistemaConsumoNR: UnresolvedMap = new Map();
  const autorizadorNR:   UnresolvedMap = new Map();
  const sedeUsuarioNR:   UnresolvedMap = new Map();
  const metodoPagoNR:    UnresolvedMap = new Map();

  function incMap(m: UnresolvedMap, key: string, id: string, ts: string) {
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push({ id, ts });
  }

  for (const row of rows) {
    const id = getCol(row, 'ID_DETALLE')?.trim();
    if (!id) continue;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);

    const ts = getCol(row, 'MARCA DE TIEMPO')?.trim() ?? '';

    const usuario = getCol(row, 'USUARIO')?.trim();
    if (usuario && !tercerosByNombre.has(norm(usuario.toLowerCase()))) incMap(usuariosNR, usuario, id, ts);

    const prog = getCol(row, 'N° PROGRAMACION')?.trim();
    if (prog && !programacionesSet.has(prog)) incMap(programacionNR, prog, id, ts);

    const remision = getCol(row, 'N° REMISION')?.trim();
    if (remision && !remisionesSet.has(remision)) incMap(remisionNR, remision, id, ts);

    const detConsumo = getCol(row, 'DESCRIPCION')?.trim();
    if (detConsumo && !detConsumosSet.has(detConsumo)) incMap(detConsumoNR, detConsumo, id, ts);

    const sedeConsumo = getCol(row, 'SEDE DE CONSUMO')?.trim();
    if (sedeConsumo && !sedesByNombre.has(norm(sedeConsumo.toLowerCase()))) incMap(sedeConsumoNR, sedeConsumo, id, ts);

    const producto = getCol(row, 'PRODUCTO CONSUMIDO')?.trim();
    if (producto && !productosSet.has(producto)) incMap(productoNR, producto, id, ts);

    const sistema = getCol(row, 'SISTEMA')?.trim();
    if (sistema && !sistemasSet.has(sistema)) incMap(sistemaConsumoNR, sistema, id, ts);

    const autorizador = getCol(row, 'USUARIO AUTORIZADOR')?.trim();
    if (autorizador && !tercerosByNombre.has(norm(autorizador.toLowerCase()))) incMap(autorizadorNR, autorizador, id, ts);

    const sedeUsuario = getCol(row, 'SEDE USUARIO')?.trim();
    if (sedeUsuario && !sedesByNombre.has(norm(sedeUsuario.toLowerCase()))) incMap(sedeUsuarioNR, sedeUsuario, id, ts);

    const metodoPago = getCol(row, 'METODO DE PAGO PREDEFINIDO')?.trim();
    if (metodoPago && !formasPagoSet.has(metodoPago)) incMap(metodoPagoNR, metodoPago, id, ts);
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);

  function printAnalysis(label: string, m: UnresolvedMap) {
    if (m.size === 0) { console.log(`  ✓ Todos los ${label} resueltos`); return; }
    console.log(`  ⚠ ${m.size} ${label} sin resolver:`);
    [...m.entries()].forEach(([k, entries]) => {
      console.log(`    - "${k}" (${entries.length} registro${entries.length > 1 ? 's' : ''})`);
      entries.forEach(({ id, ts }) => console.log(`        · ${id.padEnd(12)}  ${ts}`));
    });
  }

  if (dupIds.length === 0) console.log('  ✓ Sin IDs duplicados');
  else { console.log(`  ⚠ ${dupIds.length} IDs duplicados:`); dupIds.forEach(([id, c]) => console.log(`    - ${id} (${c}x)`)); }

  printAnalysis('Usuario',          usuariosNR);
  printAnalysis('Programacion',     programacionNR);
  printAnalysis('Remision',         remisionNR);
  printAnalysis('DetConsumo',       detConsumoNR);
  printAnalysis('Sede Consumo',     sedeConsumoNR);
  printAnalysis('Producto',         productoNR);
  printAnalysis('Sistema',          sistemaConsumoNR);
  printAnalysis('Autorizador',      autorizadorNR);
  printAnalysis('Sede Usuario',     sedeUsuarioNR);
  printAnalysis('Metodo Pago',      metodoPagoNR);

  // ── [3/4] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[3/4] Truncando val_consumo...');
  await prisma.valConsumo.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── [4/4] Importar ────────────────────────────────────────────────────────
  console.log('\n[4/4] Importando val_consumo...');

  let importados = 0;
  let omitidos   = 0;
  const errores: string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID_DETALLE')?.trim();
    if (!id) { omitidos++; continue; }

    const usuarioRaw = getCol(row, 'USUARIO')?.trim();
    const usuarioId  = usuarioRaw ? (tercerosByNombre.get(norm(usuarioRaw.toLowerCase())) ?? null) : null;

    const progRaw      = getCol(row, 'N° PROGRAMACION')?.trim();
    const programacionId = progRaw && programacionesSet.has(progRaw) ? progRaw : null;

    const remisionRaw = getCol(row, 'N° REMISION')?.trim();
    const remisionId  = remisionRaw && remisionesSet.has(remisionRaw) ? remisionRaw : null;

    const detConsumoRaw = getCol(row, 'DESCRIPCION')?.trim();
    const detConsumoId  = detConsumoRaw && detConsumosSet.has(detConsumoRaw) ? detConsumoRaw : null;

    const sedeConsumoRaw = getCol(row, 'SEDE CONSUMO')?.trim();
    const sedeConsumoId  = sedeConsumoRaw
      ? (sedesByNombre.get(norm(sedeConsumoRaw.toLowerCase())) ?? null)
      : null;

    const productoRaw = getCol(row, 'PRODUCTO CONSUMIDO')?.trim();
    const productoId  = productoRaw && productosSet.has(productoRaw) ? productoRaw : null;

    const sistemaRaw = getCol(row, 'SISTEMA')?.trim();
    const sistemaId  = sistemaRaw && sistemasSet.has(sistemaRaw) ? sistemaRaw : null;

    const autorizadorRaw = getCol(row, 'USUARIO AUTORIZADOR')?.trim();
    const usuarioAutorizadorId = autorizadorRaw
      ? (tercerosByNombre.get(norm(autorizadorRaw.toLowerCase())) ?? null)
      : null;

    const sedeUsuarioRaw = getCol(row, 'SEDE USUARIO')?.trim();
    const sedeUsuarioId  = sedeUsuarioRaw
      ? (sedesByNombre.get(norm(sedeUsuarioRaw.toLowerCase())) ?? null)
      : null;

    const metodoPagoRaw = getCol(row, 'METODO DE PAGO PREDEFINIDO')?.trim();
    const metodoPagoId  = metodoPagoRaw && formasPagoSet.has(metodoPagoRaw) ? metodoPagoRaw : null;

    try {
      await prisma.valConsumo.create({
        data: {
          id,
          usuarioId,
          marcaTiempo:          parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          programacionId,
          remisionId,
          numeroOC:             getCol(row, 'N° O.C.')?.trim()                  || null,
          detConsumoId,
          sedeConsumoId,
          existencia:           parseInt_(getCol(row, 'EXISTENCIA')),
          existenciaAlmacen:    parseInt_(getCol(row, 'EXISTENCIA ALMACEN')),
          existenciaContenedor: parseInt_(getCol(row, 'EXISTENCIA CONTENEDOR')),
          lote:                 getCol(row, 'LOTE')?.trim()                     || null,
          prodRealConsumido:    parseBool(getCol(row, 'PROD. REAL CONSUMIDO?')),
          productoId,
          prodDeTspine:         parseBool(getCol(row, 'PROD_DE TSPINE?')),
          almacenPz:            parseInt_(getCol(row, 'ALMACEN PZ')),
          contenedorPz:         parseInt_(getCol(row, 'CONTENDEDOR PZ')),
          sistemaId,
          observacionesAlm:     getCol(row, 'OBSERVACIONES ALM')?.trim()        || null,
          eliminar:             parseBool(getCol(row, 'ELIMINAR'))              ?? false,
          idoc:                 getCol(row, 'IDOC')?.trim()                     || null,
          costoActual:          parseDecimal(getCol(row, 'COSTO ACTUAL')),
          idDetConsumoValidado: getCol(row, 'IDDETCONSUMOVALIDADO')?.trim()     || null,
          estadoAutorizacion:   getCol(row, 'ESTADO AUTORIZACION')?.trim()      || null,
          motivo:               getCol(row, 'MOTIVO')?.trim()                   || null,
          fechaAutorizacion:    parseDateTime(getCol(row, 'FECHA AUTORIZACION')),
          usuarioAutorizadorId,
          sedeUsuarioId,
          seCompra:             parseBool(getCol(row, 'SE COMPRA')),
          metodoPagoId,
        },
      });
      importados++;
      if (importados % 1000 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log(`  → Total: ${importados} registros creados`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados                : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)         : ${omitidos}`);
  console.log(`  ⚠ IDs duplicados en CSV     : ${dupIds.length}`);
  console.log(`  ⚠ Usuario s/resolver        : ${usuariosNR.size}`);
  console.log(`  ⚠ Programacion s/resolver   : ${programacionNR.size}`);
  console.log(`  ⚠ Remision s/resolver       : ${remisionNR.size}`);
  console.log(`  ⚠ DetConsumo s/resolver     : ${detConsumoNR.size}`);
  console.log(`  ⚠ Sede Consumo s/resolver   : ${sedeConsumoNR.size}`);
  console.log(`  ⚠ Producto s/resolver       : ${productoNR.size}`);
  console.log(`  ⚠ Sistema s/resolver        : ${sistemaConsumoNR.size}`);
  console.log(`  ⚠ Autorizador s/resolver    : ${autorizadorNR.size}`);
  console.log(`  ⚠ Sede Usuario s/resolver   : ${sedeUsuarioNR.size}`);
  console.log(`  ⚠ Metodo Pago s/resolver    : ${metodoPagoNR.size}`);
  console.log(`  ❌ Errores                  : ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n  Errores:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
