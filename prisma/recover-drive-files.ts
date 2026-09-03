/**
 * recover-drive-files.ts
 * Recupera los archivos que quedaron migrados de AppSheet solo como texto de ruta
 * (ej. "DocumentosProgramacion_Files_/0000c127.Documento.220202.pdf") sin el archivo real.
 * Busca cada uno por nombre exacto en la carpeta de Drive correspondiente (ya compartida
 * con la cuenta de servicio), lo descarga, lo guarda en uploads/ (mismo mecanismo que usa
 * la app para archivos nuevos) y actualiza el registro con la ruta real.
 *
 * Uso:
 *   npx ts-node prisma/recover-drive-files.ts             → corre las dos tablas configuradas
 *   npx ts-node prisma/recover-drive-files.ts --only=documentos
 *   npx ts-node prisma/recover-drive-files.ts --only=vehiculos
 *
 * No borra ni pisa nada si el archivo no se encuentra en Drive — esos casos quedan en el
 * reporte final (prisma/reporte-recover-drive-files.txt) para revisar a mano.
 */
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { saveUploadFile } from '../src/commons/file-storage.utils';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-credentials.json');
const REPORTE_PATH     = path.join(__dirname, 'reporte-recover-drive-files.txt');

// Ya no se busca cada archivo por nombre uno por uno (esa era la parte lenta — dos llamadas
// a la API por registro). Ahora se lista la carpeta completa UNA vez al inicio y se arma un
// mapa nombre→id en memoria; de ahí en adelante solo se hace 1 llamada (la descarga) por
// archivo. Con eso, subir la concurrencia es seguro.
const CONCURRENCIA = Number(process.env.RECOVER_CONCURRENCY) || 10;

const prisma = new PrismaClient();

interface Job {
  clave: string;
  carpetaDrive: string;
  subdirUploads: string;
  buscar: () => Promise<{ id: string; rutaLegacy: string }[]>;
  actualizar: (id: string, rutaNueva: string) => Promise<void>;
}

const JOBS: Job[] = [
  {
    clave: 'documentos',
    carpetaDrive: 'DocumentosProgramacion_Files_',
    subdirUploads: 'documentos-programacion',
    buscar: async () => {
      const rows = await prisma.documentoProgramacion.findMany({
        where: { documento: { startsWith: 'DocumentosProgramacion_Files_/' } },
        select: { id: true, documento: true },
      });
      return rows.map(r => ({ id: r.id, rutaLegacy: r.documento! }));
    },
    actualizar: async (id, rutaNueva) => {
      await prisma.documentoProgramacion.update({ where: { id }, data: { documento: rutaNueva } });
    },
  },
  {
    clave: 'vehiculos',
    carpetaDrive: 'Vehiculos_Images',
    subdirUploads: 'viajes-vehiculo',
    buscar: async () => {
      const rows = await prisma.viajeVehiculo.findMany({
        where: { fotoTablero: { startsWith: 'Vehiculos_Images/' } },
        select: { id: true, fotoTablero: true },
      });
      return rows.map(r => ({ id: r.id, rutaLegacy: r.fotoTablero! }));
    },
    actualizar: async (id, rutaNueva) => {
      await prisma.viajeVehiculo.update({ where: { id }, data: { fotoTablero: rutaNueva } });
    },
  },
  {
    clave: 'remision-firma',
    carpetaDrive: 'Remision_Images',
    subdirUploads: 'remision-firma',
    buscar: async () => {
      const rows = await prisma.remision.findMany({
        where: { firma: { startsWith: 'Remision_Images/' } },
        select: { id: true, firma: true },
      });
      return rows.map(r => ({ id: r.id, rutaLegacy: r.firma! }));
    },
    actualizar: async (id, rutaNueva) => {
      await prisma.remision.update({ where: { id }, data: { firma: rutaNueva } });
    },
  },
  {
    clave: 'vehiculo-catalogo',
    carpetaDrive: 'VehiculoCatalogo_Images',
    subdirUploads: 'vehiculo-catalogo',
    buscar: async () => {
      const rows = await prisma.vehiculoCatalogo.findMany({
        where: { fotografia: { startsWith: 'VehiculoCatalogo_Images/' } },
        select: { id: true, fotografia: true },
      });
      return rows.map(r => ({ id: r.id, rutaLegacy: r.fotografia! }));
    },
    actualizar: async (id, rutaNueva) => {
      await prisma.vehiculoCatalogo.update({ where: { id }, data: { fotografia: rutaNueva } });
    },
  },
];

function extraerNombreArchivo(rutaLegacy: string): string {
  return rutaLegacy.substring(rutaLegacy.indexOf('/') + 1);
}

