/**
 * import-remisiones.ts
 * Puebla: remisiones
 * Requiere: programaciones + terceros ya importados
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const CSV_PATH = path.join('C:\\Users\\ASUS\\Desktop\\tspine-csv', 'SistemaTspine - Remision - Remision.csv');

// ── Índice de columnas ────────────────────────────────────────────────────────

let _colIndex: Map<string, number> = new Map();

function buildColIndex(header: Record<string, string>) {
  _colIndex = new Map();
  Object.keys(header).forEach((key, idx) => {
    const n = key.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!_colIndex.has(n)) _colIndex.set(n, idx);
  });
}

function getCol(row: Record<string, string>, name: string): string | undefined {
  const norm = name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const idx  = _colIndex.get(norm);
  if (idx === undefined) return undefined;
  return Object.values(row)[idx];
}

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseBool(val: string | undefined): boolean {
  if (!val) return false;
  const v = val.trim().toUpperCase();
  return v === 'TRUE' || v === '1';
}

function parseBoolNullable(val: string | undefined): boolean | null {
  if (!val || val.trim() === '') return null;
  const v = val.trim().toUpperCase();
  if (v === 'TRUE'  || v === '1') return true;
  if (v === 'FALSE' || v === '0') return false;
  return null;
}

function parseDecimal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val.trim().replace(',', '.'));
  return isNaN(n) ? null : n;
}

function parseIntVal(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseInt(val.trim(), 10);
  return isNaN(n) ? null : n;
}

// DD/MM/YYYY → Date (tratado como UTC para evitar desplazamiento de zona horaria)
function parseDate(val: string | undefined): Date | null {
  if (!val || !val.trim()) return null;
  const parts = val.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const dt = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00Z`);
  return isNaN(dt.getTime()) ? null : dt;
}

// "D/M/YYYY HH:MM:SS" → Date (tratado como UTC para evitar desplazamiento de zona horaria)
function parseDateTime(val: string | undefined): Date | null {
  if (!val || !val.trim()) return null;
  const raw = val.trim();

  // Intenta formato D/M/YYYY HH:MM:SS o D/M/YYYY
  const [datePart, timePart] = raw.split(' ');
  if (datePart) {
    const parts = datePart.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      const [h, min, sec] = (timePart ?? '0:0:0').split(':');
      const timeStr = `${h.padStart(2, '0')}:${(min ?? '00').padStart(2, '0')}:${(sec ?? '00').padStart(2, '0')}`;
      const dt = new Date(`${dateStr}T${timeStr}Z`);
      if (!isNaN(dt.getTime())) return dt;
    }
  }

  // Fallback: intenta parsear directamente (por si el formato ya es ISO o similar)
  const fallback = new Date(raw);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function parseTarifaCod(val: string | undefined): string | null {
  if (!val || !val.trim() || val.trim().toUpperCase() === 'FALSE') return null;
  return val.trim();
}

// ── Caches y resolvers ────────────────────────────────────────────────────────

const terceroCache      = new Map<string, string | null>(); // nombre → id | null
const programacionCache = new Map<string, string | null>(); // idLegacy → id | null
const tarifaCache       = new Map<string, boolean>();        // código → existe en DB

async function resolveTercero(nombre: string | undefined): Promise<string | null> {
  if (!nombre?.trim()) return null;
  const n = nombre.trim();
  if (terceroCache.has(n)) return terceroCache.get(n)!;
  let t = await prisma.tercero.findFirst({
    where:  { nombreCompleto: n },
    select: { id: true },
  });
  if (!t) {
    t = await prisma.tercero.findFirst({
      where:  { nombreCompleto: { equals: n, mode: 'insensitive' } },
      select: { id: true },
    });
  }
  const id = t?.id ?? null;
  terceroCache.set(n, id);
  return id;
}

async function resolveProgramacion(idLegacy: string | undefined): Promise<string | null> {
  if (!idLegacy?.trim()) return null;
  const key = idLegacy.trim();
  if (programacionCache.has(key)) return programacionCache.get(key)!;
  const p = await prisma.programacion.findUnique({
    where:  { id: key },
    select: { id: true },
  });
  const id = p?.id ?? null;
  programacionCache.set(key, id);
  return id;
}

async function tarifaExiste(cod: string | null): Promise<boolean> {
  if (!cod) return true; // null es válido (campo opcional)
  if (tarifaCache.has(cod)) return tarifaCache.get(cod)!;
  const t = await prisma.tarifa.findUnique({ where: { id: cod }, select: { id: true } });
  const existe = t !== null;
  tarifaCache.set(cod, existe);
  return existe;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT REMISIONES');
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

  // ── [1/2] Truncar ─────────────────────────────────────────────────────────
  console.log('\n[1/2] Truncando remisiones...');
  await prisma.remision.deleteMany();
  console.log('  ✓ Tabla limpia');

  // ── Detectar duplicados en CSV ────────────────────────────────────────────
  const idCount = new Map<string, number>();
  for (const row of rows) {
    const id = getCol(row, 'IDREMISION')?.trim();
    if (id) idCount.set(id, (idCount.get(id) ?? 0) + 1);
  }
  const duplicados = [...idCount.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => `${id} (${count}x)`);

  // ── [2/2] Importar ────────────────────────────────────────────────────────
  console.log('\n[2/2] Importando remisiones...');

  let importadas = 0;
  let omitidas   = 0;
  const sinProgram:       string[] = []; // tenía N° PROGRAM pero no se encontró en DB
  const sinProgramVacio:  string[] = []; // campo N° PROGRAM vacío en CSV
  const sinTercero:       string[] = [];
  const tarifaInvalida:   string[] = []; // código TARIFA no existe en tarifas
  const cubrimientoInvalido: string[] = []; // código CUBRIMIENTO no existe en tarifas
  const sinPaciente:      string[] = [];
  const sinCubrimiento:   string[] = []; // campo CUBRIMIENTO vacío en CSV
  const errores:          string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'IDREMISION')?.trim();
    if (!id) { omitidas++; continue; }

    try {
      const progLegacy     = getCol(row, 'N° PROGRAM')?.trim();
      const programacionId = await resolveProgramacion(progLegacy);
      if (!progLegacy)                        sinProgramVacio.push(id);
      else if (!programacionId)               sinProgram.push(`${id} → "${progLegacy}"`);

      const usuarioNombre   = getCol(row, 'USUARIO')?.trim();
      const empresaNombre   = getCol(row, 'EMPRESA')?.trim();
      const responsableNombre = getCol(row, 'RESPONSABLE ECONOMICO')?.trim()
                             ?? getCol(row, 'RESPONSABLE ECONÓMICO')?.trim();
      const clienteNombre   = getCol(row, 'CLIENTE')?.trim();

      const usuarioId              = await resolveTercero(usuarioNombre);
      const empresaId              = await resolveTercero(empresaNombre);
      const responsableEconomicoId = await resolveTercero(responsableNombre);
      const clienteId              = await resolveTercero(clienteNombre);

      if (usuarioNombre     && !usuarioId)              sinTercero.push(`${id} USUARIO: "${usuarioNombre}"`);
      if (empresaNombre     && !empresaId)              sinTercero.push(`${id} EMPRESA: "${empresaNombre}"`);
      if (responsableNombre && !responsableEconomicoId) sinTercero.push(`${id} RESPONSABLE: "${responsableNombre}"`);
      if (clienteNombre     && !clienteId)              sinTercero.push(`${id} CLIENTE: "${clienteNombre}"`);

      const tarifaCod     = parseTarifaCod(getCol(row, 'TARIFA'));
      const cubrimientoCod = parseTarifaCod(getCol(row, 'CUBRIMIENTO'));

      if (tarifaCod && !await tarifaExiste(tarifaCod))
        tarifaInvalida.push(`${id} → "${tarifaCod}"`);
      if (!cubrimientoCod)
        sinCubrimiento.push(id);
      else if (!await tarifaExiste(cubrimientoCod))
        cubrimientoInvalido.push(`${id} → "${cubrimientoCod}"`);

      const paciente = getCol(row, 'PACIENTE')?.trim() || null;
      if (!paciente) sinPaciente.push(id);

      await prisma.remision.upsert({
        where:  { id },
        update: {},
        create: {
          id,
          usuarioId,
          creadoEn:              parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          programacionId,
          tarifaId:              tarifaCod,
          numRemision:           getCol(row, 'N° REMISION')?.trim()          || getCol(row, 'N° REMISIÓN')?.trim() || null,
          empresaId,
          paciente,
          cirugiaRealizada:      getCol(row, 'CIRUGIA REALIZADA')?.trim()    || getCol(row, 'CIRUGÍA REALIZADA')?.trim() || null,
          impuestos:             getCol(row, 'IMPUESTOS')?.trim()             || null,
          cubrimientoId:         cubrimientoCod,
          responsableEconomicoId,
          anestesiologo:         getCol(row, 'ANESTESIOLOGO')?.trim()        || getCol(row, 'ANESTESIÓLOGO')?.trim() || null,
          tieneDcto:             parseBool(getCol(row, 'TIENE DCTO?')),
          porcentajeDcto:        parseDecimal(getCol(row, '% DTO')),
          vrDctoPesos:           parseDecimal(getCol(row, 'V/R DCTO $')),
          estado:                getCol(row, 'ESTADO')?.trim()                || null,
          firma:                 getCol(row, 'FIRMA')?.trim()                 || null,
          imagen:                getCol(row, 'IMAGEN')?.trim()                || null,
          status:                parseBool(getCol(row, 'STATUS')),
          vrFactura:             parseDecimal(getCol(row, 'V/R FACTURA')),
          diferencia:            parseDecimal(getCol(row, 'DIF')),
          tieneCotizacion:       parseBool(getCol(row, 'COTIZACION?')),
          cotizacion:            getCol(row, 'COTIZACION')?.trim()            || null,
          actualizarFolio:       parseBoolNullable(getCol(row, 'ACTUALIZARFOLIO')),
          tieneFactura:          parseBool(getCol(row, 'FACTURA?')),
          estadoFactura:         getCol(row, 'ESTADO FACTURA')?.trim()        || null,
          noFactura:             getCol(row, 'NO DE FACTURA')?.trim()         || null,
          fechaFacturacion:      parseDate(getCol(row, 'FECHA DE FACTURACION')),
          facturadoPor:          getCol(row, 'FACTURADO POR')?.trim()         || null,
          clienteId,
          switch:                parseBoolNullable(getCol(row, 'SWITCH')),
          contador:              parseIntVal(getCol(row, 'CONTADOR')),
          numFactura:            getCol(row, 'N° DE LA FACTURA')?.trim()      || null,
          cxc:                   parseBoolNullable(getCol(row, 'CXC?')),
          aseguradoraCountry:    getCol(row, 'ASEGURADORA COUNTRY')?.trim()  || null,
        },
      });

      importadas++;
      if (importadas % 200 === 0) console.log(`  → ${importadas} importadas...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importadas             : ${importadas}`);
  console.log(`  ✗ Omitidas (sin ID)      : ${omitidas}`);
  console.log(`  ⚠ Duplicados en CSV      : ${duplicados.length}`);
  console.log(`  ⚠ Sin programación (vacío): ${sinProgramVacio.length}`);
  console.log(`  ⚠ Sin programación en DB : ${sinProgram.length}`);
  console.log(`  ⚠ Sin tercero resuelto   : ${sinTercero.length}`);
  console.log(`  ⚠ Tarifa inválida        : ${tarifaInvalida.length}`);
  console.log(`  ⚠ Cubrimiento vacío      : ${sinCubrimiento.length}`);
  console.log(`  ⚠ Cubrimiento inválido   : ${cubrimientoInvalido.length}`);
  console.log(`  ⚠ Sin paciente           : ${sinPaciente.length}`);
  console.log(`  ❌ Errores               : ${errores.length}`);

  if (duplicados.length > 0) {
    console.log('\n  IDs duplicados en CSV (el último gana por upsert):');
    duplicados.forEach(m => console.log(`    - ${m}`));
  }

  if (sinProgramVacio.length > 0) {
    console.log('\n  N° PROGRAM vacío en CSV (sin referencia a programación):');
    sinProgramVacio.forEach(m => console.log(`    - ${m}`));
  }

  if (sinProgram.length > 0) {
    console.log('\n  N° PROGRAM no encontrado en DB (remisionId → valor):');
    sinProgram.forEach(m => console.log(`    - ${m}`));
  }

  if (sinTercero.length > 0) {
    console.log('\n  Terceros no resueltos (remisionId campo: "nombre"):');
    sinTercero.forEach(m => console.log(`    - ${m}`));
  }

  if (tarifaInvalida.length > 0) {
    console.log('\n  TARIFA con código inválido (no existe en tarifas):');
    tarifaInvalida.forEach(m => console.log(`    - ${m}`));
  }

  if (sinCubrimiento.length > 0) {
    console.log('\n  CUBRIMIENTO vacío en CSV:');
    sinCubrimiento.forEach(m => console.log(`    - ${m}`));
  }

  if (cubrimientoInvalido.length > 0) {
    console.log('\n  CUBRIMIENTO con código inválido (no existe en tarifas):');
    cubrimientoInvalido.forEach(m => console.log(`    - ${m}`));
  }

  if (sinPaciente.length > 0) {
    console.log('\n  Sin paciente:');
    sinPaciente.forEach(m => console.log(`    - ${m}`));
  }

  if (errores.length > 0) {
    console.log('\n  Errores de inserción:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
