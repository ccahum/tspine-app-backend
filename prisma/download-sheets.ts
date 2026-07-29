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

const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-credentials.json');
const DEST_DIR         = String.raw`C:\Users\ASUS\Desktop\tspine-csv`;

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
  // Para agregar más pestañas de SistemaTspine1.0:
  // { spreadsheetId: '1lHv_yJ5YoI2smFJYBidtLn4cpEh61XrJ4Jy_a9K_0-o', sheetName: 'NombrePestaña', fileName: 'SistemaTspine1.0 - NombrePestaña.csv' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────


async function downloadSheet(
  authClient: any,
  sheetsApi: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetName: string | null,
  fileName: string,
): Promise<void> {
  // Siempre consultar el GID real via API (evita asumir gid=0)
  const meta = await sheetsApi.spreadsheets.get({ spreadsheetId });
  let gid: number;
  if (sheetName) {
    const sheet = meta.data.sheets?.find(s => s.properties?.title?.trim() === sheetName.trim());
    if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
      throw new Error(`Pestaña "${sheetName}" no encontrada en spreadsheet ${spreadsheetId}`);
    }
    gid = sheet.properties.sheetId!;
  } else {
    // Primera hoja del archivo
    gid = meta.data.sheets?.[0]?.properties?.sheetId ?? 0;
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('  DOWNLOAD SHEETS');
  console.log('═'.repeat(60));
  console.log(`\n📁 Destino: ${DEST_DIR}`);
  console.log(`🕐 ${new Date().toLocaleString('es-MX')}\n`);

  if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR, { recursive: true });

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const authClient = await auth.getClient();
  const sheetsApi  = google.sheets({ version: 'v4', auth });

  let exitoso = 0;
  let fallido = 0;

  for (const sheet of SHEETS) {
    process.stdout.write(`  ⬇  ${sheet.fileName} ...`);
    try {
      await downloadSheet(authClient, sheetsApi, sheet.spreadsheetId, sheet.sheetName, sheet.fileName);
      console.log(' ✓');
      exitoso++;
    } catch (err: any) {
      console.log(` ❌  ${err.message}`);
      fallido++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`  ✓ ${exitoso} descargados   ❌ ${fallido} fallidos`);
  console.log('═'.repeat(60));

  if (fallido > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
