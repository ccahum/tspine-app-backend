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

const BANCOS: { id: string; nombre: string }[] = [
  'Actinver', 'Afirme', 'American Express', 'ASSOCIATED BANK, NA', 'Azteca', 'Banbajio',
  'Banco Bilbao Vizcaya Argentaria', 'Banco Contador', 'Banco de Sabadell SA', 'Banco del Bajio',
  'banco mercantil del norte', 'Banco Nacional De México', 'Banco YucaMark / Cabcari', 'Bancolombia',
  'BANK OF AMERICA, NA', 'Banorte', 'Banregio', 'BBVA', 'Bx+', 'Byline Bank',
  'Caja Chica (Cancún)', 'Caja Chica (GDL)', 'Caja Chica (Mérida)',
  'Caja Fuerte (Cancún)', 'Caja Fuerte (GDL)', 'Caja Fuerte (Mérida)', 'Caja Fuerte (Vallarta)',
  'Carla', 'Citibanamex', 'Clara', 'Fifth Third Bank, NA', 'HSBC', 'Inbursa', 'Invex',
  'JPMORGAN CHASE BANK, NA', 'KEYBANK NATIONAL ASSOCIATION', 'Lakeside Bank', 'Mifel',
  'Multiva banco', 'Nu mexico', 'OCBC Wing Hang Bank', 'PNC BANK, NATIONAL ASSOCIATION',
  'Santander', 'Scotiabank', 'Seacoast National Bank', 'STP', 'N/A', 'Compensación',
  'Mechanics Bank', 'BanCoppel', 'Zhixing Company Bank', 'Mercado Pago W',
  'Taichung Commercial Bank', 'Bankaool', 'Bancfirst', 'Transfer', 'IDFC First Bank',
].map(nombre => ({ id: nombre, nombre }));

const CLASIFICACIONES_GASTO: { id: string; clasificacion: string }[] = [
  { id: 'Activo Fijo',      clasificacion: 'Activo Fijo' },
  { id: 'Administración',   clasificacion: 'Administración' },
  { id: 'Comercial',        clasificacion: 'Comercial' },
  { id: 'Costo de Ventas',  clasificacion: 'Costo de Ventas' },
  { id: 'Financieros',      clasificacion: 'Financieros' },
  { id: 'Operación',        clasificacion: 'Operación' },
  { id: 'Socios',           clasificacion: 'Socios' },
  { id: 'Prueba',           clasificacion: 'Prueba' },
  { id: 'SaldoInicial',     clasificacion: 'SaldoInical' },
];

const CONCEPTOS: { id: string; concepto: string | null; tipo: string | null }[] = [
  { id: 'Recaudos',                       concepto: 'Recaudos',                       tipo: 'MC' },
  { id: 'Pagos Adelantados (Clientes)',    concepto: 'Pagos Adelantados (Clientes)',   tipo: 'MC' },
  { id: 'Pagos Anticipados (Proveedor)',   concepto: 'Pagos Anticipados (Proveedor)',  tipo: 'MC' },
  { id: 'Prestamos a Empleados',           concepto: 'Prestamos a Empleados',          tipo: 'Gastos' },
  { id: 'Pago Prestamos',                  concepto: 'Pago Prestamos',                 tipo: 'MC' },
  { id: 'Saldo Inicial',                   concepto: 'Saldo Inicial',                  tipo: 'MC' },
  { id: '50d42d88',                        concepto: 'Devolución',                     tipo: 'Devolución.' },
  { id: 'Recibos Provisionales',           concepto: 'Viáticos',                       tipo: 'Egreso' },
  { id: 'Cuadre de caja',                  concepto: null,                             tipo: null },
  { id: 'Devolución',                      concepto: 'Devolución',                     tipo: 'Devolución' },
  { id: '2cefdb18',                        concepto: 'Devolución',                     tipo: 'Devolución' },
  { id: 'Dividendos',                      concepto: 'Dividendos',                     tipo: 'Dividendos' },
  { id: 'Préstamos Bancarios',             concepto: 'Préstamos Bancarios',            tipo: 'Préstamos Bancarios' },
];

