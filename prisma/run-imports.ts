/**
 * run-imports.ts
 * Orquestador: ejecuta los scripts de import en orden.
 *
 * Uso:
 *   npx ts-node prisma/run-imports.ts                          → ejecuta en secuencia
 *   npx ts-node prisma/run-imports.ts --pause                  → pausa entre cada paso para revisar logs
 *   npx ts-node prisma/run-imports.ts --from=import-productos  → reanuda desde ese paso
 *   npx ts-node prisma/run-imports.ts --only=import-valconsumo → corre solo ese script
 *
 * Para agregar un nuevo script, añade una entrada a STEPS en el lugar correcto.
 */

import { spawnSync } from 'node:child_process';
import * as readline from 'node:readline';
import * as path from 'node:path';

const PROJECT_ROOT = path.join(__dirname, '..');
const PRISMA_DIR   = __dirname;

// ── Orden de ejecución ────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Seed Catálogos',        script: 'seed-catalogos' },
  { label: 'Import Programaciones',  script: 'import-programaciones' },  // crea sedes, hospitales, terceros stub
  { label: 'Import Terceros',        script: 'import-terceros' },         // necesita programaciones (reconstruye junctions)
  { label: 'Update Contacto Empresas', script: 'update-empresas-contacto' }, // celular/oficina/correo de las 3 empresas de Remisión (no vienen del CSV)
  { label: 'Import Sistemas',        script: 'import-sistemas' },         // necesita terceros
  { label: 'Import Marcas',          script: 'import-marcas' },           // sin dependencias
  { label: 'Import Lotes',           script: 'import-lotes' },            // sin dependencias
  { label: 'Import Productos',       script: 'import-productos' },        // necesita terceros, sistemas, marcas
  { label: 'Import Listas de Precio', script: 'import-listas-precio' },   // necesita subtarifas (seed catálogos), productos
  { label: 'Import Precios Especiales', script: 'import-precios-especiales' }, // necesita productos, terceros
  { label: 'Import Detalle Paquetes',   script: 'import-detallepaquetes' },    // necesita paquetes de cotización (seed catálogos), productos
  { label: 'Import Cotizaciones',       script: 'import-cotizacion' },         // necesita terceros, sedes, subtarifas, paquetes, detalle de paquetes
  { label: 'Import Detalle Cotización', script: 'import-det-cotiza' },         // necesita cotizaciones, terceros, productos
  { label: 'Import Remisiones',      script: 'import-remisiones' },       // necesita programaciones, terceros
  { label: 'Import Facturación',     script: 'import-facturacion' },      // necesita terceros, remisiones, sedes
  { label: 'Import Detalle Factura', script: 'import-detallefactura' },   // necesita facturas, productos, cat_iva/iva_ret/isr_ret, objetos_impuesto, unidades_medida_sat
  { label: 'Import Nota Crédito',    script: 'import-notacredito' },      // necesita facturas
  { label: 'Import Det. Técnicos',         script: 'import-dettecnicos' },         // necesita programaciones, terceros, remisiones
  { label: 'Import Det. Técnicos Detalle', script: 'import-dettecnicodetalle' },    // necesita det_tecnicos, programaciones, remisiones, productos
  { label: 'Import Det. Consumos',         script: 'import-detconsumos' },          // necesita programaciones, remisiones, productos
  { label: 'Import Almacenes',             script: 'import-almacenes' },            // necesita sedes
  { label: 'Import Val. Consumo',          script: 'import-valconsumo' },           // necesita det_consumos + pasos anteriores
  { label: 'Import Val. Consumo Lotes',    script: 'import-valconsumolotes' },      // necesita val_consumo, lotes, almacenes
  { label: 'Import Rem. Técnicos',         script: 'import-remtecnicos' },          // necesita programaciones, remisiones, terceros
  { label: 'Import Requisiciones',         script: 'import-requisiciones' },        // necesita terceros, programaciones, tarifas, sedes
  { label: 'Import Detalle Requisición',   script: 'import-detrequisicion' },       // necesita requisiciones, lotes, productos, tarifas
  { label: 'Import Cuentas',               script: 'import-cuentas' },              // necesita bancos, terceros, sedes
  { label: 'Import Proyectos',             script: 'import-proyectos' },            // necesita terceros
  { label: 'Import Tipos de Pago',         script: 'import-tipospago' },            // enriquece clasificaciones_gasto sobre la marcha
  { label: 'Import Gastos',                script: 'import-gastos' },               // necesita terceros, sedes, formas_pago, cuentas, tipos_pago, proyectos, clasificaciones_gasto, cat_iva/iva_ret/isr_ret, programaciones
  { label: 'Import Fuentes',               script: 'import-fuentes' },              // necesita programaciones, gastos, terceros
  { label: 'Import Documentos Programación', script: 'import-documentosprogramacion' }, // necesita programaciones
  { label: 'Import Compras',               script: 'import-compras' },              // necesita sedes, almacenes, terceros, proyectos, formas_pago
  { label: 'Import Movimientos de Caja',   script: 'import-movimientoscaja' },      // necesita terceros, sedes, formas_pago, cuentas, bancos, conceptos_movimientos
  { label: 'Import MIR',                   script: 'import-mir' },                  // necesita tipos_pago, terceros, cuentas, formas_pago, proyectos
  { label: 'Import Programación Pagos',    script: 'import-programacionpagos' },    // necesita terceros, gastos, compras, det_tecnicos, mir, movimientos_caja
  { label: 'Import Pagos Ejecución',       script: 'import-pagosejecucion' },       // necesita terceros, programacion_pagos, formas_pago, cuentas, bancos, movimientos_caja
  { label: 'Import Detalle Compra',        script: 'import-detallecompra' },        // necesita compras, productos, terceros, cat_iva/iva_ret/isr_ret
  { label: 'Import Entradas por Compra',   script: 'import-entradascompra' },       // necesita detalle_compras, productos, lotes, terceros
  { label: 'Import Abonos',                script: 'import-abonos' },               // necesita terceros, movimientos_caja, facturas, formas_pago, cuentas, bancos
];