// Lista TODO el contenido de una carpeta de Drive (paginando de a 1000, el máximo permitido)
// y arma un mapa nombre de archivo → id. Si hay nombres duplicados en la carpeta, se queda
// con el primero que encuentre (raro, pero posible en datos legacy).
async function listarCarpetaCompleta(
  drive: ReturnType<typeof google.drive>,
  folderId: string,
): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  let pageToken: string | undefined;
  let paginas = 0;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name)',
      pageSize: 1000,
      pageToken,
    });
    for (const f of res.data.files ?? []) {
      if (f.name && f.id && !mapa.has(f.name)) mapa.set(f.name, f.id);
    }
    pageToken = res.data.nextPageToken ?? undefined;
    paginas++;
    console.log(`    ... página ${paginas} (${mapa.size} archivos indexados hasta ahora)`);
  } while (pageToken);

  return mapa;
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>): Promise<void> {
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const index = next++;
      await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runner()));
}

async function main() {
  const onlyArg = process.argv.find(a => a.startsWith('--only='))?.split('=')[1];
  const jobs = onlyArg ? JOBS.filter(j => j.clave === onlyArg) : JOBS;
  if (jobs.length === 0) {
    console.error(`❌ --only="${onlyArg}" no coincide con ningún job (opciones: ${JOBS.map(j => j.clave).join(', ')})`);
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const noEncontrados: string[] = [];
  const conError: string[] = [];
  let totalRecuperados = 0;

  for (const job of jobs) {
    console.log('\n' + '═'.repeat(70));
    console.log(`  ${job.clave.toUpperCase()}`);
    console.log('═'.repeat(70));

    console.log(`🔍 Buscando carpeta "${job.carpetaDrive}" en Drive...`);
    const folderRes = await drive.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and name = '${job.carpetaDrive}' and trashed = false`,
      fields: 'files(id, name)',
    });
    const folder = folderRes.data.files?.[0];
    if (!folder?.id) {
      console.error(`❌ No se encontró la carpeta "${job.carpetaDrive}" — ¿ya se compartió con la cuenta de servicio?`);
      continue;
    }
    console.log(`✓ Carpeta encontrada (id: ${folder.id})`);
    console.log(`📂 Indexando contenido de la carpeta...`);
    const indice = await listarCarpetaCompleta(drive, folder.id);
    console.log(`✓ ${indice.size} archivos indexados en Drive`);

    const pendientes = await job.buscar();
    console.log(`📋 ${pendientes.length} registros pendientes de recuperar\n`);

    let procesados = 0, recuperados = 0, sinArchivo = 0, errores = 0;

    await runWithConcurrency(pendientes, CONCURRENCIA, async (registro) => {
      const nombreArchivo = extraerNombreArchivo(registro.rutaLegacy);
      try {
        const fileId = indice.get(nombreArchivo);

        if (!fileId) {
          sinArchivo++;
          noEncontrados.push(`[${job.clave}] ${registro.id} — ${registro.rutaLegacy}`);
        } else {
          const contentRes = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' },
          );
          const buffer = Buffer.from(contentRes.data as ArrayBuffer);
          const ext = nombreArchivo.split('.').pop()?.toLowerCase() || 'bin';
          const rutaNueva = saveUploadFile(job.subdirUploads, `${registro.id}.${ext}`, buffer);
          await job.actualizar(registro.id, rutaNueva);
          recuperados++;
          totalRecuperados++;
        }
      } catch (err: any) {
        errores++;
        conError.push(`[${job.clave}] ${registro.id} — ${registro.rutaLegacy} — ${err.message}`);
      }

      procesados++;
      if (procesados % 200 === 0) {
        console.log(`  ... ${procesados}/${pendientes.length} (✓ ${recuperados}  ⚠ ${sinArchivo}  ❌ ${errores})`);
      }
    });

    console.log(`\n  ✓ Recuperados : ${recuperados}`);
    console.log(`  ⚠ Sin archivo en Drive: ${sinArchivo}`);
    console.log(`  ❌ Errores    : ${errores}`);
  }

  if (noEncontrados.length > 0 || conError.length > 0) {
    const contenido = [
      `Reporte generado ${new Date().toLocaleString('es-MX')}`,
      '',
      `NO ENCONTRADOS EN DRIVE (${noEncontrados.length}):`,
      ...noEncontrados,
      '',
      `ERRORES (${conError.length}):`,
      ...conError,
    ].join('\n');
    fs.writeFileSync(REPORTE_PATH, contenido, 'utf-8');
    console.log(`\n📄 Reporte de pendientes/errores guardado en: ${REPORTE_PATH}`);
  }

  console.log(`\n${'═'.repeat(70)}\n  TOTAL RECUPERADO: ${totalRecuperados}\n${'═'.repeat(70)}`);
}

main()
  .catch(e => { console.error('❌ Error fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
