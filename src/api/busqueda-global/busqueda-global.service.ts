import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';

const MAX_RESULTS = 5;

@Injectable()
export class BusquedaGlobalService {
  constructor(private readonly prisma: PrismaService) {}

  async buscar(q?: string) {
    const term = q?.trim();
    if (!term || term.length < 2) {
      return { programaciones: [], remisiones: [], cotizaciones: [] };
    }

    const [programaciones, remisiones, cotizaciones] = await this.prisma.$transaction([
      this.prisma.programacion.findMany({
        where: {
          OR: [
            { id: { contains: term, mode: 'insensitive' } },
            { numProgram: { contains: term, mode: 'insensitive' } },
            { hospital: { nombre: { contains: term, mode: 'insensitive' } } },
            { medicos: { some: { medico: { nombreCompleto: { contains: term, mode: 'insensitive' } } } } },
          ],
        },
        select: { id: true, numProgram: true, fechaQx: true, hospital: { select: { nombre: true } } },
        orderBy: { fechaQx: 'desc' },
        take: MAX_RESULTS,
      }),
      this.prisma.remision.findMany({
        where: {
          OR: [
            { id: { contains: term, mode: 'insensitive' } },
            { numRemision: { contains: term, mode: 'insensitive' } },
            { paciente: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, numRemision: true, paciente: true },
        orderBy: { creadoEn: 'desc' },
        take: MAX_RESULTS,
      }),
      this.prisma.cotizacion.findMany({
        where: {
          OR: [
            { id: { contains: term, mode: 'insensitive' } },
            { numCotizacion: { contains: term, mode: 'insensitive' } },
            { medico: { contains: term, mode: 'insensitive' } },
            { hospital: { nombreCompleto: { contains: term, mode: 'insensitive' } } },
          ],
        },
        select: { id: true, numCotizacion: true, medico: true, hospital: { select: { nombreCompleto: true } } },
        orderBy: { fecha: 'desc' },
        take: MAX_RESULTS,
      }),
    ]);

    return {
      programaciones: programaciones.map(p => ({
        id: p.id,
        numProgram: p.numProgram,
        hospital: p.hospital?.nombre ?? null,
        fechaQx: p.fechaQx,
      })),
      remisiones,
      cotizaciones: cotizaciones.map(c => ({
        id: c.id,
        numCotizacion: c.numCotizacion,
        hospital: c.hospital?.nombreCompleto ?? null,
        medico: c.medico,
      })),
    };
  }
}