type Step   = typeof STEPS[number];
type Result = { label: string; ok: boolean };

// ── Args ──────────────────────────────────────────────────────────────────────

const withPause = process.argv.includes('--pause');
const fromArg   = process.argv.find(a => a.startsWith('--from='))?.split('=')[1];
const onlyArg   = process.argv.find(a => a.startsWith('--only='))?.split('=')[1];

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(label: string, script: string): boolean {
  const scriptPath = path.join(PRISMA_DIR, `${script}.ts`);

  console.log('\n' + '─'.repeat(60));
  console.log(`  ▶  ${label}`);
  console.log('─'.repeat(60));

  const start  = Date.now();
  const result = spawnSync('npx', ['ts-node', scriptPath], {
    stdio: 'inherit',   // los logs del script se muestran directo en tu terminal
    shell: true,
    cwd:   PROJECT_ROOT,
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (result.status !== 0) {
    console.log(`\n  ❌  ${label} falló (${elapsed}s)`);
    return false;
  }

  console.log(`\n  ✓  ${label} completado (${elapsed}s)`);
  return true;
}

function confirmar(siguiente: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`\n  ¿Continuar con "${siguiente}"? [Enter = sí / n = abortar]  `, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() !== 'n');
    });
  });
}

function resolveSteps(): Step[] {
  if (onlyArg) {
    const steps = STEPS.filter(s => s.script === onlyArg);
    if (steps.length === 0) {
      console.error(`\n❌ Script no encontrado: "${onlyArg}"`);
      console.error(`   Opciones: ${STEPS.map(s => s.script).join(', ')}`);
      process.exit(1);
    }
    return steps;
  }

  if (fromArg) {
    const idx = STEPS.findIndex(s => s.script === fromArg);
    if (idx === -1) {
      console.error(`\n❌ Script no encontrado: "${fromArg}"`);
      console.error(`   Opciones: ${STEPS.map(s => s.script).join(', ')}`);
      process.exit(1);
    }
    console.log(`\n  ⏩ Comenzando desde paso ${idx + 1}: ${fromArg}`);
    return STEPS.slice(idx);
  }

  return STEPS;
}

async function runSteps(steps: Step[]): Promise<Result[]> {
  const results: Result[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const ok   = run(step.label, step.script);
    results.push({ label: step.label, ok });

    if (!ok) break;

    if (withPause && i < steps.length - 1) {
      const continuar = await confirmar(steps[i + 1].label);
      if (!continuar) {
        console.log('\n  ⏹  Ejecución abortada por el usuario.');
        break;
      }
    }
  }

  return results;
}

function printSummary(results: Result[], totalStart: number) {
  const elapsed  = ((Date.now() - totalStart) / 1000).toFixed(1);
  const exitosos = results.filter(r => r.ok).length;
  const fallidos = results.filter(r => !r.ok).length;

  console.log('\n' + '═'.repeat(60));
  console.log('  RESUMEN FINAL');
  console.log('═'.repeat(60));
  results.forEach(r => console.log(`  ${r.ok ? '✓' : '❌'}  ${r.label}`));
  console.log('─'.repeat(60));
  console.log(`  ✓ ${exitosos} exitosos   ❌ ${fallidos} fallidos   ⏱ ${elapsed}s total`);
  console.log('═'.repeat(60));

  if (fallidos > 0) process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const totalStart = Date.now();

  console.log('═'.repeat(60));
  console.log('  TSPINE — ORQUESTADOR DE IMPORTS');
  console.log('═'.repeat(60));
  console.log(`  🕐 ${new Date().toLocaleString('es-MX')}`);
  if (withPause) console.log('  ⏸  Modo pausa activo — revisarás cada paso antes de continuar');

  const steps   = resolveSteps();
  const results = await runSteps(steps);

  printSummary(results, totalStart);
}

main().catch(e => { console.error(e); process.exit(1); });
