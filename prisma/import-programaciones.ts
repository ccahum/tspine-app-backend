import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

const CSV_PATH = path.join(
  os.homedir(), 'Desktop', 'tspine-csv',
  'SistemaTspine1.0 - Programacion - Programacion.csv',
);

// ─── Column resolver (tolerante a acentos) ────────────────────────────────────
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

// ─── Parsers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function parseDate(raw: string): Date | null {
  if (!raw?.trim()) return null;
  const parts = raw.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
}

function parseDateTime(raw: string): Date | null {
  if (!raw?.trim()) return null;
  const [datePart, timePart] = raw.trim().split(' ');
  if (!datePart) return null;
  const [d, m, y] = datePart.split('/').map(Number);
  if (!d || !m || !y) return null;
  const [h, min, s] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
  return new Date(Date.UTC(y, m - 1, d, h ?? 0, min ?? 0, s ?? 0));
}

function parseAvance(raw: string): number | null {
  if (!raw?.trim()) return null;
  const num = parseFloat(raw.replace('%', '').trim());
  return isNaN(num) ? null : num;
}

function parsePrice(raw: string): number | null {
  if (!raw?.trim()) return null;
  const num = parseFloat(raw.replace(/[$,\s]/g, ''));
  return isNaN(num) ? null : num;
}

function parseHora(raw: string): string | null {
  if (!raw?.trim()) return null;
  return raw.trim().replace(/:00$/, '');
}

function parseBool(raw: string): boolean | null {
  const v = raw?.trim()?.toUpperCase();
  if (v === 'TRUE')  return true;
  if (v === 'FALSE') return false;
  return null;
}

