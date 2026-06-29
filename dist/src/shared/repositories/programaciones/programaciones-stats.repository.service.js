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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramacionesStatsRepositoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let ProgramacionesStatsRepositoryService = class ProgramacionesStatsRepositoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(query) {
        const where = {};
        if (query.dateFrom || query.dateTo) {
            where.fechaQx = {};
            if (query.dateFrom)
                where.fechaQx.gte = new Date(query.dateFrom);
            if (query.dateTo) {
                const end = new Date(query.dateTo);
                end.setHours(23, 59, 59, 999);
                where.fechaQx.lte = end;
            }
        }
        if (query.search) {
            where.OR = [
                { idLegacy: { contains: query.search, mode: 'insensitive' } },
                { hospital: { nombre: { contains: query.search, mode: 'insensitive' } } },
                { medicos: { some: { medico: { nombreCompleto: { contains: query.search, mode: 'insensitive' } } } } },
            ];
        }
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth();
        const yearStart = new Date(Date.UTC(currentYear, 0, 1));
        const monthStart = new Date(Date.UTC(currentYear, currentMonth, 1));
        const monthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
        const [total, sinRemision, consumoNoValidado, sinComision, cerradas, porSede, programacionesAño, programacionesMes,] = await this.prisma.$transaction([
            this.prisma.programacion.count({ where }),
            this.prisma.programacion.count({ where: { ...where, sinRemision: true } }),
            this.prisma.programacion.count({ where: { ...where, consumoNoValidado: true } }),
            this.prisma.programacion.count({ where: { ...where, sinComision: true } }),
            this.prisma.programacion.count({ where: { ...where, cerrada: true } }),
            this.prisma.programacion.groupBy({
                by: ['sedeId'],
                where,
                _count: { _all: true },
                orderBy: { sedeId: 'asc' },
            }),
            this.prisma.programacion.count({
                where: { fechaQx: { gte: yearStart, lt: new Date(currentYear + 1, 0, 1) } },
            }),
            this.prisma.programacion.count({
                where: { fechaQx: { gte: monthStart, lte: monthEnd } },
            }),
        ]);
        const sedeIds = porSede.map(s => s.sedeId).filter(Boolean);
        const sedes = await this.prisma.sede.findMany({ where: { id: { in: sedeIds } } });
        const sedeMap = new Map(sedes.map(s => [s.id, s.nombre]));
        return {
            total,
            sinRemision,
            consumoNoValidado,
            sinComision,
            cerradas,
            programacionesAño,
            programacionesMes,
            porSede: porSede.map(s => ({
                sede: s.sedeId ? sedeMap.get(s.sedeId) ?? s.sedeId : 'Sin sede',
                total: s._count._all ?? 0,
            })),
        };
    }
};
exports.ProgramacionesStatsRepositoryService = ProgramacionesStatsRepositoryService;
exports.ProgramacionesStatsRepositoryService = ProgramacionesStatsRepositoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProgramacionesStatsRepositoryService);
//# sourceMappingURL=programaciones-stats.repository.service.js.map