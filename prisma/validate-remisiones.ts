import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parse } from 'csv-parse/sync';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine - Remision - Remision.csv');

// ─── Column resolver ──────────────────────────────────────────────────────────
let _colIndex: Map<string, string> | null = null;

function buildColIndex(row: Record<string, string>) {
  _colIndex = new Map();
  for (const key of Object.keys(row)) {
    const n = key.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    _colIndex.set(n, key);
  }
}

function getCol(row: Record<string, string>, name: string): string {
  if (!_colIndex) buildColIndex(row);
  const n = name.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const actual = _colIndex!.get(n);
  return actual ? (row[actual] ?? '') : (row[name] ?? '');
}

function parseBool(raw: string): boolean {
  const v = raw?.trim().toUpperCase();
  return v === 'TRUE' || v === '1';
}

function parseTarifaCod(val: string): string | null {
  const t = val?.trim();
  if (!t || t.toUpperCase() === 'FALSE') return null;
  return t;
}

// ─── Output helpers ───────────────────────────────────────────────────────────
const sep  = () => console.log('═'.repeat(70));
const sec  = (t: string) => { sep(); console.log(`  ${t}`); sep(); };
const ok   = (m: string) => console.log(`  ✅ ${m}`);
const warn = (m: string) => console.log(`  ⚠️  ${m}`);
const fail = (m: string) => console.log(`  ❌ ${m}`);

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ No se encontró: ${CSV_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows: Record<string, string>[] = parse(content, {
    columns: true, skip_empty_lines: true,
    relax_quotes: true, relax_column_count: true, bom: true,
  });

  if (rows.length > 0) buildColIndex(rows[0]);

  // Filtrar filas con ID válido (igual que el import)
  const rowsConId = rows.filter(r => getCol(r, 'IDREMISION')?.trim());

  sec('VALIDATE REMISIONES');

  // ── [1] Conteo general ────────────────────────────────────────────────────
  console.log('\n[1/6] Conteo general');
  const csvTotal = rowsConId.length;
  const dbTotal  = await prisma.remision.count();
  const diff     = dbTotal - csvTotal;
  const diffStr  = diff === 0 ? '0' : (diff > 0 ? `+${diff}` : `${diff}`);

  if (diff === 0) ok(`Remisiones: CSV ${csvTotal} = DB ${dbTotal}`);
  else            warn(`Remisiones: CSV ${csvTotal}  DB ${dbTotal}  ← DIFERENCIA ${diffStr}`);

  // ── [2] Duplicados en CSV ─────────────────────────────────────────────────
  console.log('\n[2/6] Duplicados en CSV');
  const idCount = new Map<string, number>();
  for (const row of rowsConId) {
    const id = getCol(row, 'IDREMISION').trim();
    idCount.set(id, (idCount.get(id) ?? 0) + 1);
  }
  const duplicados = [...idCount.entries()].filter(([, c]) => c > 1);
  if (duplicados.length === 0) ok('Sin duplicados');
  else {
    warn(`${duplicados.length} IDs duplicados en CSV:`);
    for (const [id, c] of duplicados) console.log(`    - ${id} (${c}x)`);
  }

  // ── [3] Remisiones sin programación ──────────────────────────────────────
  console.log('\n[3/6] Remisiones sin programación');
  const sinProgramVacio = rowsConId.filter(r => !getCol(r, 'N° PROGRAM').trim());
  const sinProgramDb: string[] = [];

  for (const row of rowsConId) {
    const prog = getCol(row, 'N° PROGRAM').trim();
    if (!prog) continue;
    const existe = await prisma.programacion.findUnique({ where: { id: prog }, select: { id: true } });
    if (!existe) sinProgramDb.push(`${getCol(row, 'IDREMISION').trim()} → "${prog}"`);
  }

  if (sinProgramVacio.length === 0) ok('Sin remisiones con N° PROGRAM vacío');
  else warn(`${sinProgramVacio.length} remisiones sin N° PROGRAM en CSV`);

  if (sinProgramDb.length === 0) ok('Todos los N° PROGRAM resueltos en DB');
  else {
    warn(`${sinProgramDb.length} N° PROGRAM no encontrados en DB:`);
    for (const m of sinProgramDb) console.log(`    - ${m}`);
  }

  // DB: remisiones sin programacionId
  const dbSinProg = await prisma.remision.count({ where: { programacionId: null } });
  if (dbSinProg === 0) ok('Sin remisiones en DB con programacionId null');
  else warn(`${dbSinProg} remisiones en DB con programacionId null`);

  // ── [4] Terceros no resueltos ─────────────────────────────────────────────
  console.log('\n[4/6] Terceros no resueltos');

  const campos: { col: string; label: string }[] = [
    { col: 'USUARIO',                label: 'USUARIO' },
    { col: 'EMPRESA',                label: 'EMPRESA' },
    { col: 'RESPONSABLE ECONOMICO',  label: 'RESPONSABLE' },
    { col: 'CLIENTE',                label: 'CLIENTE' },
  ];

  let totalSinTercero = 0;
  for (const { col, label } of campos) {
    const sinResolver: string[] = [];
    for (const row of rowsConId) {
      const nombre = getCol(row, col).trim();
      if (!nombre) continue;
      const t = await prisma.tercero.findFirst({
        where: { OR: [{ nombreCompleto: nombre }, { nombreCompleto: { equals: nombre, mode: 'insensitive' } }] },
        select: { id: true },
      });
      if (!t) sinResolver.push(`${getCol(row, 'IDREMISION').trim()}: "${nombre}"`);
    }
    if (sinResolver.length === 0) ok(`${label}: todos resueltos`);
    else {
      warn(`${label}: ${sinResolver.length} no resueltos`);
      for (const m of sinResolver) console.log(`    - ${m}`);
    }
    totalSinTercero += sinResolver.length;
  }
  if (totalSinTercero === 0) ok('Sin terceros pendientes de resolver');

  // ── [5] Tarifas y cubrimiento ─────────────────────────────────────────────
  console.log('\n[5/6] Tarifas y cubrimiento');

  const tarifaCache = new Map<string, boolean>();
  async function tarifaExiste(cod: string): Promise<boolean> {
    if (tarifaCache.has(cod)) return tarifaCache.get(cod)!;
    const t = await prisma.tarifa.findUnique({ where: { id: cod }, select: { id: true } });
    tarifaCache.set(cod, t !== null);
    return t !== null;
  }

  const tarifaInvalida:      string[] = [];
  const cubrimientoInvalido: string[] = [];
  const sinCubrimiento:      string[] = [];

  for (const row of rowsConId) {
    const id            = getCol(row, 'IDREMISION').trim();
    const tarifaCod     = parseTarifaCod(getCol(row, 'TARIFA'));
    const cubrimientoCod = parseTarifaCod(getCol(row, 'CUBRIMIENTO'));

    if (tarifaCod && !await tarifaExiste(tarifaCod))     tarifaInvalida.push(`${id} → "${tarifaCod}"`);
    if (!cubrimientoCod)                                  sinCubrimiento.push(id);
    else if (!await tarifaExiste(cubrimientoCod))         cubrimientoInvalido.push(`${id} → "${cubrimientoCod}"`);
  }

  if (tarifaInvalida.length === 0)      ok('Tarifas: todas válidas');
  else {
    warn(`${tarifaInvalida.length} tarifas inválidas:`);
    for (const m of tarifaInvalida) console.log(`    - ${m}`);
  }
  if (sinCubrimiento.length === 0)      ok('Cubrimiento: ninguno vacío');
  else                                  warn(`${sinCubrimiento.length} remisiones sin cubrimiento`);
  if (cubrimientoInvalido.length === 0) ok('Cubrimiento: todos válidos');
  else {
    warn(`${cubrimientoInvalido.length} cubrimimientos inválidos:`);
    for (const m of cubrimientoInvalido) console.log(`    - ${m}`);
  }

  // ── [6] Distribución de campos ────────────────────────────────────────────
  console.log('\n[6/6] Distribución de campos clave');

  // Booleanos CSV vs DB
  const bools: { col: string; label: string; dbField: string }[] = [
    { col: 'STATUS',      label: 'status',          dbField: 'status' },
    { col: 'TIENE DCTO?', label: 'tieneDcto',       dbField: 'tieneDcto' },
    { col: 'COTIZACION?', label: 'tieneCotizacion', dbField: 'tieneCotizacion' },
    { col: 'FACTURA?',    label: 'tieneFactura',    dbField: 'tieneFactura' },
  ];

  for (const { col, label, dbField } of bools) {
    const csvTrue = rowsConId.filter(r => parseBool(getCol(r, col))).length;
    const dbTrue  = await prisma.remision.count({ where: { [dbField]: true } });
    if (csvTrue === dbTrue) ok(`${label}: CSV ${csvTrue} = DB ${dbTrue}`);
    else                    warn(`${label}: CSV ${csvTrue}  DB ${dbTrue}  ← DIFERENCIA`);
  }

  // Distribución de estados en DB
  const estados = await prisma.remision.groupBy({ by: ['estado'], _count: { _all: true } });
  estados.sort((a, b) => (b._count?._all ?? 0) - (a._count?._all ?? 0));
  console.log('\n  Estados en DB:');
  for (const e of estados) {
    const label = e.estado ?? '(null)';
    console.log(`    ${label.padEnd(30)} ${e._count?._all ?? 0}`);
  }

  // Sin paciente
  const sinPaciente = await prisma.remision.count({ where: { paciente: null } });
  if (sinPaciente === 0) ok('Sin remisiones sin paciente');
  else warn(`${sinPaciente} remisiones sin paciente en DB`);

  sep();
  console.log('  ✅ Validación completa');
  sep();

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