const CAT_IVA: { id: string; valor: string; descripcion: string | null }[] = [
  { id: '0',    valor: '0%',  descripcion: 'Productos y servicios exentos de IVA' },
  { id: '0.16', valor: '16%', descripcion: 'Tasa general aplicable en México' },
  { id: '0.08', valor: '8%',  descripcion: 'Tasa aplicable en la región fronteriza (beneficio fiscal)' },
  { id: '16',   valor: '16%', descripcion: null },
];

const CAT_IVA_RET: { id: string; descripcion: string }[] = [
  { id: '0.16',     descripcion: 'IVA Ret 16%' },
  { id: '0.106668', descripcion: 'IVA Ret 10.6668%' },
  { id: '0.106667', descripcion: 'IVA Ret 10.6667%' },
  { id: '0.106666', descripcion: 'IVA Ret 10.6666%' },
  { id: '0.10666',  descripcion: 'IVA Ret 10.666%' },
  { id: '0.10667',  descripcion: 'IVA Ret 10.667%' },
  { id: '0.1067',   descripcion: 'IVA Ret 10.67%' },
  { id: '0.1066',   descripcion: 'IVA Ret 10.66%' },
  { id: '0.106',    descripcion: 'IVA Ret 10.6%' },
  { id: '0.1',      descripcion: 'IVA Ret 10%' },
  { id: '0.0919',   descripcion: 'IVA Ret 9.19%' },
  { id: '0.08',     descripcion: 'IVA Ret 8%' },
  { id: '0.06',     descripcion: 'IVA Ret 6%' },
  { id: '0.054',    descripcion: 'IVA Ret 5.4%' },
  { id: '0.053333', descripcion: 'IVA Ret 5.3333%' },
  { id: '0.05',     descripcion: 'IVA Ret 5%' },
  { id: '0.04',     descripcion: 'IVA Ret 4%' },
  { id: '0.03',     descripcion: 'IVA Ret 3%' },
  { id: '0.025',    descripcion: 'IVA Ret 2.5%' },
  { id: '0.02',     descripcion: 'IVA Ret 2%' },
  { id: '0.007',    descripcion: 'IVA Ret 0.7%' },
  { id: '0.005333', descripcion: 'IVA Ret 0.5333%' },
  { id: '0.005',    descripcion: 'IVA Ret 0.5%' },
  { id: '0.002',    descripcion: 'IVA Ret 0.2%' },
  { id: '0',        descripcion: 'IVA Ret 0%' },
];

const CAT_ISR_RET: { id: string; descripcion: string }[] = [
  { id: '0.35',    descripcion: 'ISR 35%' },
  { id: '0.3',     descripcion: 'ISR 30%' },
  { id: '0.25',    descripcion: 'ISR 25%' },
  { id: '0.2',     descripcion: 'ISR 20%' },
  { id: '0.10666', descripcion: 'ISR 10.666%' },
  { id: '0.1',     descripcion: 'ISR 10%' },
  { id: '0.054',   descripcion: 'ISR 5.4%' },
  { id: '0.04',    descripcion: 'ISR 4%' },
  { id: '0.03',    descripcion: 'ISR 3%' },
  { id: '0.021',   descripcion: 'ISR 2.10%' },
  { id: '0.02',    descripcion: 'ISR 2%' },
  { id: '0.0125',  descripcion: 'ISR 1.25%' },
  { id: '0.011',   descripcion: 'ISR 1.1%' },
  { id: '0.01',    descripcion: 'ISR 1%' },
  { id: '0.009',   descripcion: 'ISR 0.9%' },
  { id: '0.005',   descripcion: 'ISR 0.5%' },
  { id: '0.004',   descripcion: 'ISR 0.4%' },
  { id: '0.001',   descripcion: 'ISR 0.1%' },
  { id: '0',       descripcion: 'ISR 0%' },
];