function parseList(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function cleanNombre(raw: string): string {
  return raw.replace(/\|/g, '').replace(/\s+/g, ' ').trim();
}

/** Misma regla que src/commons/date.utils.ts: hora de México guardada como si fuera UTC. */
function nowMexico(): Date {
  return new Date(Date.now() - 6 * 60 * 60 * 1000);
}

// ─── Normalización de ciudades ────────────────────────────────────────────────

const HOSPITAL_CIUDAD_CORRECCIONES: Record<string, string> = {
  'Innova Morelia': 'Morelia',
};

const CIUDAD_NORM_MAP: Record<string, string | null> = {
  'Null': null, 'sn': null, 'NA': null, 'na': null, 'Global': null,
  'Av Lopez portillo': null, 'Hacienda de solis No2 Bosques de echegaray': null,
  'Trpatitlan': 'Tepatitlán', 'Tepatitlan': 'Tepatitlán',
  'Tulum': 'Tulúm', 'Leon , GTO': 'León',
  'CDMX': 'Ciudad de México', 'CMDX': 'Ciudad de México',
  'CIUDAD DE MEXICO': 'Ciudad de México', 'CD MEXICO': 'Ciudad de México',
  'CD De México': 'Ciudad de México', 'CD México': 'Ciudad de México',
  'Ciudad de Mexico': 'Ciudad de México', 'Ciudad de México': 'Ciudad de México',
  'cdmx': 'Ciudad de México', 'Cdmx': 'Ciudad de México', 'Mexico DF': 'Ciudad de México',
  'Guadalajara, Jalisco': 'Guadalajara', 'GUADALAJARA, JAL': 'Guadalajara',
  'Guadajalajara': 'Guadalajara', 'Gudalajara': 'Guadalajara',
  'ZAPOPAN': 'Zapopan', 'ZAPOPAN, JALISCO': 'Zapopan', 'Zapopan Jalisco': 'Zapopan',
  'León': 'León', 'León Guanajuato': 'León', 'Leon GTO.': 'León',
  'León Gto': 'León', 'Leon gto': 'León', 'León, Guanajuato': 'León',
  'Leon, GTO.': 'León', 'Leon': 'León',
  'NUEVO LAREDO': 'Nuevo Laredo', 'CANCÚN': 'Cancún', 'Cancun': 'Cancún',
  'MONTERREY, NL': 'Monterrey', 'NEW YORK': 'New York', 'NUEVA YORK': 'New York',
  'Saltillo, Coahuila': 'Saltillo', 'Cd. del Carmen': 'Ciudad del Carmen',
  'Cozumet': 'Cozumel', 'Istapalapa': 'Iztapalapa', 'Floria': 'Florida',
  'Mexico': 'México', 'NAYARIT': 'Nayarit', 'apodaca': 'Apodaca',
};

function cleanCiudad(val: string): string | null {
  const v = val?.trim();
  if (!v || v === '--' || v === '-' || v.length === 1) return null;
  if (Object.prototype.hasOwnProperty.call(CIUDAD_NORM_MAP, v)) return CIUDAD_NORM_MAP[v];
  return v;
}

const ciudadCache = new Map<string, string>();

async function getOrCreateCiudad(nombre: string): Promise<string> {
  const norm = Object.prototype.hasOwnProperty.call(CIUDAD_NORM_MAP, nombre)
    ? CIUDAD_NORM_MAP[nombre]
    : nombre;
  if (!norm) return '';
  if (ciudadCache.has(norm)) return ciudadCache.get(norm)!;
  const existing = await prisma.ciudad.findFirst({ where: { nombre: norm } });
  if (existing) { ciudadCache.set(norm, existing.id); return existing.id; }
  const r = await prisma.ciudad.create({ data: { nombre: norm } });
  ciudadCache.set(norm, r.id);
  return r.id;
}

async function getOrCreateTercero(nombre: string, cache: Map<string, string>): Promise<string | null> {
  const clean = cleanNombre(nombre);
  if (!clean) return null;
  if (cache.has(clean)) return cache.get(clean)!;
  const existing = await prisma.tercero.findFirst({ where: { nombreCompleto: clean } });
  if (existing) { cache.set(clean, existing.id); return existing.id; }
  const nuevo = await prisma.tercero.create({ data: { nombreCompleto: clean } });
  cache.set(clean, nuevo.id);
  return nuevo.id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ No se encontró: ${CSV_PATH}`);
    process.exit(1);
  }

  console.log('Leyendo CSV...');
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows: Record<string, string>[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  });

  if (rows.length > 0) buildColIndex(rows[0]);
  console.log(`Total registros en CSV: ${rows.length}`);

  // ── 0. Truncar tablas dependientes y programaciones ──────────────────────
  console.log('\n[0] Truncando tablas dependientes y programaciones...');
  const delRem  = await prisma.remision.deleteMany({});
  console.log(`    ${delRem.count} remisiones eliminadas`);
  const deleted = await prisma.programacion.deleteMany({});
  console.log(`    ${deleted.count} programaciones eliminadas (cascade: medicos y tecnicos)`);

  // ── 1. Sedes ──────────────────────────────────────────────────────────────
  const sedesSet = new Set<string>();
  rows.forEach(r => { if (getCol(r, 'SEDE')?.trim()) sedesSet.add(getCol(r, 'SEDE').trim()); });
  console.log(`\n[1] Creando ${sedesSet.size} sedes...`);
  for (const nombre of sedesSet) {
    await prisma.sede.upsert({
      where:  { id: slugify(nombre) },
      update: { nombre },
      create: { id: slugify(nombre), nombre },
    });
  }

  // ── 2. Hospitales ─────────────────────────────────────────────────────────
  const hospitalesMap = new Map<string, string>(); // nombre → ciudadRaw
  rows.forEach(r => {
    const nombre = cleanNombre(getCol(r, 'HOSPITAL')?.trim() ?? '');
    const ciudad = getCol(r, 'CIUDAD QX')?.trim();
    if (nombre && !hospitalesMap.has(nombre)) hospitalesMap.set(nombre, ciudad ?? '');
  });
  console.log(`\n[2] Creando ${hospitalesMap.size} hospitales...`);
  const hospitalIds = new Map<string, string>();
  for (const [nombre, ciudadRaw] of hospitalesMap.entries()) {
    const id = slugify(nombre).slice(0, 36) || nombre.slice(0, 36);
    const ciudadCorr  = HOSPITAL_CIUDAD_CORRECCIONES[ciudadRaw] ?? ciudadRaw;
    const ciudadFinal = cleanCiudad(ciudadCorr);
    const ciudadId    = ciudadFinal ? (await getOrCreateCiudad(ciudadFinal)) || null : null;
    await prisma.hospital.upsert({
      where:  { id },
      update: { nombre, ciudadId: ciudadId ?? undefined },
      create: { id, nombre, ciudadId },
    });
    hospitalIds.set(nombre, id);
  }

  // ── 3. Importar programaciones ────────────────────────────────────────────
  console.log('\n[3] Importando programaciones...');
  const terceroCache = new Map<string, string>();
  let created = 0;
  let skipped = 0;
  let errors  = 0;
  const omitidas: { fila: number; razon: string; info: string }[] = [];

  const medicoNombresCSV   = new Set<string>();
  const tecnicoNombresCSV  = new Set<string>();
  const medicoNombresLinked  = new Set<string>();
  const tecnicoNombresLinked = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row      = rows[i];
    const filaCsv  = i + 2; // +2 porque fila 1 es encabezado
    const id = getCol(row, 'ID_PROGRAMACION')?.trim();
    if (!id) {
      const hospital = getCol(row, 'HOSPITAL')?.trim() || '(sin hospital)';
      const fecha    = getCol(row, 'FECHA QX')?.trim()  || '(sin fecha)';
      const medico   = getCol(row, 'MÉDICO')?.trim()    || '(sin médico)';
      omitidas.push({ fila: filaCsv, razon: 'Sin ID_PROGRAMACION', info: `Hospital: ${hospital} | Fecha: ${fecha} | Médico: ${medico}` });
      skipped++;
      continue;
    }

    const sedeNombre     = getCol(row, 'SEDE')?.trim();
    const hospitalNombre = cleanNombre(getCol(row, 'HOSPITAL')?.trim() ?? '') || null;
    const medicosNombres  = parseList(getCol(row, 'MÉDICO'));
    const tecnicosNombres = parseList(getCol(row, 'TECNICOS ASIGNADOS'));
    const usuarioNombre  = getCol(row, 'USUARIO')?.trim() || null;
    const creadoPorId    = usuarioNombre ? await getOrCreateTercero(usuarioNombre, terceroCache) : null;

    try {
      const prog = await prisma.programacion.create({
        data: {
          id,
          creadoPor:           creadoPorId,
          createdAt:           parseDateTime(getCol(row, 'MARCA DE TIEMPO')) ?? nowMexico(),
          fechaQx:             parseDate(getCol(row, 'FECHA QX')),
          horaQx:              parseHora(getCol(row, 'HORA QX')),
          sedeId:              sedeNombre     ? slugify(sedeNombre)                      : null,
          hospitalId:          hospitalNombre ? hospitalIds.get(hospitalNombre) ?? null  : null,
          consumo:             getCol(row, 'CONSUMO')             || null,
          observaciones:       getCol(row, 'OBSERVACIONES')       || null,
          numProgram:          getCol(row, 'N° PROGRAM')          || null,
          avance:              parseAvance(getCol(row, 'AVANCE')),
          switch:              parseBool(getCol(row, 'SWITCH')),
          montoTecnicos:       parsePrice(getCol(row, 'TÉCNICOS')),
          montoInversionistas: parsePrice(getCol(row, 'INVERSIONISTAS')),
          montoPlus:           parsePrice(getCol(row, 'PLUS')),
          adjuntarDocumento:   getCol(row, 'ADJUNTAR DOCUMENTO')  || null,
          cotizacionUrl:       getCol(row, 'COTIZACION')          || null,
          enviarProgramacion:  (() => { const v = parseInt(getCol(row, 'ENVIAR PROGRAMACION')?.trim()); return isNaN(v) ? null : v; })(),
          folioRequisicion:    getCol(row, 'FOLIO REQUISICIÓN')   || null,
          cerrada:             false,
          sinRemision:         false,
          consumoNoValidado:   false,
          sinComision:         false,
        },
      });

      // Médicos
      for (const nombre of medicosNombres) {
        medicoNombresCSV.add(nombre);
        const medicoId = await getOrCreateTercero(nombre, terceroCache);
        if (medicoId) {
          await prisma.programacionMedico.upsert({
            where:  { programacionId_medicoId: { programacionId: prog.id, medicoId } },
            update: {},
            create: { programacionId: prog.id, medicoId },
          });
          medicoNombresLinked.add(nombre);
        }
      }

      // Técnicos
      for (const nombre of tecnicosNombres) {
        tecnicoNombresCSV.add(nombre);
        const tecnicoId = await getOrCreateTercero(nombre, terceroCache);
        if (tecnicoId) {
          await prisma.programacionTecnico.upsert({
            where:  { programacionId_tecnicoId: { programacionId: prog.id, tecnicoId } },
            update: {},
            create: { programacionId: prog.id, tecnicoId },
          });
          tecnicoNombresLinked.add(nombre);
        }
      }

      created++;
      if (created % 200 === 0) console.log(`    ${created} programaciones importadas...`);
    } catch (err: any) {
      console.error(`  ✗ Error en ${id}: ${err.message}`);
      errors++;
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  const [totalProg, totalMedicos, totalTecnicos] = await Promise.all([
    prisma.programacion.count(),
    prisma.programacionMedico.count(),
    prisma.programacionTecnico.count(),
  ]);

  console.log('\n─────────────────────────────────────────────');
  console.log(`✅ Importación completa:`);
  console.log(`   Total CSV              : ${rows.length}`);
  console.log(`   programaciones creadas : ${created}`);
  console.log(`   omitidas               : ${skipped}`);
  console.log(`   errores                : ${errors}`);

  if (omitidas.length > 0) {
    const vacias = omitidas.filter(o => o.info.includes('(sin hospital)') && o.info.includes('(sin médico)'));
    const conDatos = omitidas.filter(o => !vacias.includes(o));
    console.log(`\n⚠️  Filas omitidas (${omitidas.length}):`);
    if (vacias.length > 0) {
      console.log(`   ${vacias.length} filas completamente vacías (sin ID, hospital, fecha ni médico) — probablemente filas en blanco del sheet`);
      console.log(`   Números de fila: ${vacias.map(o => o.fila).join(', ')}`);
    }
    for (const o of conDatos) {
      console.log(`   Fila ${String(o.fila).padStart(4, ' ')} — ${o.razon} | ${o.info}`);
    }
  }

  const medicosSinLink = [...medicoNombresCSV].filter(n => !medicoNombresLinked.has(n));
  const tecnicosSinLink = [...tecnicoNombresCSV].filter(n => !tecnicoNombresLinked.has(n));

  console.log(`\n👨‍⚕️  Médicos:`);
  console.log(`   únicos en CSV          : ${medicoNombresCSV.size}`);
  console.log(`   vinculados en DB        : ${medicoNombresLinked.size}`);
  if (medicosSinLink.length > 0) {
    console.log(`   sin vincular (${medicosSinLink.length})       : ${medicosSinLink.join(', ')}`);
  }

  console.log(`\n🔧  Técnicos:`);
  console.log(`   únicos en CSV          : ${tecnicoNombresCSV.size}`);
  console.log(`   vinculados en DB        : ${tecnicoNombresLinked.size}`);
  if (tecnicosSinLink.length > 0) {
    console.log(`   sin vincular (${tecnicosSinLink.length})       : ${tecnicosSinLink.join(', ')}`);
  }

  console.log(`\n📊 Totales en DB:`);
  console.log(`   programaciones         : ${totalProg}`);
  console.log(`   programacion_medicos   : ${totalMedicos}`);
  console.log(`   programacion_tecnicos  : ${totalTecnicos}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
