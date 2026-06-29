"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const sync_1 = require("csv-parse/sync");
const prisma = new client_1.PrismaClient();
const CSV_PATH = path.join('C:\\Users\\ASUS\\Downloads', 'SistemaTspine1.0 - Programacion - Programacion.csv');
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
}
function parseDate(raw) {
    if (!raw?.trim())
        return null;
    const parts = raw.trim().split('/');
    if (parts.length !== 3)
        return null;
    const [d, m, y] = parts.map(Number);
    if (!d || !m || !y)
        return null;
    const isoString = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return new Date(isoString);
}
function parseDateTime(raw) {
    if (!raw?.trim())
        return null;
    const [datePart, timePart] = raw.trim().split(' ');
    if (!datePart)
        return null;
    const [d, m, y] = datePart.split('/').map(Number);
    if (!d || !m || !y)
        return null;
    const date = new Date(y, m - 1, d);
    if (timePart) {
        const [h, min, s] = timePart.split(':').map(Number);
        date.setHours(h ?? 0, min ?? 0, s ?? 0);
    }
    return date;
}
function parseAvance(raw) {
    if (!raw?.trim())
        return null;
    const num = parseFloat(raw.replace('%', '').trim());
    return isNaN(num) ? null : num;
}
function parsePrice(raw) {
    if (!raw?.trim())
        return null;
    const num = parseFloat(raw.replace(/[$,\s]/g, ''));
    return isNaN(num) ? null : num;
}
function parseHora(raw) {
    if (!raw?.trim())
        return null;
    return raw.trim().replace(/:00$/, '');
}
function parseBool(raw) {
    return raw?.trim()?.toUpperCase() === 'TRUE';
}
function parseList(raw) {
    if (!raw?.trim())
        return [];
    return raw.split(',').map(s => s.trim()).filter(Boolean);
}
async function getOrCreateTercero(nombre, cache) {
    if (!nombre)
        return null;
    if (cache.has(nombre))
        return cache.get(nombre);
    const existing = await prisma.tercero.findFirst({ where: { nombreCompleto: nombre } });
    if (existing) {
        cache.set(nombre, existing.id);
        return existing.id;
    }
    const nuevo = await prisma.tercero.create({ data: { nombreCompleto: nombre } });
    cache.set(nombre, nuevo.id);
    return nuevo.id;
}
async function main() {
    console.log('Leyendo CSV...');
    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const rows = (0, sync_1.parse)(content, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
        bom: true,
    });
    console.log(`Total registros en CSV: ${rows.length}`);
    const terceroCache = new Map();
    const sedesSet = new Set();
    rows.forEach(r => { if (r['SEDE']?.trim())
        sedesSet.add(r['SEDE'].trim()); });
    console.log(`\nCreando ${sedesSet.size} sedes...`);
    for (const nombre of sedesSet) {
        await prisma.sede.upsert({
            where: { id: slugify(nombre) },
            update: { nombre },
            create: { id: slugify(nombre), nombre },
        });
    }
    const hospitalesMap = new Map();
    rows.forEach(r => {
        const nombre = r['HOSPITAL']?.trim();
        const ciudad = r['CIUDAD QX']?.trim();
        if (nombre && !hospitalesMap.has(nombre))
            hospitalesMap.set(nombre, ciudad ?? '');
    });
    console.log(`Creando ${hospitalesMap.size} hospitales...`);
    const hospitalIds = new Map();
    for (const [nombre, ciudad] of hospitalesMap.entries()) {
        const id = slugify(nombre).slice(0, 36) || nombre.slice(0, 36);
        await prisma.hospital.upsert({
            where: { id },
            update: { nombre, ciudad: ciudad || null },
            create: { id, nombre, ciudad: ciudad || null },
        });
        hospitalIds.set(nombre, id);
    }
    console.log('\nImportando programaciones...');
    let created = 0;
    let skipped = 0;
    let errors = 0;
    for (const row of rows) {
        const idLegacy = row['ID_PROGRAMACION']?.trim();
        if (!idLegacy) {
            skipped++;
            continue;
        }
        const existing = await prisma.programacion.findUnique({ where: { idLegacy } });
        if (existing) {
            skipped++;
            continue;
        }
        const sedeNombre = row['SEDE']?.trim();
        const hospitalNombre = row['HOSPITAL']?.trim();
        const medicosNombres = parseList(row['MÉDICO'] || '');
        const tecnicosNombres = parseList(row['TECNICOS ASIGNADOS'] || '');
        try {
            const prog = await prisma.programacion.create({
                data: {
                    idLegacy,
                    createdAt: parseDateTime(row['MARCA DE TIEMPO']) ?? new Date(),
                    fechaQx: parseDate(row['FECHA QX']),
                    horaQx: parseHora(row['HORA QX']),
                    sedeId: sedeNombre ? slugify(sedeNombre) : null,
                    hospitalId: hospitalNombre ? hospitalIds.get(hospitalNombre) ?? null : null,
                    consumo: row['CONSUMO'] || null,
                    observaciones: row['OBSERVACIONES'] || null,
                    numProgram: row['N° PROGRAM'] || null,
                    avance: parseAvance(row['AVANCE']),
                    switch: parseBool(row['SWITCH']),
                    montoTecnicos: parsePrice(row['TÉCNICOS']),
                    montoInversionistas: parsePrice(row['INVERSIONISTAS']),
                    montoPlus: parsePrice(row['PLUS']),
                    adjuntarDocumento: row['ADJUNTAR DOCUMENTO'] || null,
                    cerrada: false,
                    sinRemision: false,
                    consumoNoValidado: false,
                    sinComision: false,
                    alertaConsumos: false,
                },
            });
            for (const nombre of medicosNombres) {
                const medicoId = await getOrCreateTercero(nombre, terceroCache);
                if (medicoId) {
                    await prisma.programacionMedico.upsert({
                        where: { programacionId_medicoId: { programacionId: prog.id, medicoId } },
                        update: {},
                        create: { programacionId: prog.id, medicoId },
                    });
                }
            }
            for (const nombre of tecnicosNombres) {
                const tecnicoId = await getOrCreateTercero(nombre, terceroCache);
                if (tecnicoId) {
                    await prisma.programacionTecnico.upsert({
                        where: { programacionId_tecnicoId: { programacionId: prog.id, tecnicoId } },
                        update: {},
                        create: { programacionId: prog.id, tecnicoId },
                    });
                }
            }
            created++;
            if (created % 200 === 0)
                console.log(`  ${created} registros importados...`);
        }
        catch (err) {
            console.error(`Error en ${idLegacy}: ${err.message}`);
            errors++;
        }
    }
    console.log(`\nImportación completa:`);
    console.log(`  ✓ ${created} programaciones creadas`);
    console.log(`  - ${skipped} omitidas (duplicadas o sin ID)`);
    console.log(`  ✗ ${errors} errores`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=import-programaciones.js.map