const PAQUETES_COTIZACION: { id: string; nombre: string; descripcion: string | null; estado: string | null }[] = [
  { id: 'ie14042601', nombre: 'Microdiscectomía Lumbar Tubular',                                                    descripcion: 'Microdiscectomía Lumbar Tubular',                                                    estado: 'Activo' },
  { id: 'ie14042602', nombre: 'Discectomía Lumbar Endoscópica',                                                     descripcion: 'Discectomía Lumbar Endoscópica',                                                     estado: 'Activo' },
  { id: 'ie14042603', nombre: 'Discectomía Lumbar Abierta',                                                         descripcion: 'Discectomía Lumbar Abierta',                                                         estado: 'Activo' },
  { id: 'ie14042604', nombre: 'Termoablación',                                                                      descripcion: 'Termoablación',                                                                      estado: 'Activo' },
  { id: '7f984d12',   nombre: 'Fijación Lumbar MISS',                                                               descripcion: 'Fijación Lumbar MISS',                                                               estado: 'Activo' },
  { id: 'ie14042605', nombre: 'Fijación Lumbar MISS  - Cementado',                                                  descripcion: 'Fijación Lumbar MISS  - Cementado',                                                  estado: 'Activo' },
  { id: '88da0275',   nombre: 'Fijación Lumbar MISS + TLIF - Caja Titanio Expandible',                              descripcion: 'Fijación Lumbar MISS + TLIF - Caja Titanio Expandible',                              estado: 'Activo' },
  { id: 'ie14042606', nombre: 'Fijación Lumbar MISS Cementado + TLIF - Caja Titanio Expandible',                    descripcion: 'Fijación Lumbar MISS Cementado + TLIF - Caja Titanio Expandible',                    estado: 'Activo' },
  { id: 'ie14042607', nombre: 'Fijación Lumbar MISS + TLIF - Caja Peek Recta',                                      descripcion: 'Fijación Lumbar MISS + TLIF - Caja Peek Recta',                                      estado: 'Activo' },
  { id: 'ie14042608', nombre: 'Fijación Lumbar MISS Cementado + TLIF - Caja Peek Recta',                            descripcion: 'Fijación Lumbar MISS Cementado + TLIF - Caja Peek Recta',                            estado: 'Activo' },
  { id: 'ie14042609', nombre: 'Fijación Lumbar MISS + ALIF',                                                        descripcion: 'Fijación Lumbar MISS + ALIF',                                                        estado: 'Activo' },
  { id: 'ie14042610', nombre: 'Fijación Lumbar MISS + (OLIF o LLIF) - Caja Lateral Titanio Expandible',             descripcion: 'Fijación Lumbar MISS + (OLIF o LLIF) - Caja Lateral Titanio Expandible',             estado: 'Activo' },
  { id: 'ie14042611', nombre: 'Fijación Lumbar MISS + (OLIF o LLIF) - Caja Peek',                                   descripcion: 'Fijación Lumbar MISS + (OLIF o LLIF) - Caja Peek',                                   estado: 'Activo' },
  { id: 'ie14042612', nombre: 'Fijación Lumbar Abierta',                                                            descripcion: 'Fijación Lumbar Abierta',                                                            estado: 'Activo' },
  { id: 'ie14042613', nombre: 'Fijación Lumbar Abierta + TLIF - Caja Titanio Expandible',                           descripcion: 'Fijación Lumbar Abierta + TLIF - Caja Titanio Expandible',                           estado: 'Activo' },
  { id: 'ie14042614', nombre: 'Corpectomía Toracolumbar + Fijación MISS',                                           descripcion: 'Corpectomía Toracolumbar + Fijación MISS',                                           estado: 'Activo' },
  { id: 'ie14042615', nombre: 'Cifoplastía Toracolumbar',                                                           descripcion: 'Cifoplastía Toracolumbar',                                                           estado: 'Activo' },
  { id: 'ie14042616', nombre: 'Vertebroplastía Toracolumbar',                                                       descripcion: 'Vertebroplastía Toracolumbar',                                                       estado: 'Activo' },
  { id: 'ie14042617', nombre: 'Fijación Cervical Anterior placa + Caja Peek',                                       descripcion: 'Fijación Cervical Anterior placa + Caja Peek',                                       estado: 'Activo' },
  { id: 'ie14042618', nombre: 'Fijación Cervical Anterior Caja AutoBloqueada Titanio',                              descripcion: 'Fijación Cervical Anterior Caja AutoBloqueada Titanio',                              estado: 'Activo' },
  { id: 'ie14042619', nombre: 'Corpectomia Cervical Anterior',                                                      descripcion: 'Corpectomia Cervical Anterior',                                                      estado: 'Activo' },
  { id: 'ie14042620', nombre: 'Laminectomía + Fijación Cervical Posterior',                                         descripcion: 'Laminectomía + Fijación Cervical Posterior',                                         estado: 'Activo' },
  { id: 'ie14042621', nombre: 'Fijación Occipito Cervical',                                                         descripcion: 'Fijación Occipito Cervical',                                                         estado: 'Activo' },
  { id: 'ie14042622', nombre: 'Discoplastía Cervical',                                                              descripcion: 'Discoplastía Cervical',                                                              estado: 'Activo' },
  { id: 'ie14042623', nombre: 'Resección Tumoral Medular Cervical , Toracia o Lumbar',                              descripcion: 'Resección Tumoral Medular Cervical , Toracia o Lumbar',                              estado: 'Activo' },
  { id: 'ie14042624', nombre: 'Monitoreo Intraoperatorio con Electromiografía Continua y Estimulada y Potenciales Evocados', descripcion: 'Monitoreo Intraoperatorio con Electromiografía Continua y Estimulada y Potenciales Evocados', estado: 'Activo' },
];

