"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProgramacionesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramacionesService = void 0;
const common_1 = require("@nestjs/common");
const programaciones_repository_service_1 = require("../../../shared/repositories/programaciones/programaciones.repository.service");
const programaciones_stats_repository_service_1 = require("../../../shared/repositories/programaciones/programaciones-stats.repository.service");
const logger_extensions_1 = require("../../../commons/logger.extensions");
let ProgramacionesService = ProgramacionesService_1 = class ProgramacionesService {
    repository;
    statsRepository;
    logger = new common_1.Logger(ProgramacionesService_1.name);
    constructor(repository, statsRepository) {
        this.repository = repository;
        this.statsRepository = statsRepository;
    }
    async findAll(query) {
        logger_extensions_1.LoggerExtensions.writeDebug(this.logger, 'Listando programaciones', { query });
        const { data, total } = await this.repository.findAll(query);
        const page = query.page ?? 1;
        const limit = query.limit ?? 50;
        const items = data.map((p) => ({
            id: p.id,
            idLegacy: p.idLegacy,
            fechaQx: p.fechaQx,
            horaQx: p.horaQx,
            sede: p.sede?.nombre ?? null,
            ciudad: p.hospital?.ciudad ?? null,
            medicos: p.medicos.map((m) => m.medico.nombreCompleto),
            hospital: p.hospital?.nombre ?? null,
            observaciones: p.observaciones,
            avance: p.avance ? Number(p.avance) : null,
            sinRemision: p.sinRemision,
            consumoNoValidado: p.consumoNoValidado,
            sinComision: p.sinComision,
            cerrada: p.cerrada,
        }));
        return {
            data: items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getStats(query) {
        return this.statsRepository.getStats(query);
    }
    async getById(id) {
        return this.repository.getById(id);
    }
    async updateFlags(id, dto) {
        const updated = await this.repository.updateFlags(id, dto);
        return {
            id: updated.id,
            idLegacy: updated.idLegacy,
            fechaQx: updated.fechaQx,
            horaQx: updated.horaQx,
            sede: updated.sede?.nombre ?? null,
            ciudad: updated.hospital?.ciudad ?? null,
            medicos: updated.medicos.map((m) => m.medico.nombreCompleto),
            hospital: updated.hospital?.nombre ?? null,
            observaciones: updated.observaciones,
            avance: updated.avance ? Number(updated.avance) : null,
            sinRemision: updated.sinRemision,
            consumoNoValidado: updated.consumoNoValidado,
            sinComision: updated.sinComision,
            cerrada: updated.cerrada,
        };
    }
    async create(dto) {
        logger_extensions_1.LoggerExtensions.writeDebug(this.logger, 'Creando programación', { dto });
        const created = await this.repository.create(dto);
        return {
            id: created.id,
            idLegacy: created.idLegacy,
            fechaQx: created.fechaQx,
            horaQx: created.horaQx,
            sede: created.sede?.nombre ?? null,
            ciudad: created.hospital?.ciudad ?? null,
            medicos: created.medicos.map((m) => m.medico.nombreCompleto),
            hospital: created.hospital?.nombre ?? null,
            observaciones: created.observaciones,
            avance: created.avance ? Number(created.avance) : null,
            sinRemision: created.sinRemision,
            consumoNoValidado: created.consumoNoValidado,
            sinComision: created.sinComision,
            cerrada: created.cerrada,
        };
    }
    async getMonthComparison() {
        logger_extensions_1.LoggerExtensions.writeDebug(this.logger, 'Obteniendo comparativa de programaciones por mes y año', {});
        const data = await this.repository.getMonthComparison();
        return { data };
    }
    async getSedeDistributionByMonth(year, month) {
        logger_extensions_1.LoggerExtensions.writeDebug(this.logger, 'Obteniendo distribución de programaciones por sede para mes', { year, month });
        const data = await this.repository.getSedeDistributionByMonth(year, month);
        return { data };
    }
};
exports.ProgramacionesService = ProgramacionesService;
exports.ProgramacionesService = ProgramacionesService = ProgramacionesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [programaciones_repository_service_1.ProgramacionesRepositoryService,
        programaciones_stats_repository_service_1.ProgramacionesStatsRepositoryService])
], ProgramacionesService);
//# sourceMappingURL=programaciones.service.js.map