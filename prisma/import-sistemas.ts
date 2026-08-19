/**
 * import-sistemas.ts
 * Puebla: sistemas
 * Requiere: terceros ya importados
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma   = new PrismaClient();
const CSV_PATH = path.join(os.homedir(), 'Desktop', 'tspine-csv', 'SistemaTspine1.0 - Sistema.csv');

// ── Column resolver ───────────────────────────────────────────────────────────

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

const MESES: Record<string, string> = {
  ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
  jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12',
};

function parseDateTime(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null;
  const v = val.trim();

  // Formato: "21/1/2026 18:25:03" o "21/1/2026"
  if (v.includes('/')) {
    const [datePart, timePart] = v.split(' ');
    const [d, m, y] = datePart.split('/');
    const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    if (timePart) {
      const [h, min, sec] = timePart.split(':');
      const timeStr = `${h.padStart(2, '0')}:${(min ?? '00').padStart(2, '0')}:${(sec ?? '00').padStart(2, '0')}`;
      return new Date(`${dateStr}T${timeStr}Z`);
    }
    return new Date(`${dateStr}T00:00:00Z`);
  }

  // Formato: "21-jul-2022"
  if (v.includes('-')) {
    const parts = v.split('-');
    if (parts.length === 3) {
      const [d, mesAbr, y] = parts;
      const m = MESES[mesAbr.toLowerCase()];
      if (m) {
        return new Date(`${y}-${m}-${d.padStart(2, '0')}T00:00:00Z`);
      }
    }
  }

  return null;
}

// ── Cache de terceros ─────────────────────────────────────────────────────────

const terceroCache = new Map<string, string | null>();

async function resolverTercero(nombre: string): Promise<string | null> {
  if (terceroCache.has(nombre)) return terceroCache.get(nombre)!;
  const t = await prisma.tercero.findFirst({
    where: { nombreCompleto: { equals: nombre, mode: 'insensitive' } },
    select: { id: true },
  });
  const id = t?.id ?? null;
  terceroCache.set(nombre, id);
  return id;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  IMPORT SISTEMAS');
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

  console.log('\n[1/2] Truncando sistemas...');
  await prisma.sistema.deleteMany();
  console.log('  ✓ Tabla limpia');

  console.log('\n[2/2] Importando sistemas...');

  let importados       = 0;
  let omitidos         = 0;
  const sinId:       string[] = [];
  const sinUsuario:  string[] = [];
  const errores:     string[] = [];

  for (const row of rows) {
    const id = getCol(row, 'ID PRODUCTO')?.trim();
    if (!id) { omitidos++; continue; }

    try {
      const usuarioNombre = getCol(row, 'USUARIO')?.trim();
      const usuarioId     = usuarioNombre ? await resolverTercero(usuarioNombre) : null;

      if (usuarioNombre && !usuarioId) sinUsuario.push(`${id} → "${usuarioNombre}"`);

      await prisma.sistema.upsert({
        where:  { id },
        update: {},
        create: {
          id,
          usuarioId,
          marcaDeTiempo: parseDateTime(getCol(row, 'MARCA DE TIEMPO')),
          sistema:       getCol(row, 'SISTEMA')?.trim() || null,
        },
      });

      importados++;
      if (importados % 200 === 0) console.log(`  → ${importados} importados...`);
    } catch (err: any) {
      errores.push(`${id}: ${err.message}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN');
  console.log('═'.repeat(60));
  console.log(`  ✓ Importados              : ${importados}`);
  console.log(`  ✗ Omitidos (sin ID)       : ${omitidos}`);
  console.log(`  ⚠ Usuario no resuelto     : ${sinUsuario.length}`);
  console.log(`  ❌ Errores                : ${errores.length}`);

  if (sinUsuario.length > 0) {
    console.log('\n  Usuarios no encontrados en DB:');
    sinUsuario.forEach(m => console.log(`    - ${m}`));
  }
  if (errores.length > 0) {
    console.log('\n  Errores de inserción:');
    errores.forEach(e => console.log(`    - ${e}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
