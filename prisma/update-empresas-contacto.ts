/**
 * update-empresas-contacto.ts
 *
 * Completa celular/oficina/correo (y confirma razón social) de las 3 empresas
 * que emiten Remisión con formato propio. Estos datos no vienen del CSV de
 * Terceros (esas columnas no existían en el sistema anterior) — se cargan
 * aquí a mano, una sola vez, y se identifican por RFC.
 *
 * No crea registros nuevos: solo actualiza el DatosFiscales ya existente de
 * cada empresa (deben haberse importado antes vía import-terceros).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMPRESAS = [
  {
    rfc: 'GUBG8710068W1',
    razonSocial: 'Guillermo Alfredo Gualdrón Bateca',
    celular: '999 666 3454',
    oficina: '999 386 7505',
    correo: 'administracion@tecnologiaspine.com',
  },
  {
    rfc: 'CAB240624NJ3',
    razonSocial: 'Cabcari',
    celular: '999 389 6604',
    oficina: '999 666 3454',
    correo: 'cabcari.mid@outlook.com',
  },
  {
    rfc: 'TSP191206KT8',
    razonSocial: 'Tecnología Spine S. de R.L de C.V.',
    celular: '999 386 7505',
    oficina: '999 666 3454',
    correo: 'administracion@tecnologiaspine.com',
  },
];

async function main() {
  console.log('═'.repeat(60));
  console.log('  UPDATE CONTACTO DATOS FISCALES (empresas de Remisión)');
  console.log('═'.repeat(60));

  for (const empresa of EMPRESAS) {
    const result = await prisma.datosFiscales.updateMany({
      where: { rfc: empresa.rfc },
      data: {
        razonSocial: empresa.razonSocial,
        celular: empresa.celular,
        oficina: empresa.oficina,
        correo: empresa.correo,
      },
    });

    if (result.count === 0) {
      console.log(`  ⚠  No se encontró DatosFiscales con RFC "${empresa.rfc}" (${empresa.razonSocial}) — no se actualizó nada`);
    } else {
      console.log(`  ✓  ${empresa.razonSocial} (${empresa.rfc}) actualizado`);
    }
  }

  console.log('═'.repeat(60));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
