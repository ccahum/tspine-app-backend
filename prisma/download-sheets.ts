/**
 * download-sheets.ts
 * Descarga todos los CSVs de Google Sheets a C:\Users\ASUS\Desktop\tspine-csv
 * Agregar nuevas hojas en SHEETS conforme se incorporen más tablas.
 *
 * Uso: npx ts-node prisma/download-sheets.ts
 */

import { google } from 'googleapis';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-credentials.json');
const DEST_DIR         = path.join(os.homedir(), 'Desktop', 'tspine-csv');

// ── Configuración de hojas ────────────────────────────────────────────────────
// spreadsheetId : ID del archivo de Google Sheets (parte de la URL)
// sheetName     : Nombre exacto de la pestaña (null = primera hoja del archivo)
// fileName      : Nombre del CSV resultante en tspine-csv/

const SHEETS = [
  {
    spreadsheetId: '1Wca3wge0-uTz5StsuuOGDJqb8wp9M8PGMVDMnW2iNjk',
    sheetName:     null,
    fileName:      'SistemaTspine1.0 - Programacion - Programacion.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Terceros',
    fileName:      'SistemaTspine1.0 - Terceros.csv',
  },
  {
    spreadsheetId: '1hQ63lVlBmEOzBURHzEl0bnxZcBSLKU-KIi_xhfCDC3g',
    sheetName:     null,
    fileName:      'SistemaTspine - Remision - Remision.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Det_Consumo',
    fileName:      'SistemaTspine1.0 - Det_Consumo.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Sistema',
    fileName:      'SistemaTspine1.0 - Sistema.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Marcas',
    fileName:      'SistemaTspine1.0 - Marcas.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Lote',
    fileName:      'SistemaTspine1.0 - Lote.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Productos',
    fileName:      'SistemaTspine1.0 - Productos.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'NotaCredito',
    fileName:      'SistemaTspine1.0 - NotaCredito.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Det_Tecnicos',
    fileName:      'SistemaTspine1.0 - Det_Tecnicos.csv',
  },
  {
    spreadsheetId: '1VQCmRtIuI0PQxOUNgrbRDQ-e30JbD40ZZw9PW9t4zVk',
    sheetName:     'Facturacion',
    fileName:      'SistemaTspine - Facturacion.csv',
  },
  {
    spreadsheetId: '1VQCmRtIuI0PQxOUNgrbRDQ-e30JbD40ZZw9PW9t4zVk',
    sheetName:     'DetalleDeLaFactura',
    fileName:      'SistemaTspine - DetalleDeLaFactura.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'ValConsumo',
    fileName:      'SistemaTspine1.0 - ValConsumo.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Det_Tecnicos_Detalle',
    fileName:      'SistemaTspine1.0 - Det_Tecnicos_Detalle.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Almacenes',
    fileName:      'SistemaTspine1.0 - Almacenes.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'ValConsumoLotes',
    fileName:      'SistemaTspine1.0 - ValConsumoLotes.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Rem_Tecnicos',
    fileName:      'SistemaTspine1.0 - Rem_Tecnicos.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Requisiciones',
    fileName:      'SistemaTspine1.0 - Requisiciones.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'DetalleREquisicion',
    fileName:      'SistemaTspine1.0 - DetalleRequisicion.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Cuentas',
    fileName:      'SistemaTspine1.0 - Cuentas.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Proyectos',
    fileName:      'SistemaTspine1.0 - Proyectos.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'TiposPago',
    fileName:      'SistemaTspine1.0 - TiposPago.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Gastos',
    fileName:      'SistemaTspine1.0 - Gastos.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Fuentes',
    fileName:      'SistemaTspine1.0 - Fuentes.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'DocumentosProgramacion',
    fileName:      'SistemaTspine1.0 - DocumentosProgramacion.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Compras',
    fileName:      'SistemaTspine1.0 - Compras.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'MovimientosDeCaja',
    fileName:      'SistemaTspine1.0 - MovimientosDeCaja.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Mir',
    fileName:      'SistemaTspine1.0 - MIR.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'ProgramacionPagos',
    fileName:      'SistemaTspine1.0 - ProgramacionPagos.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'PagosEjecución',
    fileName:      'SistemaTspine1.0 - PagosEjecucion.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'DetalleCompra',
    fileName:      'SistemaTspine1.0 - DetalleCompra.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Entradas por compra',
    fileName:      'SistemaTspine1.0 - EntradasPorCompra.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Abonos',
    fileName:      'SistemaTspine1.0 - Abonos.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'ListasPrecio',
    fileName:      'SistemaTspine1.0 - ListasPrecio.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'DetallePaquetes',
    fileName:      'SistemaTspine1.0 - DetallePaquetes.csv',
  },
  {
    spreadsheetId: '1kQZ3-7inYlxmAV8AGNL8Ckq_jmEtgWLqF_6G52KJoOs',
    sheetName:     'Cotizacion',
    fileName:      'SistemaTspine1.0 - Cotizacion.csv',
  },
  {
    spreadsheetId: '1kQZ3-7inYlxmAV8AGNL8Ckq_jmEtgWLqF_6G52KJoOs',
    sheetName:     'Det_Cotiza',
    fileName:      'SistemaTspine1.0 - Det_Cotiza.csv',
  },
  {
    spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o',
    sheetName:     'Vehiculos',
    fileName:      'SistemaTspine1.0 - Vehiculos.csv',
  },
  // Para agregar más pestañas de SistemaTspine1.0:
  // { spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o', sheetName: 'NombrePestaña', fileName: 'SistemaTspine1.0 - NombrePestaña.csv' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────


// Cache de metadatos por spreadsheet: evita pedir de nuevo la lista de pestañas
// cuando varias hojas del mismo spreadsheet ya la consultaron.
const metaCache = new Map<string, { sheetId: number; title: string }[]>();

async function getSheetsMeta(
  sheetsApi: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
): Promise<{ sheetId: number; title: string }[]> {
  const cached = metaCache.get(spreadsheetId);
  if (cached) return cached;

  const meta = await sheetsApi.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties(sheetId,title)',
  });
  const sheets = (meta.data.sheets ?? []).map(s => ({
    sheetId: s.properties?.sheetId ?? 0,
    title:   s.properties?.title ?? '',
  }));
  metaCache.set(spreadsheetId, sheets);
  return sheets;
}

