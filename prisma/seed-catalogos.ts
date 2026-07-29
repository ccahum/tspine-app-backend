import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REGIMENES_FISCALES: { id: string; descripcion: string }[] = [
  { id: '601', descripcion: 'General de Ley Personas Morales' },
  { id: '603', descripcion: 'Personas Morales con Fines no Lucrativos' },
  { id: '605', descripcion: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { id: '612', descripcion: 'Personas Físicas con Actividades Empresariales' },
  { id: '616', descripcion: 'Sin obligaciones fiscales' },
  { id: '623', descripcion: 'Opcional para Grupo de Sociedades' },
  { id: '626', descripcion: 'Régimen Simplificado de Confianza' },
];

type SubTarifaData = {
  id: string; nombre: string; especial: boolean; orden: number | null;
  tipoCubrimientoId: string | null; tipoActualizacion: boolean | null;
  porcentajePrecio: number | null; ultimaActualizacion: Date | null;
  actualizadoPor: string | null; actualizar: number | null;
  comentarios: string | null; metodoPagoId: string | null;
};

const SUBTARIFAS: SubTarifaData[] = [
  { id: '1A15',     nombre: 'Particulares',  especial: false, orden: 1,    tipoCubrimientoId: '1A15',   tipoActualizacion: true,  porcentajePrecio: 90,  ultimaActualizacion: new Date('2025-03-08T06:05:05Z'), actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: 1,  comentarios: null,                              metodoPagoId: 'Efectivo'       },
  { id: 'Zd5c45',  nombre: 'Hospitales',    especial: false, orden: 2,    tipoCubrimientoId: 'Zd5c45', tipoActualizacion: true,  porcentajePrecio: 50,  ultimaActualizacion: new Date('2025-02-09T12:33:07Z'), actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: 1,  comentarios: 'ESQUE LO QUE PASA PAPA QUE',     metodoPagoId: 'Transferencia'  },
  { id: '1A17',    nombre: 'Distribuidor',  especial: false, orden: 3,    tipoCubrimientoId: '1A17',   tipoActualizacion: true,  porcentajePrecio: 70,  ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Efectivo'       },
  { id: '1A18',    nombre: 'Aseguradora',   especial: false, orden: 20,   tipoCubrimientoId: '1A18',   tipoActualizacion: true,  porcentajePrecio: 60,  ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '1A1',     nombre: 'Faro',          especial: true,  orden: 4,    tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 200, ultimaActualizacion: new Date('2024-10-10T10:00:44Z'), actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: 4,  comentarios: 'SUBIR',                          metodoPagoId: 'Transferencia'  },
  { id: '1A2',     nombre: 'Star Médica',   especial: true,  orden: 5,    tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 100, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '1A3',     nombre: 'Real San José', especial: true,  orden: 6,    tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 100, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '1A4',     nombre: 'Angeles',       especial: true,  orden: 7,    tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 200, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: 'SE',                             metodoPagoId: 'Transferencia'  },
  { id: '1A5',     nombre: 'Chapalita',     especial: true,  orden: 8,    tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 100, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '1A6',     nombre: 'Hospiten',      especial: true,  orden: 9,    tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 100, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '1A7',     nombre: 'Playamed',      especial: true,  orden: 10,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 100, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '1A8',     nombre: 'Amerimed',      especial: true,  orden: 11,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 100, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '1A9',     nombre: 'Azura',         especial: true,  orden: 12,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 100, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '1A10',    nombre: 'Galenia',       especial: true,  orden: 13,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 200, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: 'PORQUE HAY INFLACION',           metodoPagoId: 'Transferencia'  },
  { id: '1A11',    nombre: 'UADY',          especial: true,  orden: 14,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 100, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '1A12',    nombre: 'Mexamerica',    especial: true,  orden: 15,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 100, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '1A13',    nombre: 'Quirur_Sur',    especial: true,  orden: 16,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 100, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '1A14',    nombre: 'ISSSTE',        especial: true,  orden: 17,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 100, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '20ed30be',nombre: 'Ohoran',        especial: true,  orden: 18,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 200, ultimaActualizacion: null,                            actualizadoPor: null,                              actualizar: null, comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: '171a5982',nombre: 'PHierro',       especial: true,  orden: 19,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 200, ultimaActualizacion: new Date('2024-10-07T08:41:57Z'), actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: 21, comentarios: 'SUBE',                          metodoPagoId: 'Transferencia'  },
  { id: 'e070032c',nombre: 'SanJavier',     especial: true,  orden: 22,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: 200, ultimaActualizacion: null,                            actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: null, comentarios: null,                            metodoPagoId: 'Transferencia'  },
  { id: 'Country', nombre: 'Country',       especial: true,  orden: 23,   tipoCubrimientoId: 'Zd5c45', tipoActualizacion: false, porcentajePrecio: null,ultimaActualizacion: null,                            actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: null, comentarios: null,                            metodoPagoId: 'Transferencia'  },
  { id: 'Axa',     nombre: 'Axa',           especial: true,  orden: 24,   tipoCubrimientoId: '1A18',   tipoActualizacion: false, porcentajePrecio: null,ultimaActualizacion: new Date('2025-03-27T07:30:08Z'), actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: null, comentarios: null,                            metodoPagoId: 'Transferencia'  },
  { id: 'GNP',     nombre: 'GNP',           especial: true,  orden: 25,   tipoCubrimientoId: '1A18',   tipoActualizacion: false, porcentajePrecio: null,ultimaActualizacion: new Date('2025-03-30T17:56:17Z'), actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: 10, comentarios: null,                             metodoPagoId: null             },
  { id: 'Mapfre',  nombre: 'Mapfre',        especial: true,  orden: 26,   tipoCubrimientoId: '1A18',   tipoActualizacion: false, porcentajePrecio: null,ultimaActualizacion: new Date('2025-04-11T07:50:13Z'), actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: 1,  comentarios: null,                             metodoPagoId: null             },
  { id: 'Monterrey',nombre:'Monterrey',     especial: true,  orden: 27,   tipoCubrimientoId: '1A18',   tipoActualizacion: false, porcentajePrecio: null,ultimaActualizacion: new Date('2025-04-23T08:35:23Z'), actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: 1,  comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: 'Inbursa', nombre: 'Inbursa',       especial: true,  orden: 28,   tipoCubrimientoId: '1A18',   tipoActualizacion: false, porcentajePrecio: null,ultimaActualizacion: new Date('2025-08-26T10:56:49Z'), actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: 1,  comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: 'MetLife', nombre: 'MetLife',       especial: true,  orden: 29,   tipoCubrimientoId: '1A18',   tipoActualizacion: false, porcentajePrecio: null,ultimaActualizacion: new Date('2025-11-25T12:46:14Z'), actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: 1,  comentarios: null,                             metodoPagoId: 'Transferencia'  },
  { id: 'Orgoa',   nombre: 'Orgoa',         especial: true,  orden: 30,   tipoCubrimientoId: '1A18',   tipoActualizacion: false, porcentajePrecio: null,ultimaActualizacion: new Date('2026-03-25T17:41:50Z'), actualizadoPor: 'Ignacio Antonio Espinosa Blanco', actualizar: 1,  comentarios: null,                             metodoPagoId: 'Transferencia'  },
];

const OBJETOS_IMPUESTO: { id: string; descripcion: string }[] = [
  { id: '01', descripcion: 'No objeto de impuesto.' },
  { id: '02', descripcion: 'Sí objeto de impuesto.' },
  { id: '03', descripcion: 'Sí objeto del impuesto y no obligado al desglose.' },
];

const UNIDADES_MEDIDA_SAT: { id: string; udem: string }[] = [
  { id: 'H87', udem: 'Pieza' },
  { id: 'E48', udem: 'Unidad de servicio' },
  { id: 'KGM', udem: 'Kilogramo' },
  { id: 'LTR', udem: 'Litro' },
  { id: 'MTR', udem: 'Metro' },
  { id: 'GRM', udem: 'Gramo' },
  { id: 'CMK', udem: 'Centímetro cuadrado' },
  { id: 'XKI', udem: 'Kit' },
];

const CATEGORIAS: { categoria: string; tarifas: boolean; depreciacion: boolean }[] = [
  { categoria: 'Biológico',      tarifas: true,  depreciacion: false },
  { categoria: 'Consumible',     tarifas: true,  depreciacion: false },
  { categoria: 'Equipo',         tarifas: false, depreciacion: false },
  { categoria: 'Implante',       tarifas: true,  depreciacion: false },
  { categoria: 'Implante Otros', tarifas: true,  depreciacion: false },
  { categoria: 'Instrumental',   tarifas: false, depreciacion: true  },
  { categoria: 'Recipiente',     tarifas: false, depreciacion: true  },
  { categoria: 'ReUso',          tarifas: false, depreciacion: false },
  { categoria: 'Tapa',           tarifas: false, depreciacion: true  },
  { categoria: 'Utilería',       tarifas: false, depreciacion: true  },
  { categoria: 'Renta',          tarifas: true,  depreciacion: true  },
  { categoria: 'Refrigerados',   tarifas: true,  depreciacion: false },
  { categoria: 'Servicio',       tarifas: false, depreciacion: false },
];

const FORMAS_PAGO: { id: string; forma: string; efectivo: boolean; tc: boolean | null }[] = [
  { id: 'Transferencia',   forma: 'Transferencia',   efectivo: false, tc: null  },
  { id: 'Efectivo',        forma: 'Efectivo',         efectivo: true,  tc: null  },
  { id: 'Depósito',        forma: 'Depósito',         efectivo: false, tc: null  },
  { id: 'Tarjeta Débito',  forma: 'Tarjeta Débito',  efectivo: false, tc: null  },
  { id: 'Tarjeta Crédito', forma: 'Tarjeta Crédito', efectivo: false, tc: null  },
  { id: 'Cheque',          forma: 'Cheque',           efectivo: false, tc: null  },
  { id: 'Compensación',    forma: 'Compensación',     efectivo: false, tc: false },
];

const USOS_CFDI: { id: string; descripcion: string; aplicaPersonaFisica: boolean; aplicaPersonaMoral: boolean }[] = [
  { id: 'G01',  descripcion: 'Adquisición de mercancías',                                                                            aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'G02',  descripcion: 'Devoluciones, descuentos o bonificaciones',                                                            aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'G03',  descripcion: 'Gastos en general',                                                                                    aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'I01',  descripcion: 'Construcciones',                                                                                       aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'I02',  descripcion: 'Mobiliario y equipo de oficina por inversiones',                                                       aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'I03',  descripcion: 'Equipo de transporte',                                                                                 aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'I04',  descripcion: 'Equipo de cómputo y accesorios',                                                                      aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'I05',  descripcion: 'Dados, troqueles, moldes, matrices y herramental',                                                     aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'I06',  descripcion: 'Comunicaciones telefónicas',                                                                           aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'I07',  descripcion: 'Comunicaciones satelitales',                                                                           aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'I08',  descripcion: 'Otra maquinaria y equipo',                                                                             aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'D01',  descripcion: 'Honorarios médicos, dentales y gastos hospitalarios',                                                  aplicaPersonaFisica: true,  aplicaPersonaMoral: false },
  { id: 'D02',  descripcion: 'Gastos médicos por incapacidad o discapacidad',                                                        aplicaPersonaFisica: true,  aplicaPersonaMoral: false },
  { id: 'D03',  descripcion: 'Gastos funerarios',                                                                                    aplicaPersonaFisica: true,  aplicaPersonaMoral: false },
  { id: 'D04',  descripcion: 'Donativos',                                                                                            aplicaPersonaFisica: true,  aplicaPersonaMoral: false },
  { id: 'D05',  descripcion: 'Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)',                   aplicaPersonaFisica: true,  aplicaPersonaMoral: false },
  { id: 'D06',  descripcion: 'Aportaciones voluntarias al SAR',                                                                      aplicaPersonaFisica: true,  aplicaPersonaMoral: false },
  { id: 'D07',  descripcion: 'Primas por seguros de gastos médicos',                                                                 aplicaPersonaFisica: true,  aplicaPersonaMoral: false },
  { id: 'D08',  descripcion: 'Gastos de transportación escolar obligatoria',                                                         aplicaPersonaFisica: true,  aplicaPersonaMoral: false },
  { id: 'D09',  descripcion: 'Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones',                aplicaPersonaFisica: true,  aplicaPersonaMoral: false },
  { id: 'D10',  descripcion: 'Pagos por servicios educativos (colegiaturas)',                                                        aplicaPersonaFisica: true,  aplicaPersonaMoral: false },
  { id: 'P01',  descripcion: 'Por definir',                                                                                          aplicaPersonaFisica: false, aplicaPersonaMoral: false },
  { id: 'S01',  descripcion: 'Sin efectos fiscales',                                                                                 aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'CP01', descripcion: 'Pagos',                                                                                                aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
  { id: 'CN01', descripcion: 'Nómina',                                                                                               aplicaPersonaFisica: true,  aplicaPersonaMoral: true  },
];

async function main() {
  console.log('\n[1/6] Sembrando RegimenFiscal...');
  for (const item of REGIMENES_FISCALES) {
    await prisma.regimenFiscal.upsert({
      where:  { id: item.id },
      update: { descripcion: item.descripcion },
      create: item,
    });
    console.log(`  ✓ ${item.id.padEnd(5)} ${item.descripcion}`);
  }

  console.log('\n[2/6] Sembrando UsoCfdi...');
  for (const item of USOS_CFDI) {
    await prisma.usoCfdi.upsert({
      where:  { id: item.id },
      update: { descripcion: item.descripcion, aplicaPersonaFisica: item.aplicaPersonaFisica, aplicaPersonaMoral: item.aplicaPersonaMoral },
      create: item,
    });
    console.log(`  ✓ ${item.id.padEnd(5)} ${item.descripcion}`);
  }

  console.log('\n[3/6] Sembrando FormasPago...');
  for (const item of FORMAS_PAGO) {
    await prisma.formaPago.upsert({
      where:  { id: item.id },
      update: { forma: item.forma, efectivo: item.efectivo, tc: item.tc },
      create: item,
    });
    console.log(`  ✓ ${item.id}`);
  }

  console.log('\n[4/6] Sembrando Tarifas...');
  // Primera pasada: crear sin tipoCubrimientoId (evita FK circular)
  for (const item of SUBTARIFAS) {
    const { tipoCubrimientoId, ...data } = item;
    await prisma.tarifa.upsert({
      where:  { id: item.id },
      update: data,
      create: data,
    });
    console.log(`  ✓ ${item.id.padEnd(10)} ${item.nombre}`);
  }
  // Segunda pasada: actualizar tipoCubrimientoId
  for (const item of SUBTARIFAS) {
    if (!item.tipoCubrimientoId) continue;
    await prisma.tarifa.update({
      where: { id: item.id },
      data:  { tipoCubrimientoId: item.tipoCubrimientoId },
    });
  }

  console.log('\n[5/6] Sembrando Categorias...');
  for (const item of CATEGORIAS) {
    await prisma.categoria.upsert({
      where:  { categoria: item.categoria },
      update: { tarifas: item.tarifas, depreciacion: item.depreciacion },
      create: item,
    });
    console.log(`  ✓ ${item.categoria}`);
  }

  console.log('\n[6/7] Sembrando UnidadesMedidaSat...');
  for (const item of UNIDADES_MEDIDA_SAT) {
    await prisma.unidadMedidaSat.upsert({
      where:  { id: item.id },
      update: { udem: item.udem },
      create: item,
    });
    console.log(`  ✓ ${item.id.padEnd(5)} ${item.udem}`);
  }

  console.log('\n[7/7] Sembrando ObjetosImpuesto...');
  for (const item of OBJETOS_IMPUESTO) {
    await prisma.objetoImpuesto.upsert({
      where:  { id: item.id },
      update: { descripcion: item.descripcion },
      create: item,
    });
    console.log(`  ✓ ${item.id} ${item.descripcion}`);
  }

  const totalRf  = await prisma.regimenFiscal.count();
  const totalUc  = await prisma.usoCfdi.count();
  const totalFp  = await prisma.formaPago.count();
  const totalTar = await prisma.tarifa.count();
  const totalCat = await prisma.categoria.count();
  const totalUdm = await prisma.unidadMedidaSat.count();
  const totalOi  = await prisma.objetoImpuesto.count();
  console.log(`\n✅ ${totalRf} regímenes fiscales, ${totalUc} usos CFDI, ${totalFp} formas de pago, ${totalTar} tarifas, ${totalCat} categorías, ${totalUdm} unidades de medida, ${totalOi} objetos de impuesto\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
