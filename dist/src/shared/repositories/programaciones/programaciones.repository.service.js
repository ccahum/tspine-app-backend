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
exports.ProgramacionesRepositoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const normalizeText = (text) => text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
let ProgramacionesRepositoryService = class ProgramacionesRepositoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const { page = 1, limit = 50, dateFrom, dateTo, sedeId, search, cerrada, sinRemision, sinComision, consumoNoValidado } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (dateFrom || dateTo) {
            where.fechaQx = {};
            if (dateFrom)
                where.fechaQx.gte = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                where.fechaQx.lte = end;
            }
        }
        if (sedeId)
            where.sedeId = sedeId;
        if (cerrada !== undefined)
            where.cerrada = cerrada;
        if (sinRemision !== undefined)
            where.sinRemision = sinRemision;
        if (sinComision !== undefined)
            where.sinComision = sinComision;
        if (consumoNoValidado !== undefined)
            where.consumoNoValidado = consumoNoValidado;
        if (search?.trim()) {
            where.OR = [
                { idLegacy: { equals: search, mode: 'insensitive' } },
                { idLegacy: { contains: search, mode: 'insensitive' } },
                { numProgram: { equals: search, mode: 'insensitive' } },
                { numProgram: { contains: search, mode: 'insensitive' } },
                { hospital: { nombre: { contains: search, mode: 'insensitive' } } },
                { observaciones: { contains: search, mode: 'insensitive' } },
                { medicos: { some: { medico: { nombreCompleto: { contains: search, mode: 'insensitive' } } } } },
            ];
        }
        const [data, total] = await this.prisma.$transaction([
            this.prisma.programacion.findMany({
                where,
                skip,
                take: limit,
                orderBy: { fechaQx: 'desc' },
                include: {
                    sede: { select: { nombre: true } },
                    hospital: { select: { nombre: true, ciudad: true } },
                    medicos: { include: { medico: { select: { nombreCompleto: true } } } },
                },
            }),
            this.prisma.programacion.count({ where }),
        ]);
        if (total === 0 && search?.trim()) {
            const searchNormalized = normalizeText(search);
            const whereNoSearch = { ...where };
            delete whereNoSearch.OR;
            const [allData, totalAll] = await this.prisma.$transaction([
                this.prisma.programacion.findMany({
                    where: whereNoSearch,
                    orderBy: { fechaQx: 'desc' },
                    include: {
                        sede: { select: { nombre: true } },
                        hospital: { select: { nombre: true, ciudad: true } },
                        medicos: { include: { medico: { select: { nombreCompleto: true } } } },
                    },
                }),
                this.prisma.programacion.count({ where: whereNoSearch }),
            ]);
            const filtered = allData.filter(p => {
                const idLegacyMatch = normalizeText(p.idLegacy || '').includes(searchNormalized);
                const numProgramMatch = normalizeText(p.numProgram || '').includes(searchNormalized);
                const hospitalMatch = normalizeText(p.hospital?.nombre || '').includes(searchNormalized);
                const observacionesMatch = normalizeText(p.observaciones || '').includes(searchNormalized);
                const medicosMatch = p.medicos.some(m => normalizeText(m.medico.nombreCompleto).includes(searchNormalized));
                return idLegacyMatch || numProgramMatch || hospitalMatch || observacionesMatch || medicosMatch;
            });
            const paginatedData = filtered.slice(skip, skip + limit);
            return { data: paginatedData, total: filtered.length };
        }
        return { data, total };
    }
    async getById(id) {
        return this.prisma.programacion.findUnique({
            where: { id },
            include: {
                sede: { select: { nombre: true, id: true } },
                hospital: { select: { nombre: true, ciudad: true, id: true } },
                medicos: { include: { medico: { select: { nombreCompleto: true, id: true } } } },
                tecnicos: { include: { tecnico: { select: { nombreCompleto: true, id: true } } } },
            },
        });
    }
    async updateFlags(id, flags) {
        const data = {};
        if (flags.sinRemision !== undefined)
            data.sinRemision = flags.sinRemision;
        if (flags.consumoNoValidado !== undefined)
            data.consumoNoValidado = flags.consumoNoValidado;
        if (flags.sinComision !== undefined)
            data.sinComision = flags.sinComision;
        if (flags.cerrada !== undefined)
            data.cerrada = flags.cerrada;
        return this.prisma.programacion.update({
            where: { id },
            data,
            include: {
                sede: { select: { nombre: true } },
                hospital: { select: { nombre: true, ciudad: true } },
                medicos: { include: { medico: { select: { nombreCompleto: true } } } },
            },
        });
    }
    async create(createData) {
        const { fechaQx, horaQx, sede, hospital, observaciones, consumo, medicos } = createData;
        let sedeId = null;
        let hospitalId = null;
        if (sede) {
            const sedeRecord = await this.prisma.sede.findFirst({
                where: { nombre: { contains: sede, mode: 'insensitive' } },
            });
            sedeId = sedeRecord?.id ?? null;
        }
        if (hospital) {
            const hospitalRecord = await this.prisma.hospital.findFirst({
                where: { nombre: { contains: hospital, mode: 'insensitive' } },
            });
            if (hospitalRecord) {
                hospitalId = hospitalRecord.id;
            }
            else {
                const newHospital = await this.prisma.hospital.create({
                    data: { nombre: hospital },
                });
                hospitalId = newHospital.id;
            }
        }
        const programacion = await this.prisma.programacion.create({
            data: {
                fechaQx: fechaQx ? new Date(fechaQx) : null,
                horaQx: horaQx ?? null,
                sedeId: sedeId,
                hospitalId: hospitalId,
                observaciones: observaciones ?? null,
                consumo: consumo ?? null,
                medicos: {
                    create: (medicos || []).map((medicoId) => ({
                        medicoId: medicoId,
                    })),
                },
            },
            include: {
                sede: { select: { nombre: true } },
                hospital: { select: { nombre: true, ciudad: true } },
                medicos: { include: { medico: { select: { nombreCompleto: true } } } },
            },
        });
        return programacion;
    }
    async getMonthComparison() {
        const allPrograms = await this.prisma.programacion.findMany({
            where: { fechaQx: { not: null } },
            select: { fechaQx: true },
        });
        const comparisonMap = {};
        allPrograms.forEach((prog) => {
            const fecha = new Date(prog.fechaQx);
            const year = fecha.getUTCFullYear();
            const month = fecha.getUTCMonth() + 1;
            if (!comparisonMap[year]) {
                comparisonMap[year] = {};
            }
            comparisonMap[year][month] = (comparisonMap[year][month] || 0) + 1;
        });
        const result = Object.entries(comparisonMap)
            .map(([year, months]) => ({
            year: Number.parseInt(year),
            months,
        }))
            .sort((a, b) => b.year - a.year);
        return result;
    }
    async getSedeDistributionByMonth(year, month) {
        const monthStart = new Date(Date.UTC(year, month - 1, 1));
        const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        const sedeDistribution = await this.prisma.programacion.groupBy({
            by: ['sedeId'],
            where: {
                fechaQx: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
            _count: { _all: true },
            orderBy: { sedeId: 'asc' },
        });
        const sedeIds = sedeDistribution.map(s => s.sedeId).filter(Boolean);
        const sedes = await this.prisma.sede.findMany({ where: { id: { in: sedeIds } } });
        const sedeMap = new Map(sedes.map(s => [s.id, s.nombre]));
        return sedeDistribution.map(s => ({
            sede: s.sedeId ? sedeMap.get(s.sedeId) ?? s.sedeId : 'Sin sede',
            total: s._count._all ?? 0,
        }));
    }
};
exports.ProgramacionesRepositoryService = ProgramacionesRepositoryService;
exports.ProgramacionesRepositoryService = ProgramacionesRepositoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProgramacionesRepositoryService);
//# sourceMappingURL=programaciones.repository.service.js.map