async function downloadSheet(
  authClient: any,
  sheetsApi: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetName: string | null,
  fileName: string,
): Promise<void> {
  const sheets = await getSheetsMeta(sheetsApi, spreadsheetId);
  let gid: number;
  if (sheetName) {
    const sheet = sheets.find(s => s.title.trim() === sheetName.trim());
    if (!sheet) {
      throw new Error(`Pestaña "${sheetName}" no encontrada en spreadsheet ${spreadsheetId}`);
    }
    gid = sheet.sheetId;
  } else {
    // Primera hoja del archivo
    gid = sheets[0]?.sheetId ?? 0;
  }

  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  const res = await authClient.request({ url, responseType: 'stream' });

  const dest = path.join(DEST_DIR, fileName);
  await new Promise<void>((resolve, reject) => {
    (res.data as NodeJS.ReadableStream)
      .pipe(fs.createWriteStream(dest))
      .on('finish', resolve)
      .on('error', reject);
  });
}

// Corre `items` con un máximo de `limit` tareas concurrentes.
async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runner()));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  DOWNLOAD SHEETS');
  console.log('═'.repeat(60));
  console.log(`\n📁 Destino: ${DEST_DIR}`);
  console.log(`🕐 ${new Date().toLocaleString('es-MX')}\n`);

  if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR, { recursive: true });

  // BATCH_START/BATCH_SIZE permiten procesar solo un tramo de SHEETS en esta invocación.
  // Se usa para correr el script varias veces (proceso de Node nuevo cada vez) en vez de
  // una sola corrida larga — en el droplet de QA algo (no está claro qué, parece una fuga
  // en una dependencia) acumula memoria a lo largo de toda la corrida sin soltarla, sin
  // importar la concurrencia; reiniciar el proceso entre lotes libera esa memoria de raíz.
  const batchStart = Number(process.env.DOWNLOAD_BATCH_START) || 0;
  const batchSize   = Number(process.env.DOWNLOAD_BATCH_SIZE) || SHEETS.length;
  const batch = SHEETS.slice(batchStart, batchStart + batchSize);

  console.log(`📦 Lote: hojas ${batchStart + 1}-${batchStart + batch.length} de ${SHEETS.length}\n`);

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const authClient = await auth.getClient();
  const sheetsApi  = google.sheets({ version: 'v4', auth });

  // Precarga los metadatos de cada spreadsheet único ANTES de paralelizar,
  // para que las descargas concurrentes no disparen la misma consulta varias veces.
  const spreadsheetIds = [...new Set(batch.map(s => s.spreadsheetId))];
  await Promise.all(spreadsheetIds.map(id => getSheetsMeta(sheetsApi, id)));

  let exitoso = 0;
  let fallido = 0;

  // Concurrencia baja a propósito: en el droplet de QA (~2GB RAM, compartida con Postgres
  // y el backend) varias hojas grandes descargando a la vez agotan la memoria — más lento,
  // pero no revienta el proceso. En una máquina con más RAM se puede subir sin problema.
  const CONCURRENCIA_DESCARGA = Number(process.env.DOWNLOAD_CONCURRENCY) || 2;

  await runWithConcurrency(batch, CONCURRENCIA_DESCARGA, async sheet => {
    try {
      await downloadSheet(authClient, sheetsApi, sheet.spreadsheetId, sheet.sheetName, sheet.fileName);
      console.log(`  ⬇  ${sheet.fileName} ... ✓`);
      exitoso++;
    } catch (err: any) {
      console.log(`  ⬇  ${sheet.fileName} ... ❌  ${err.message}`);
      fallido++;
    }
  });

  console.log('\n' + '═'.repeat(60));
  console.log(`  ✓ ${exitoso} descargados   ❌ ${fallido} fallidos`);
  console.log('═'.repeat(60));

  if (fallido > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
