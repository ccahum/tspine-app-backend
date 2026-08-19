import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parse } from 'csv-parse/sync';

const prisma  = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - Programacion - Programacion.csv');

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

function parseList(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function parseBool(raw: string): boolean | null {
  const v = raw?.trim()?.toUpperCase();
  if (v === 'TRUE')  return true;
  if (v === 'FALSE') return false;
  return null;
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

  console.log('\n' + '═'.repeat(70));
  console.log('  VALIDACIÓN POST-IMPORTACIÓN — PROGRAMACIONES');
  console.log('═'.repeat(70));
  console.log(`\n📂 CSV cargado: ${rows.length} filas\n`);

  // ── 1. ANÁLISIS DEL CSV ───────────────────────────────────────────────────
  sec('1. ANÁLISIS DEL CSV');

  const conId    = rows.filter(r => !!getCol(r, 'ID_PROGRAMACION')?.trim());
  const sinId    = rows.filter(r => !getCol(r, 'ID_PROGRAMACION')?.trim());

  const idLegaciesCSV = conId.map(r => getCol(r, 'ID_PROGRAMACION').trim());
  const idUnicos      = new Set(idLegaciesCSV);
  const dupIds        = idLegaciesCSV.filter((id, i) => idLegaciesCSV.indexOf(id) !== i);
  const dupIdsUnicos  = [...new Set(dupIds)];

  console.log(`  Total filas CSV              : ${rows.length}`);
  console.log(`  Con ID_PROGRAMACION          : ${conId.length}`);
  console.log(`  Sin ID_PROGRAMACION (omitidas): ${sinId.length}`);
  console.log(`  IDs únicos                   : ${idUnicos.size}`);
  console.log(`  IDs duplicados en CSV        : ${dupIdsUnicos.length}`);

  // ── 2. FILAS OMITIDAS (sin ID_PROGRAMACION) ───────────────────────────────
  sec('2. FILAS OMITIDAS — SIN ID_PROGRAMACION');

  if (sinId.length === 0) {
    ok('Ninguna fila omitida');
  } else {
    const vacias    = sinId.filter(r =>
      !getCol(r, 'HOSPITAL')?.trim() &&
      !getCol(r, 'FECHA QX')?.trim() &&
      !getCol(r, 'MÉDICO')?.trim()
    );
    const conDatos  = sinId.filter(r =>
      getCol(r, 'HOSPITAL')?.trim() ||
      getCol(r, 'FECHA QX')?.trim() ||
      getCol(r, 'MÉDICO')?.trim()
    );

    if (vacias.length > 0) {
      console.log(`  ${vacias.length} filas completamente vacías (sin ID, hospital, fecha ni médico)`);
      console.log(`  Filas: ${vacias.map(r => rows.indexOf(r) + 2).join(', ')}`);
    }
    if (conDatos.length > 0) {
      fail(`${conDatos.length} filas omitidas CON datos — revisar:`);
      for (const r of conDatos) {
        const fila    = rows.indexOf(r) + 2;
        const hosp    = getCol(r, 'HOSPITAL')?.trim()  || '(sin hospital)';
        const fecha   = getCol(r, 'FECHA QX')?.trim()  || '(sin fecha)';
        const medico  = getCol(r, 'MÉDICO')?.trim()    || '(sin médico)';
        console.log(`    Fila ${String(fila).padStart(4)} | Hospital: ${hosp} | Fecha: ${fecha} | Médico: ${medico}`);
      }
    }
  }

  // ── 3. ID_PROGRAMACION DUPLICADOS EN CSV ──────────────────────────────────
  sec('3. ID_PROGRAMACION DUPLICADOS EN CSV');

  if (dupIdsUnicos.length === 0) {
    ok('Sin ID_PROGRAMACION duplicados en CSV');
  } else {
    fail(`${dupIdsUnicos.length} ID_PROGRAMACION aparecen más de una vez:`);
    for (const id of dupIdsUnicos) {
      const filas = conId
        .filter(r => getCol(r, 'ID_PROGRAMACION').trim() === id)
        .map(r => rows.indexOf(r) + 2);
      console.log(`    id: "${id}" — filas CSV: ${filas.join(', ')}`);
    }
  }

  // ── 4. COMPARACIÓN CSV vs DB ──────────────────────────────────────────────
  sec('4. COMPARACIÓN CSV vs DB');

  const [totalDb, totalMedDb, totalTecDb] = await Promise.all([
    prisma.programacion.count(),
    prisma.programacionMedico.count(),
    prisma.programacionTecnico.count(),
  ]);

  const medicosCSV  = new Set(conId.flatMap(r => parseList(getCol(r, 'MÉDICO'))));
  const tecnicosCSV = new Set(conId.flatMap(r => parseList(getCol(r, 'TECNICOS ASIGNADOS'))));

  const fila = (label: string, csv: number, db: number) => {
    const diff = db - csv;
    const d    = diff === 0 ? '✅  0' : diff > 0 ? `+${diff}` : `${diff}`;
    console.log(`  ${label.padEnd(28)} CSV: ${String(csv).padStart(5)}   DB: ${String(db).padStart(5)}   DIFF: ${d}`);
  };

  fila('Programaciones',   idUnicos.size,      totalDb);
  fila('Médicos únicos CSV vs DB junctions', medicosCSV.size, totalMedDb);
  fila('Técnicos únicos CSV vs DB junctions', tecnicosCSV.size, totalTecDb);

  console.log(`\n  Nota: médicos DB es total de vínculos (una programación puede tener N médicos)`);

  // ── 5. COBERTURA DE CAMPOS ────────────────────────────────────────────────
  sec('5. COBERTURA DE CAMPOS EN DB');

  const camposCsv: { label: string; col: string; tipo: 'str' | 'bool' }[] = [
    { label: 'creadoPor (USUARIO)',              col: 'USUARIO',              tipo: 'str'  },
    { label: 'cotizacionUrl (COTIZACION)',        col: 'COTIZACION',           tipo: 'str'  },
    { label: 'enviarProgramacion',               col: 'ENVIAR PROGRAMACION',  tipo: 'str'  },
    { label: 'folioRequisicion',                 col: 'FOLIO REQUISICIÓN',    tipo: 'str'  },
    { label: 'fechaQx (FECHA QX)',               col: 'FECHA QX',             tipo: 'str'  },
    { label: 'horaQx (HORA QX)',                 col: 'HORA QX',              tipo: 'str'  },
    { label: 'sedeId (SEDE)',                    col: 'SEDE',                 tipo: 'str'  },
    { label: 'hospitalId (HOSPITAL)',            col: 'HOSPITAL',             tipo: 'str'  },
    { label: 'avance (AVANCE)',                  col: 'AVANCE',               tipo: 'str'  },
  ];

  const dbCampos = await Promise.all([
    prisma.programacion.count({ where: { creadoPor:          { not: null } } }),
    prisma.programacion.count({ where: { cotizacionUrl:       { not: null } } }),
    prisma.programacion.count({ where: { enviarProgramacion:  { not: null } } }),
    prisma.programacion.count({ where: { folioRequisicion:    { not: null } } }),
    prisma.programacion.count({ where: { fechaQx:             { not: null } } }),
    prisma.programacion.count({ where: { horaQx:              { not: null } } }),
    prisma.programacion.count({ where: { sedeId:              { not: null } } }),
    prisma.programacion.count({ where: { hospitalId:          { not: null } } }),
    prisma.programacion.count({ where: { avance:              { not: null } } }),
  ]);

  for (let i = 0; i < camposCsv.length; i++) {
    const { label, col, tipo } = camposCsv[i];
    const csvCount = conId.filter(r => {
      const v = getCol(r, col)?.trim();
      if (!v) return false;
      return tipo === 'bool' ? parseBool(v) !== null : true;
    }).length;
    const dbCount = dbCampos[i];
    const msg = `${label.padEnd(35)} CSV: ${String(csvCount).padStart(4)}   DB: ${String(dbCount).padStart(4)}`;
    csvCount === dbCount ? ok(msg) : warn(msg + '  ← DIFERENCIA');
  }

  // ── 6. PROGRAMACIONES SIN RELACIONES ─────────────────────────────────────
  sec('6. PROGRAMACIONES SIN RELACIONES');

  const [sinHospital, sinSede, sinMedico] = await Promise.all([
    prisma.programacion.count({ where: { hospitalId: null } }),
    prisma.programacion.count({ where: { sedeId:     null } }),
    prisma.programacion.count({ where: { medicos:    { none: {} } } }),
  ]);

  sinHospital === 0 ? ok('Todas tienen hospitalId') : warn(`${sinHospital} programaciones sin hospitalId`);
  sinSede     === 0 ? ok('Todas tienen sedeId')     : warn(`${sinSede} programaciones sin sedeId`);
  sinMedico   === 0 ? ok('Todas tienen al menos un médico') : warn(`${sinMedico} programaciones sin médico asignado`);

  // ── 7. IDLEGACY EN CSV NO IMPORTADOS ─────────────────────────────────────
  sec('7. IDs EN CSV NO ENCONTRADOS EN DB');

  const idsEnDb   = new Set(
    (await prisma.programacion.findMany({ select: { id: true } }))
      .map(p => p.id)
  );
  const faltantes = [...idUnicos].filter(id => !idsEnDb.has(id));

  if (faltantes.length === 0) {
    ok('Todos los ID_PROGRAMACION del CSV están en DB');
  } else {
    fail(`${faltantes.length} ID_PROGRAMACION del CSV no encontrados en DB:`);
    for (const id of faltantes) {
      const r     = conId.find(r => getCol(r, 'ID_PROGRAMACION').trim() === id)!;
      const fila  = rows.indexOf(r) + 2;
      const hosp  = getCol(r, 'HOSPITAL')?.trim()  || '(sin hospital)';
      const fecha = getCol(r, 'FECHA QX')?.trim()  || '(sin fecha)';
      console.log(`    Fila ${String(fila).padStart(4)} | id: "${id}" | Hospital: ${hosp} | Fecha: ${fecha}`);
    }
  }

  // ── 8. IDs EN DB NO PROVENIENTES DEL CSV ─────────────────────────────────
  sec('8. IDs EN DB NO PROVENIENTES DEL CSV');

  const extrasDb = [...idsEnDb].filter(id => !idUnicos.has(id));
  if (extrasDb.length === 0) {
    ok('Todos los IDs en DB provienen del CSV');
  } else {
    warn(`${extrasDb.length} IDs en DB sin origen en CSV:`);
    for (const id of extrasDb) console.log(`    + "${id}"`);
  }

  // ── 9. INTEGRIDAD ─────────────────────────────────────────────────────────
  sec('9. INTEGRIDAD');

  const [hospHuerfano, medicoHuerfano, tecnicoHuerfano] = await Promise.all([
    prisma.programacion.count({ where: { hospitalId: { not: null }, hospital: null } }),
    prisma.programacionMedico.count({ where: { medico: { is: undefined as any } } }),
    prisma.programacionTecnico.count({ where: { tecnico: { is: undefined as any } } }),
  ]);

  hospHuerfano    === 0 ? ok('Sin programaciones con hospitalId huérfano')     : fail(`${hospHuerfano} hospitalId huérfanos`);
  medicoHuerfano  === 0 ? ok('Sin médicos de programación sin Tercero')        : fail(`${medicoHuerfano} médicos sin Tercero`);
  tecnicoHuerfano === 0 ? ok('Sin técnicos de programación sin Tercero')       : fail(`${tecnicoHuerfano} técnicos sin Tercero`);

  // ── 10. MUESTRA ALEATORIA ─────────────────────────────────────────────────
  sec('10. MUESTRA ALEATORIA DE 5 PROGRAMACIONES');

  const muestra = await prisma.programacion.findMany({
    take:    5,
    skip:    Math.floor(Math.random() * Math.max(1, totalDb - 5)),
    include: {
      hospital: { select: { nombre: true } },
      sede:     { select: { nombre: true } },
      medicos:  { include: { medico: { select: { nombreCompleto: true } } } },
      tecnicos: { include: { tecnico: { select: { nombreCompleto: true } } } },
    },
  });

  for (const p of muestra) {
    console.log(`\n  [${p.id}]`);
    console.log(`    fecha       : ${p.fechaQx?.toISOString().slice(0, 10) ?? '—'}`);
    console.log(`    hospital    : ${p.hospital?.nombre ?? '—'}`);
    console.log(`    sede        : ${p.sede?.nombre ?? '—'}`);
    console.log(`    creadoPor   : ${p.creadoPor ?? '—'}`);
    console.log(`    cotizacion  : ${p.cotizacionUrl ?? '—'}`);
    console.log(`    folioReq    : ${p.folioRequisicion ?? '—'}`);
    console.log(`    enviar      : ${p.enviarProgramacion ?? '—'}`);
    console.log(`    médicos     : ${p.medicos.map(m => m.medico.nombreCompleto).join(', ') || '—'}`);
    console.log(`    técnicos    : ${p.tecnicos.map(t => t.tecnico.nombreCompleto).join(', ') || '—'}`);
  }

  // ── RESUMEN ───────────────────────────────────────────────────────────────
  sep();
  console.log('  RESUMEN FINAL');
  sep();
  console.log(`\n  📂 CSV`);
  console.log(`     Filas totales              : ${rows.length}`);
  console.log(`     Con ID_PROGRAMACION        : ${conId.length}`);
  console.log(`     Sin ID_PROGRAMACION        : ${sinId.length}`);
  console.log(`     IDs duplicados             : ${dupIdsUnicos.length}`);
  console.log(`\n  📊 DB`);
  console.log(`     programaciones             : ${totalDb}`);
  console.log(`     programacion_medicos       : ${totalMedDb}`);
  console.log(`     programacion_tecnicos      : ${totalTecDb}`);
  console.log(`     Sin hospitalId             : ${sinHospital}`);
  console.log(`     Sin sedeId                 : ${sinSede}`);
  console.log(`     Sin médico asignado        : ${sinMedico}`);
  if (faltantes.length > 0) {
    console.log(`\n  ❌ ${faltantes.length} ID_PROGRAMACION del CSV no importados`);
  } else {
    console.log(`\n  ✅ Todos los ID_PROGRAMACION importados correctamente`);
  }
  sep();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
