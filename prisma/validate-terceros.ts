/**
 * validate-terceros.ts
 * Validación y diagnóstico post-importación de Terceros.
 * Combina verificación de integridad de DB + comparación completa CSV vs DB.
 * Solo lectura — no modifica ningún dato.
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();
const CSV_PATH      = path.join('C:\\Users\\ASUS\\Desktop\\tspine-csv', 'SistemaTspine1.0 - Terceros.csv');
const CSV_PROG_PATH = path.join('C:\\Users\\ASUS\\Desktop\\tspine-csv', 'SistemaTspine1.0 - Programacion - Programacion.csv');

// ─── Column resolver ──────────────────────────────────────────────────────────
let _colIndex: Map<string, string> | null = null;

function buildColIndex(row: Record<string, string>) {
  _colIndex = new Map();
  for (const key of Object.keys(row)) {
    const n = key.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!_colIndex.has(n)) _colIndex.set(n, key); // first column wins on name collision
  }
}

function getCol(row: Record<string, string>, name: string): string {
  if (!_colIndex) buildColIndex(row);
  const n = name.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const actual = _colIndex!.get(n);
  return actual ? (row[actual] ?? '') : (row[name] ?? '');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseBool(val: string): boolean | null {
  const v = val?.trim()?.toUpperCase();
  if (v === 'TRUE') return true;
  if (v === 'FALSE') return false;
  return null;
}

function cleanNombre(raw: string): string {
  return raw.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanCorreo(val: string): string | null {
  const v = val?.trim().toLowerCase();
  if (!v) return null;
  const basura = ['.', 'na', 'n', 'sn', 'n/a', 'no', 'none', '-', 'correo'];
  if (basura.includes(v) || !v.includes('@') || !v.includes('.')) return null;
  return v;
}

function cleanRfc(val: string): string | null {
  const v = val?.trim().toUpperCase();
  if (!v) return null;
  if (['NO ESTA', 'NOESTA', 'NO_ESTA', '-', 'N/A', 'NA', 'NO'].includes(v)) return null;
  return v;
}

// ─── Output helpers ───────────────────────────────────────────────────────────
let totalIssues = 0;

function section(title: string) {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

function ok(msg: string)   { console.log(`  ✅ ${msg}`); }
function warn(msg: string) { console.log(`  ⚠️  ${msg}`); totalIssues++; }
function fail(msg: string) { console.log(`  ❌ ${msg}`); totalIssues++; }

const CLASIFICACIONES_COLS = [
  'PARTICULAR', 'DISTRIBUIDOR', 'ASEGURADORA', 'CLIENTE', 'EMPLEADO',
  'HOSPITAL', 'DOCTOR', 'COMISIONISTA', 'INVERSIONISTA', 'EMPRESA',
  'PROVEEDOR', 'SEDE?', 'ALMACEN?', 'GRUPO?', 'OTROS',
];

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

  // Cargar CSV de programaciones para diagnóstico de hospitales sin ciudad
  let progRows: Record<string, string>[] = [];
  if (fs.existsSync(CSV_PROG_PATH)) {
    const progContent = fs.readFileSync(CSV_PROG_PATH, 'utf-8');
    progRows = parse(progContent, {
      columns: true, skip_empty_lines: true,
      relax_quotes: true, relax_column_count: true, bom: true,
    });
  }

  // Mapa: hospitalNombre → [{ idProg, ciudadQx }]
  const hospCiudadQxMap = new Map<string, { idProg: string; ciudadQx: string }[]>();
  for (const p of progRows) {
    const hosp     = p['HOSPITAL']?.trim();
    const ciudadQx = p['CIUDAD QX']?.trim() ?? '';
    const idProg   = p['ID_PROGRAMACION']?.trim() ?? p['N° PROGRAMACIÓN']?.trim() ?? '';
    if (!hosp) continue;
    if (!hospCiudadQxMap.has(hosp)) hospCiudadQxMap.set(hosp, []);
    hospCiudadQxMap.get(hosp)!.push({ idProg, ciudadQx });
  }

  if (rows.length > 0) buildColIndex(rows[0]);
  const todasLasColumnas = rows.length > 0 ? Object.keys(rows[0]) : [];

  console.log('\n' + '═'.repeat(70));
  console.log('  VALIDACIÓN POST-IMPORTACIÓN — TERCEROS');
  console.log('═'.repeat(70));
  console.log(`\n📂 CSV cargado: ${rows.length} filas\n`);

  // ── 1. ANÁLISIS DEL CSV ───────────────────────────────────────────────────────
  section('1. ANÁLISIS DEL CSV');

  const gruposPorNombre = new Map<string, Record<string, string>[]>();
  let sinNombre = 0;

  for (const row of rows) {
    const raw    = getCol(row, 'NOMBRE COMPLETO')?.trim();
    if (!raw) { sinNombre++; continue; }
    const nombre = cleanNombre(raw);
    if (!gruposPorNombre.has(nombre)) gruposPorNombre.set(nombre, []);
    gruposPorNombre.get(nombre)!.push(row);
  }

  const totalUnicosEnCsv  = gruposPorNombre.size;
  const duplicadosGrupos  = [...gruposPorNombre.entries()].filter(([, g]) => g.length > 1);
  const filasDuplicadas   = duplicadosGrupos.reduce((sum, [, g]) => sum + g.length, 0);
  const csvHospitales     = rows.filter(r => parseBool(getCol(r, 'HOSPITAL')) === true).length;
  const csvSedes          = rows.filter(r => parseBool(getCol(r, 'SEDE?'))    === true).length;

  console.log(`  Total filas en CSV           : ${rows.length}`);
  console.log(`  Filas sin NOMBRE COMPLETO    : ${sinNombre}`);
  console.log(`  Nombres únicos               : ${totalUnicosEnCsv}`);
  console.log(`  Grupos con nombre duplicado  : ${duplicadosGrupos.length}`);
  console.log(`  Filas involucradas en duplic.: ${filasDuplicadas}`);
  console.log(`  Filas omitidas (repeticiones): ${filasDuplicadas - duplicadosGrupos.length}`);
  console.log(`  HOSPITAL=true                : ${csvHospitales}`);
  console.log(`  SEDE?=true                   : ${csvSedes}`);

  if (sinNombre > 0) warn(`${sinNombre} filas sin NOMBRE COMPLETO en CSV`);

  // ── 2. DUPLICADOS EN CSV — DETALLE ───────────────────────────────────────────
  section(`2. DUPLICADOS EN CSV (${duplicadosGrupos.length} grupos)`);

  if (duplicadosGrupos.length === 0) {
    ok('Sin duplicados en CSV');
  }

  let dupConConflicto = 0;

  for (const [nombre, grupo] of duplicadosGrupos) {
    const idLegacies   = grupo.map(r => getCol(r, 'ID TERCEROS')?.trim().replace(/\s+/g, ' ') ?? '');
    const idsDistintos = new Set(idLegacies.filter(Boolean));

    // Comparar TODOS los campos del CSV
    const camposDifieren: { campo: string; valores: string[] }[] = [];
    for (const col of todasLasColumnas) {
      const valores = grupo.map(r => (r[col] ?? '').trim());
      const distintos = new Set(valores.filter(v => v !== ''));
      if (distintos.size > 1) camposDifieren.push({ campo: col, valores });
    }

    const tieneConflicto = idsDistintos.size > 1;
    if (tieneConflicto) dupConConflicto++;

    console.log(`\n  ┌─ "${nombre}" — ${grupo.length} filas`);
    if (tieneConflicto) {
      console.log(`  │  ⚠️  ID TERCEROS distintos: [${[...idsDistintos].join(' | ')}]`);
      console.log(`  │     → El import creó registros separados para cada ID`);
    }
    if (camposDifieren.length === 0) {
      console.log(`  │  ℹ️  Filas idénticas en todos los campos — sin pérdida de datos`);
    } else {
      console.log(`  │  Campos con valores distintos (${camposDifieren.length}):`);
      for (const { campo, valores } of camposDifieren) {
        const vals = valores.map((v, i) => `F${i + 1}:"${v || '(vacío)'}"`).join('  |  ');
        console.log(`  │    ${campo.padEnd(28)} → ${vals}`);
      }
      if (!tieneConflicto) {
        console.log(`  │  → mergeNonNull: primer valor no-null prevalece`);
      }
    }
    console.log(`  └${'─'.repeat(67)}`);
  }

  if (dupConConflicto > 0) warn(`${dupConConflicto} grupos con ID TERCEROS distintos — verificar que se crearon registros separados`);

  // ── 3. COMPARACIÓN CSV vs DB — CONTEOS ───────────────────────────────────────
  section('3. COMPARACIÓN CSV vs DB — CONTEOS');

  const [totalDb, hospDb, medicosDb, provDb, clientDb, empleadoDb, distribDb] = await Promise.all([
    prisma.tercero.count(),
    prisma.terceroClasificacion.count({ where: { clasificacion: 'HOSPITAL' } }),
    prisma.terceroClasificacion.count({ where: { clasificacion: 'DOCTOR' } }),
    prisma.terceroClasificacion.count({ where: { clasificacion: 'PROVEEDOR' } }),
    prisma.terceroClasificacion.count({ where: { clasificacion: 'CLIENTE' } }),
    prisma.terceroClasificacion.count({ where: { clasificacion: 'EMPLEADO' } }),
    prisma.terceroClasificacion.count({ where: { clasificacion: 'DISTRIBUIDOR' } }),
  ]);

  const uniqPorClasif = (col: string) =>
    new Set([...gruposPorNombre.entries()]
      .filter(([, g]) => parseBool(getCol(g[0], col)) === true)
      .map(([n]) => n)).size;

  console.log(`\n  ${'CLASIFICACIÓN'.padEnd(22)} ${'CSV únicos'.padStart(12)} ${'DB'.padStart(8)} ${'DIFF'.padStart(8)}`);
  console.log(`  ${'─'.repeat(54)}`);

  const fila = (label: string, csv: number, db: number) => {
    const diff = db - csv;
    const d = diff === 0 ? '✅  0' : diff > 0 ? `+${diff}` : `${diff}`;
    console.log(`  ${label.padEnd(22)} ${String(csv).padStart(12)} ${String(db).padStart(8)} ${d.padStart(8)}`);
  };

  fila('TOTAL terceros',    totalUnicosEnCsv,            totalDb);
  fila('HOSPITAL',          uniqPorClasif('HOSPITAL'),   hospDb);
  fila('DOCTOR',            uniqPorClasif('DOCTOR'),     medicosDb);
  fila('PROVEEDOR',         uniqPorClasif('PROVEEDOR'),  provDb);
  fila('CLIENTE',           uniqPorClasif('CLIENTE'),    clientDb);
  fila('EMPLEADO',          uniqPorClasif('EMPLEADO'),   empleadoDb);
  fila('DISTRIBUIDOR',      uniqPorClasif('DISTRIBUIDOR'), distribDb);

  console.log(`\n  Nota: DB puede tener MÁS que CSV por:`);
  console.log(`    + Médicos/técnicos creados desde programaciones (sin CSV)`);
  console.log(`    + Hospitales con Tercero mínimo (sin nombre en CSV de terceros)`);
  console.log(`    + Usuario admin del seed`);
  console.log(`    + Registros separados por DUP_NOMBRE_CONFLICTO`);

  // ── 4. NOMBRES EN CSV SIN REGISTRO EN DB ─────────────────────────────────────
  section('4. NOMBRES EN CSV SIN REGISTRO EN DB');

  const nombresEnCsv  = [...gruposPorNombre.keys()];
  const tercerosMapa  = new Map<string, boolean>();
  const batchSize     = 200;

  for (let i = 0; i < nombresEnCsv.length; i += batchSize) {
    const lote = nombresEnCsv.slice(i, i + batchSize);
    const found = await prisma.tercero.findMany({
      where:  { nombreCompleto: { in: lote } },
      select: { nombreCompleto: true },
    });
    found.forEach(t => tercerosMapa.set(t.nombreCompleto, true));
  }

  const faltantesEnDb = nombresEnCsv.filter(n => !tercerosMapa.has(n));

  const sedesFaltantes  = faltantesEnDb.filter(n => {
    const row = gruposPorNombre.get(n)![0];
    return parseBool(getCol(row, 'SEDE?')) === true || parseBool(getCol(row, 'ALMACEN?')) === true;
  });
  const realFaltantes   = faltantesEnDb.filter(n => !sedesFaltantes.includes(n));

  if (realFaltantes.length === 0 && sedesFaltantes.length === 0) {
    ok('Todos los nombres únicos del CSV tienen registro en DB');
  } else {
    if (realFaltantes.length > 0) {
      fail(`${realFaltantes.length} nombres del CSV no encontrados en DB:`);
      for (const nombre of realFaltantes) {
        const grupo  = gruposPorNombre.get(nombre)!;
        const clases = CLASIFICACIONES_COLS.filter(c => parseBool(getCol(grupo[0], c)) === true).join(', ');
        console.log(`    ❌ "${nombre}" (${clases || 'sin clasificación'})`);
      }
    } else {
      ok('Todos los nombres del CSV (excl. sedes) tienen registro en DB');
    }
    if (sedesFaltantes.length > 0) {
      console.log(`  ℹ️  ${sedesFaltantes.length} sedes no están en terceros (esperado — van a tabla sedes):`);
      for (const nombre of sedesFaltantes) {
        console.log(`    ℹ️  "${nombre}"`);
      }
    }
  }

  // ── 5. REGISTROS EN DB NO PROVENIENTES DEL CSV ───────────────────────────────
  section('5. REGISTROS EN DB NO PROVENIENTES DEL CSV');

  const nombresSet  = new Set(nombresEnCsv);
  const extras: { id: string; nombre: string }[] = [];
  let offset = 0;

  while (true) {
    const lote = await prisma.tercero.findMany({
      select:  { id: true, nombreCompleto: true },
      skip:    offset,
      take:    500,
      orderBy: { nombreCompleto: 'asc' },
    });
    if (lote.length === 0) break;
    lote.forEach(t => { if (!nombresSet.has(t.nombreCompleto)) extras.push({ id: t.id, nombre: t.nombreCompleto }); });
    offset += 500;
    if (lote.length < 500) break;
  }

  console.log(`  Total en DB: ${totalDb}   Únicos en CSV: ${totalUnicosEnCsv}   Sin CSV: ${extras.length}`);

  if (extras.length === 0) {
    ok('Todos los terceros de DB provienen del CSV');
  } else {
    console.log(`\n  Registros en DB sin origen en CSV (${extras.length}):`);
    extras.slice(0, 50).forEach(e => console.log(`    + "${e.nombre}"`));
    if (extras.length > 50) console.log(`    ... y ${extras.length - 50} más`);
    console.log(`\n  (Médicos/técnicos de programaciones, hospitales mínimos, admin)`);
  }

  // ── 6. HOSPITALES — TERCERO Y CIUDAD ─────────────────────────────────────────
  section('6. HOSPITALES — TERCERO Y CIUDAD');

  const [totalHosp, hospSinTercero, hospsSinCiudad] = await Promise.all([
    prisma.hospital.count(),
    prisma.hospital.findMany({ where: { terceroId: null }, select: { nombre: true } }),
    prisma.hospital.findMany({ where: { ciudadId: null }, select: { nombre: true }, orderBy: { nombre: 'asc' } }),
  ]);

  console.log(`  Total hospitales en DB: ${totalHosp}`);

  hospSinTercero.length === 0
    ? ok('Todos los hospitales tienen terceroId')
    : fail(`${hospSinTercero.length} hospitales SIN terceroId:\n${hospSinTercero.map(h => `    - ${h.nombre}`).join('\n')}`);

  if (hospsSinCiudad.length === 0) {
    ok('Todos los hospitales tienen ciudadId');
  } else {
    warn(`${hospsSinCiudad.length} hospitales sin ciudadId (no tenían CIUDAD QX válida en ninguna programación):`);
    for (const h of hospsSinCiudad) {
      const progs = hospCiudadQxMap.get(h.nombre) ?? [];
      const ciudadesUnicas = [...new Set(progs.map(p => p.ciudadQx || '(vacío)'))];
      const ejemploIds = progs.slice(0, 3).map(p => p.idProg).filter(Boolean).join(', ');
      console.log(`    • "${h.nombre}"`);
      console.log(`      CIUDAD QX encontrada(s): [${ciudadesUnicas.length ? ciudadesUnicas.join(' | ') : '(sin programaciones)'}]`);
      if (ejemploIds) {
        const extra = progs.length > 3 ? ` (+${progs.length - 3} más)` : '';
        console.log(`      Ej. ID_PROGRAMACION: ${ejemploIds}${extra}`);
      }
    }
  }

  // ── 7. CLASIFICACIONES — TODOS LOS TIPOS ─────────────────────────────────────
  section('7. CLASIFICACIONES (15 tipos)');

  const clValMap: Record<string, string> = { 'SEDE?': 'SEDE', 'ALMACEN?': 'ALMACEN', 'GRUPO?': 'GRUPO' };

  const sinTercero = new Set(['SEDE?', 'ALMACEN?']); // sedes van a tabla sedes, no terceros

  // Para GRUPO? las sedes tienen esa clasificación en CSV pero no se importan como terceros → excluirlas
  const uniqGrupoExclSedes = new Set([...gruposPorNombre.entries()]
    .filter(([, g]) => parseBool(getCol(g[0], 'GRUPO?')) === true && parseBool(getCol(g[0], 'SEDE?')) !== true)
    .map(([n]) => n)).size;

  for (const col of CLASIFICACIONES_COLS) {
    const enumVal  = clValMap[col] ?? col;
    const csvCount = col === 'GRUPO?' ? uniqGrupoExclSedes : uniqPorClasif(col);
    const dbCount  = await prisma.terceroClasificacion.count({ where: { clasificacion: enumVal as any } });
    const msg      = `${col.padEnd(15)} CSV: ${String(csvCount).padStart(4)}  DB: ${String(dbCount).padStart(4)}`;
    if (sinTercero.has(col)) {
      console.log(`  ℹ️  ${msg}  (esperado: sedes no se guardan en terceros)`);
    } else {
      csvCount === dbCount ? ok(msg) : warn(msg + '  ← DIFERENCIA');
      if (col === 'HOSPITAL' && dbCount > csvCount) {
        const hospEnDb = await prisma.terceroClasificacion.findMany({
          where:   { clasificacion: 'HOSPITAL' },
          include: { tercero: { select: { nombreCompleto: true } } },
        });
        const extrasHosp = hospEnDb.filter(h => {
          const grupo = gruposPorNombre.get(h.tercero.nombreCompleto);
          if (!grupo) return true;                                    // nombre no está en CSV
          return parseBool(getCol(grupo[0], 'HOSPITAL')) !== true;   // está en CSV pero sin HOSPITAL=true
        });
        if (extrasHosp.length > 0) {
          console.log(`      Terceros con clasificación HOSPITAL no encontrados en CSV:`);
          for (const h of extrasHosp) {
            const enCsv = gruposPorNombre.has(h.tercero.nombreCompleto);
            const razon = enCsv ? '(en CSV pero sin HOSPITAL=true)' : '(no está en CSV)';
            console.log(`        • "${h.tercero.nombreCompleto}"  ${razon}`);
          }
        }
      }
    }
  }

  // ── 8. DATOS FISCALES ─────────────────────────────────────────────────────────
  section('8. DATOS FISCALES');

  const csvConRfc    = [...gruposPorNombre.values()].filter(g => !!cleanRfc(getCol(g[0], 'RFC'))).length;
  const dbConRfc     = await prisma.datosFiscales.count({ where: { rfc: { not: null } } });
  const csvConRazon  = [...gruposPorNombre.values()].filter(g => !!getCol(g[0], 'RAZON SOCIAL')?.trim()).length;
  const dbConRazon   = await prisma.datosFiscales.count({ where: { razonSocial: { not: null } } });
  const totalFiscal  = await prisma.datosFiscales.count();

  console.log(`  Total datos_fiscales en DB: ${totalFiscal}`);
  csvConRfc   === dbConRfc   ? ok(`RFC          CSV: ${csvConRfc}  DB: ${dbConRfc}`)   : warn(`RFC          CSV: ${csvConRfc}  DB: ${dbConRfc}  ← DIFERENCIA`);
  csvConRazon === dbConRazon ? ok(`Razón social CSV: ${csvConRazon}  DB: ${dbConRazon}`) : warn(`Razón social CSV: ${csvConRazon}  DB: ${dbConRazon}  ← DIFERENCIA`);

  // ── 9. COBERTURA DE CAMPOS ───────────────────────────────────────────────────
  section('9. COBERTURA DE CAMPOS EN DB');

  const uniq = [...gruposPorNombre.values()];
  const camposCobertura: { campo: string; csvCount: number; dbQuery: () => Promise<number> }[] = [
    { campo: 'cargoId',      csvCount: uniq.filter(g => !!getCol(g[0], 'CARGO')?.trim()).length,   dbQuery: () => prisma.tercero.count({ where: { cargoId:  { not: null } } }) },
    { campo: 'tarifaId',     csvCount: uniq.filter(g => { const v = getCol(g[0], 'TARIFA')?.trim(); return !!v && v.toUpperCase() !== 'FALSE'; }).length, dbQuery: () => prisma.tercero.count({ where: { tarifaId: { not: null } } }) },
    { campo: 'ciudadId',     csvCount: uniq.filter(g => { const v = getCol(g[0], 'CIUDAD')?.trim(); return !!v && v !== '--' && v !== '-' && v.length > 1; }).length, dbQuery: () => prisma.tercero.count({ where: { ciudadId: { not: null } } }) },
    { campo: 'perfilId',     csvCount: uniq.filter(g => !!getCol(g[0], 'PERFIL')?.trim()).length,       dbQuery: () => prisma.tercero.count({ where: { perfilId: { not: null } } }) },
    // Sedes tienen GRUPO en CSV pero no se importan como terceros → excluirlas del conteo
    { campo: 'grupo',        csvCount: uniq.filter(g => !!getCol(g[0], 'GRUPO')?.trim() && parseBool(getCol(g[0], 'SEDE?')) !== true).length, dbQuery: () => prisma.tercero.count({ where: { grupo: { not: null } } }) },
    { campo: 'observaciones',csvCount: uniq.filter(g => !!getCol(g[0], 'OBSERVACIONES')?.trim()).length, dbQuery: () => prisma.tercero.count({ where: { observaciones: { not: null } } }) },
    { campo: 'correo',       csvCount: uniq.filter(g => !!cleanCorreo(getCol(g[0], 'CORREO'))).length,  dbQuery: () => prisma.tercero.count({ where: { correo:   { not: null } } }) },
  ];

  for (const c of camposCobertura) {
    const dbCount = await c.dbQuery();
    const msg = `${c.campo.padEnd(15)} CSV: ${String(c.csvCount).padStart(5)}  DB: ${String(dbCount).padStart(5)}`;
    if (c.csvCount === dbCount) {
      ok(msg);
    } else if (c.campo === 'ciudadId' && dbCount < c.csvCount) {
      // CSV count includes junk cities (Null, NA, sn, addresses) filtered by cleanCiudad — expected
      console.log(`  ℹ️  ${msg}  (CSV incluye ~${c.csvCount - dbCount} ciudades-basura filtradas en import — esperado)`);
    } else {
      warn(msg + '  ← DIFERENCIA');
    }
  }

  // ── 10. SEDES DISPONIBLE / AUTORIZACIÓN ──────────────────────────────────────
  section('10. SEDES DISPONIBLE / AUTORIZACIÓN');

  const dbDisp = await prisma.terceroSedeDisponible.count();
  const dbAuth = await prisma.terceroSedeAutorizacion.count();
  let csvDisp = 0, csvAuth = 0;

  for (const row of rows) {
    const disp = (getCol(row, 'SEDES DISPONIBLE') || getCol(row, 'SEDES DISPONBLE')).split(',').map(s => s.trim()).filter(Boolean);
    const auth = getCol(row, 'SEDES AUTORIZACION').split(',').map(s => s.trim()).filter(Boolean);
    csvDisp += disp.length;
    csvAuth += auth.length;
  }

  csvDisp === dbDisp ? ok(`Sedes disponible   CSV: ${csvDisp}  DB: ${dbDisp}`) : warn(`Sedes disponible   CSV: ${csvDisp}  DB: ${dbDisp}  ← DIFERENCIA`);
  csvAuth === dbAuth ? ok(`Sedes autorización CSV: ${csvAuth}  DB: ${dbAuth}`) : warn(`Sedes autorización CSV: ${csvAuth}  DB: ${dbAuth}  ← DIFERENCIA`);

  // ── 11. CORREOS PERDIDOS ──────────────────────────────────────────────────────
  section('11. CORREOS PERDIDOS EN MIGRACIÓN');

  const correosPerdidos: string[] = [];
  for (const row of rows) {
    const nombre = getCol(row, 'NOMBRE COMPLETO')?.trim();
    const correo = cleanCorreo(getCol(row, 'CORREO'));
    if (!correo || !nombre) continue;
    const tercero = await prisma.tercero.findFirst({ where: { nombreCompleto: nombre }, select: { correo: true } });
    if (tercero && !tercero.correo) correosPerdidos.push(`"${nombre}" → ${correo}`);
  }

  correosPerdidos.length === 0
    ? ok('Ningún correo válido del CSV se perdió')
    : warn(`${correosPerdidos.length} correos válidos del CSV sin guardar en DB (duplicados en uso):\n${correosPerdidos.slice(0, 10).map(c => `    - ${c}`).join('\n')}`);

  // ── 12. INTEGRIDAD — PROGRAMACIONES ──────────────────────────────────────────
  section('12. INTEGRIDAD — PROGRAMACIONES');

  const [[{ count: progSinHosp }], [{ count: medSinTercero }], [{ count: tecSinTercero }]] = await Promise.all([
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM programaciones p
      WHERE p.hospital_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM hospitales h WHERE h.id = p.hospital_id)`,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM programacion_medicos pm
      WHERE NOT EXISTS (SELECT 1 FROM terceros t WHERE t.id = pm.medico_id)`,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM programacion_tecnicos pt
      WHERE NOT EXISTS (SELECT 1 FROM terceros t WHERE t.id = pt.tecnico_id)`,
  ]);

  const [totalProg, totalMed, totalTec] = await Promise.all([
    prisma.programacion.count(),
    prisma.programacionMedico.count(),
    prisma.programacionTecnico.count(),
  ]);

  console.log(`  Total programaciones    : ${totalProg}`);
  console.log(`  Total programac_medicos : ${totalMed}`);
  console.log(`  Total programac_tecnicos: ${totalTec}`);

  Number(progSinHosp)    === 0 ? ok('Ninguna programación con hospitalId huérfano')   : fail(`${progSinHosp} programaciones con hospitalId huérfano`);
  Number(medSinTercero)  === 0 ? ok('Ningún médico de programación sin Tercero')       : fail(`${medSinTercero} programacion_medicos con medicoId huérfano`);
  Number(tecSinTercero)  === 0 ? ok('Ningún técnico de programación sin Tercero')      : fail(`${tecSinTercero} programacion_tecnicos con tecnicoId huérfano`);

  // ── 13. MUESTRA ALEATORIA ─────────────────────────────────────────────────────
  section('13. MUESTRA ALEATORIA DE 5 TERCEROS');

  const muestra = await prisma.tercero.findMany({
    take: 5,
    skip: Math.floor(Math.random() * Math.max(1, totalDb - 5)),
    include: { clasificaciones: true, datosFiscales: true, cargo: true, ciudad: true, perfil: true },
  });

  for (const t of muestra) {
    console.log(`\n  [${t.id.slice(0, 8)}...] ${t.nombreCompleto}`);
    console.log(`    correo  : ${t.correo           ?? '—'}`);
    console.log(`    cargo   : ${t.cargo?.nombre    ?? '—'}`);
    console.log(`    ciudad  : ${t.ciudad?.nombre   ?? '—'}`);
    console.log(`    perfil  : ${t.perfil?.nombre   ?? '—'}`);
    console.log(`    clasif. : ${t.clasificaciones.map(c => c.clasificacion).join(', ') || '—'}`);
    console.log(`    RFC     : ${t.datosFiscales?.rfc ?? '—'}`);
  }

  // ── 14. PENDIENTES DE REVISIÓN MANUAL ────────────────────────────────────────
  section('14. PENDIENTES DE REVISIÓN MANUAL');

  let totalPendientes = 0;

  // 14a. Hospitales con Tercero mínimo (nombre vino del hospital, no del CSV de terceros)
  const hospitalesConTercero = await prisma.hospital.findMany({
    where:   { terceroId: { not: null } },
    include: { tercero: { include: { clasificaciones: true } } },
  });
  const hospConMinimo = hospitalesConTercero.filter(h => {
    const t = h.tercero!;
    const nombreLimp = cleanNombre(t.nombreCompleto);
    // "mínimo" = nombre del tercero coincide con el hospital (no vino del CSV) y no está en el set de nombres CSV
    return (t.nombreCompleto === h.nombre || nombreLimp === h.nombre)
      && !nombresSet.has(t.nombreCompleto)
      && !nombresSet.has(nombreLimp);
  });
  if (hospConMinimo.length === 0) {
    ok('Sin hospitales con Tercero mínimo');
  } else {
    warn(`${hospConMinimo.length} hospital(es) con Tercero mínimo — verificar si tienen match en el CSV de terceros:`);
    for (const h of hospConMinimo) {
      const clasifs = h.tercero!.clasificaciones.map(c => c.clasificacion).join(', ');
      console.log(`     • "${h.nombre}"  [${clasifs}]`);
    }
    totalPendientes += hospConMinimo.length;
  }

  // 14b. Grupos DUP_NOMBRE_CONFLICTO (mismo nombre, ID distinto en CSV)
  const dupConflictoGrupos = duplicadosGrupos.filter(([, g]) => {
    const ids = new Set(g.map(r => getCol(r, 'ID TERCEROS')?.trim().replace(/\s+/g, ' ')).filter(Boolean));
    return ids.size > 1;
  });
  if (dupConflictoGrupos.length === 0) {
    ok('Sin grupos con ID TERCEROS distinto en CSV');
  } else {
    warn(`${dupConflictoGrupos.length} grupo(s) con mismo nombre e ID distinto — corregir nombre en sheet fuente:`);
    for (const [nombre, grupo] of dupConflictoGrupos) {
      const ids = [...new Set(grupo.map(r => getCol(r, 'ID TERCEROS')?.trim().replace(/\s+/g, ' ')).filter(Boolean))];
      console.log(`     • "${nombre}"  →  IDs: [${ids.join(' | ')}]`);
    }
    totalPendientes += dupConflictoGrupos.length;
  }

  // 14c. Nombres del CSV sin registro en DB (excluye sedes — van a tabla sedes, no a terceros)
  const faltantesReales = faltantesEnDb.filter(nombre => {
    const row = gruposPorNombre.get(nombre)![0];
    return parseBool(getCol(row, 'SEDE?')) !== true && parseBool(getCol(row, 'ALMACEN?')) !== true;
  });
  if (faltantesReales.length === 0) {
    ok('Todos los nombres del CSV (excl. sedes) tienen registro en DB');
  } else {
    warn(`${faltantesReales.length} nombre(s) del CSV sin registro en DB — revisar por qué no se importaron:`);
    for (const nombre of faltantesReales) {
      const clases = CLASIFICACIONES_COLS.filter(c => parseBool(getCol(gruposPorNombre.get(nombre)![0], c)) === true).join(', ');
      console.log(`     • "${nombre}"  (${clases || 'sin clasificación'})`);
    }
    totalPendientes += faltantesReales.length;
  }

  // 14d. Hospitales sin terceroId
  if (hospSinTercero.length === 0) {
    ok('Todos los hospitales tienen terceroId');
  } else {
    warn(`${hospSinTercero.length} hospital(es) sin terceroId:`);
    for (const h of hospSinTercero) console.log(`     • "${h.nombre}"`);
    totalPendientes += hospSinTercero.length;
  }

  if (totalPendientes === 0) ok('Sin pendientes de revisión manual');

  // ── RESUMEN FINAL ─────────────────────────────────────────────────────────────
  section('RESUMEN FINAL');

  console.log(`\n  📂 CSV`);
  console.log(`     Filas totales          : ${rows.length}`);
  console.log(`     Nombres únicos         : ${totalUnicosEnCsv}`);
  console.log(`     Grupos duplicados      : ${duplicadosGrupos.length} (${dupConConflicto} con ID distinto)`);
  console.log(`     Nombres sin registro   : ${realFaltantes.length}`);

  console.log(`\n  📊 DB`);
  console.log(`     terceros               : ${totalDb}`);
  console.log(`     hospitales             : ${totalHosp} (${hospSinTercero.length} sin terceroId)`);
  console.log(`     datos_fiscales         : ${totalFiscal}`);
  console.log(`     programaciones         : ${totalProg}`);
  console.log(`     Extra en DB (sin CSV)  : ${extras.length}`);

  console.log(`     Pendientes revisión    : ${totalPendientes}`);
  console.log(`\n  ${totalIssues === 0 ? '✅ Sin problemas detectados.' : `⚠️  ${totalIssues} problema(s) — revisa los ❌/⚠️ arriba.`}`);
  if (totalPendientes > 0) console.log(`  🔴 ${totalPendientes} pendiente(s) de revisión manual — ver sección 14.\n`);
  else console.log(`  ✅ Sin pendientes de revisión manual.\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