type VehiculoCatalogoData = {
  id: string; placas: string; nombre: string | null; marca: string | null; modelo: string | null;
  fotografia: string | null; kmActual: number | null; sedeId: string | null; estado: string | null;
};

// Migrado de la tabla VehiculoCatálogo de AppSheet. La fila con id VR3EF9HP8MJ512629 tenía en la
// hoja original SEDE="Mérida" y ESTADO="Yucatán" (error de captura) — confirmado con el usuario
// que se interpreta como Sede Mérida / Estado Activo. Las dos filas con placas YN-3672-F son
// registros distintos en la fuente original (IDs distintos), se conservan ambas tal cual.
const VEHICULOS_CATALOGO: VehiculoCatalogoData[] = [
  { id: 'JW-72-913',           placas: 'JW-72-913', nombre: 'Peugeot Mini GDL',  marca: 'Peugeot',             modelo: 'Partner', fotografia: 'VehiculoCatalogo_Images/JW-72-913.FOTOGRAFIA.122115.jpg',           kmActual: 0,      sedeId: 'sede_guadalajara', estado: 'Activo' },
  { id: 'JY-00-524',           placas: 'JY-00-524', nombre: 'Peugeot Maxi GDL',  marca: 'Peugeot',             modelo: '2021',     fotografia: 'VehiculoCatalogo_Images/JY-00-524.FOTOGRAFIA.212037.jpg',           kmActual: 0,      sedeId: 'sede_guadalajara', estado: 'Activo' },
  { id: 'SZ-7885-M',           placas: 'SZ-7885-M', nombre: 'Renault Kangoo',    marca: 'Renault',             modelo: '2022',     fotografia: 'VehiculoCatalogo_Images/SZ-7885-M.FOTOGRAFIA.153122.jpg',           kmActual: 83652,  sedeId: 'sede_cancun',      estado: 'Activo' },
  { id: 'TA-9605-N',           placas: 'TA-9605-N', nombre: 'Peugeot Maxi',      marca: 'Peugeot Partner HDI', modelo: '2025',     fotografia: 'VehiculoCatalogo_Images/TA-9605-N.FOTOGRAFIA.153520.jpg',           kmActual: 6018,   sedeId: 'sede_cancun',      estado: 'Activo' },
  { id: 'JY-20-202',           placas: 'JY-20-202', nombre: 'Renault Kangoo GDL',marca: 'Renault',             modelo: 'Kangoo',   fotografia: 'VehiculoCatalogo_Images/JY-20-202.FOTOGRAFIA.173322.jpg',           kmActual: 0,      sedeId: 'sede_guadalajara', estado: 'Activo' },
  { id: 'YR-7133-E',           placas: 'YR-7133-E', nombre: 'Partner Cancún',    marca: 'Peugeot',             modelo: '2023',     fotografia: 'VehiculoCatalogo_Images/Yr-6888-c.FOTOGRAFIA.131605.jpg',           kmActual: 173475, sedeId: 'sede_cancun',      estado: 'Activo' },
  { id: 'YZJ-661-G',           placas: 'YZJ-661-G', nombre: 'Rifther',           marca: 'Peugeot',             modelo: null,       fotografia: 'VehiculoCatalogo_Images/ZCG434C.FOTOGRAFIA.173710.jpg',             kmActual: null,   sedeId: 'sede_merida',      estado: 'Activo' },
  { id: 'YT-5899-E',           placas: 'YT-5899-E', nombre: 'Partner',           marca: 'Peugeot',             modelo: null,       fotografia: 'VehiculoCatalogo_Images/YT-5899-E.FOTOGRAFIA.173510.jpg',           kmActual: 95305,  sedeId: 'sede_merida',      estado: 'Activo' },
  { id: 'YU-3697-E',           placas: 'YU-3697-E', nombre: 'Partner',           marca: 'Peugeot',             modelo: '2026',     fotografia: null,                                                                 kmActual: null,   sedeId: 'sede_guadalajara', estado: 'Activo' },
  { id: 'ZAH-758-H',           placas: 'ZAH-758-H', nombre: 'Partner',           marca: 'Peugeot',             modelo: '2026',     fotografia: null,                                                                 kmActual: null,   sedeId: 'sede_merida',      estado: 'Activo' },
  { id: 'VR3EF9HP8MJ512629',   placas: 'YN-3672-F', nombre: 'Partner Maxi',      marca: 'Peugeot',             modelo: '2021',     fotografia: 'VehiculoCatalogo_Images/VR3EF9HP8MJ512629.FOTOGRAFIA.155538.jpg',   kmActual: 185234, sedeId: 'sede_merida',      estado: 'Activo' },
  { id: 'JP-9311-B',           placas: 'JP-9311-B', nombre: 'Saveiro Pick Up',   marca: 'Volkswagen',          modelo: '2026',     fotografia: 'VehiculoCatalogo_Images/JP-9311-B.FOTOGRAFIA.183008.jpg',           kmActual: 27,     sedeId: 'sede_guadalajara', estado: 'Activo' },
  { id: 'YN-3672-F',           placas: 'YN-3672-F', nombre: 'Peugeot maxi',      marca: 'Peugeot',             modelo: null,       fotografia: null,                                                                 kmActual: null,   sedeId: null,               estado: 'Activo' },
  { id: 'YR-6888-C',           placas: 'YR-6888-C', nombre: 'PARNER',            marca: 'PEUGEOT',             modelo: '2021',     fotografia: null,                                                                 kmActual: null,   sedeId: 'sede_cancun',      estado: 'Activo' },
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

  console.log('\n[7/9] Sembrando ObjetosImpuesto...');
  for (const item of OBJETOS_IMPUESTO) {
    await prisma.objetoImpuesto.upsert({
      where:  { id: item.id },
      update: { descripcion: item.descripcion },
      create: item,
    });
    console.log(`  ✓ ${item.id} ${item.descripcion}`);
  }

  console.log('\n[8/9] Sembrando Bancos...');
  for (const item of BANCOS) {
    await prisma.banco.upsert({
      where:  { id: item.id },
      update: { nombre: item.nombre },
      create: item,
    });
    console.log(`  ✓ ${item.nombre}`);
  }

  console.log('\n[9/10] Sembrando ClasificacionesGasto...');
  for (const item of CLASIFICACIONES_GASTO) {
    await prisma.clasificacionGasto.upsert({
      where:  { id: item.id },
      update: { clasificacion: item.clasificacion },
      create: item,
    });
    console.log(`  ✓ ${item.id}`);
  }

  console.log('\n[10/13] Sembrando CatIVA...');
  for (const item of CAT_IVA) {
    await prisma.catIva.upsert({
      where:  { id: item.id },
      update: { valor: item.valor, descripcion: item.descripcion },
      create: item,
    });
    console.log(`  ✓ ${item.id.padEnd(5)} ${item.valor}`);
  }

  console.log('\n[11/13] Sembrando CatIVARet...');
  for (const item of CAT_IVA_RET) {
    await prisma.catIvaRet.upsert({
      where:  { id: item.id },
      update: { descripcion: item.descripcion },
      create: item,
    });
    console.log(`  ✓ ${item.id.padEnd(10)} ${item.descripcion}`);
  }

  console.log('\n[12/13] Sembrando CatISRRet...');
  for (const item of CAT_ISR_RET) {
    await prisma.catIsrRet.upsert({
      where:  { id: item.id },
      update: { descripcion: item.descripcion },
      create: item,
    });
    console.log(`  ✓ ${item.id.padEnd(10)} ${item.descripcion}`);
  }

  console.log('\n[13/15] Sembrando Conceptos...');
  for (const item of CONCEPTOS) {
    await prisma.conceptoMovimiento.upsert({
      where:  { id: item.id },
      update: { concepto: item.concepto, tipo: item.tipo },
      create: item,
    });
    console.log(`  ✓ ${item.id}`);
  }

  console.log('\n[14/15] Sembrando PaquetesCotizacion...');
  for (const item of PAQUETES_COTIZACION) {
    await prisma.paqueteCotizacion.upsert({
      where:  { id: item.id },
      update: { nombre: item.nombre, descripcion: item.descripcion, estado: item.estado },
      create: item,
    });
    console.log(`  ✓ ${item.id.padEnd(12)} ${item.nombre}`);
  }

  console.log('\n[15/15] Sembrando Catálogo Vehicular...');
  for (const item of VEHICULOS_CATALOGO) {
    await prisma.vehiculoCatalogo.upsert({
      where:  { id: item.id },
      update: { placas: item.placas, nombre: item.nombre, marca: item.marca, modelo: item.modelo, fotografia: item.fotografia, kmActual: item.kmActual, sedeId: item.sedeId, estado: item.estado },
      create: item,
    });
    console.log(`  ✓ ${item.id.padEnd(20)} ${item.nombre}`);
  }

  const totalRf  = await prisma.regimenFiscal.count();
  const totalUc  = await prisma.usoCfdi.count();
  const totalFp  = await prisma.formaPago.count();
  const totalTar = await prisma.tarifa.count();
  const totalCat = await prisma.categoria.count();
  const totalUdm = await prisma.unidadMedidaSat.count();
  const totalOi  = await prisma.objetoImpuesto.count();
  const totalBan = await prisma.banco.count();
  const totalCg  = await prisma.clasificacionGasto.count();
  const totalIva    = await prisma.catIva.count();
  const totalIvaRet = await prisma.catIvaRet.count();
  const totalIsrRet = await prisma.catIsrRet.count();
  const totalConceptos = await prisma.conceptoMovimiento.count();
  const totalPaquetes = await prisma.paqueteCotizacion.count();
  const totalVehiculos = await prisma.vehiculoCatalogo.count();
  console.log(`\n✅ ${totalRf} regímenes fiscales, ${totalUc} usos CFDI, ${totalFp} formas de pago, ${totalTar} tarifas, ${totalCat} categorías, ${totalUdm} unidades de medida, ${totalOi} objetos de impuesto, ${totalBan} bancos, ${totalCg} clasificaciones de gasto, ${totalIva} tasas de IVA, ${totalIvaRet} tasas de IVA retenido, ${totalIsrRet} tasas de ISR retenido, ${totalConceptos} conceptos, ${totalPaquetes} paquetes de cotización, ${totalVehiculos} vehículos del catálogo vehicular\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
