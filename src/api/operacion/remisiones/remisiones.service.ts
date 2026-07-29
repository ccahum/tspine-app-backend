import { Injectable } from '@nestjs/common';
import { RemisionesRepositoryService } from '@app/shared/repositories/remisiones/remisiones.repository.service';

@Injectable()
export class RemisionesService {
  constructor(private readonly repo: RemisionesRepositoryService) {}

  findByProgramacion(programacionId: string) {
    return this.repo.findByProgramacion(programacionId);
  }

  findTecnicosByProgramacion(programacionId: string) {
    return this.repo.findTecnicosByProgramacion(programacionId);
  }
}
