import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma/prisma.service';

@Injectable()
export class RemisionesRepositoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findTecnicosByProgramacion(programacionId: string) {
    return this.prisma.remTecnico.findMany({
      where: {
        OR: [
          { programacionId },
          { remision: { programacionId } },
        ],
      },
      select: {
        id: true,
        tecnico:      { select: { nombreCompleto: true } },
        programacion: { select: { id: true, numProgram: true } },
        remision:     { select: { id: true, numRemision: true } },
      },
      orderBy: { fechaRegistro: 'asc' },
    });
  }

  async findByProgramacion(programacionId: string) {
    const remisiones = await this.prisma.remision.findMany({
      where: { programacionId },
      select: {
        id: true,
        numRemision: true,
        estado: true,
        cxc: true,
        paciente: true,
        cirugiaRealizada: true,
        porcentajeDcto: true,
        vrDctoPesos: true,
        tieneFactura: true,
        noFactura: true,
        estadoFactura: true,
        creadoEn: true,
        tarifa: { select: { nombre: true } },
        detConsumos: {
          where: { eliminar: { not: true } },
          select: { valor: true },
        },
      },
      orderBy: { creadoEn: 'asc' },
    });

    return remisiones.map(({ detConsumos, ...r }) => ({
      ...r,
      subtotal: detConsumos.reduce((sum, d) => sum + Number(d.valor ?? 0), 0),
    }));
  }
}
