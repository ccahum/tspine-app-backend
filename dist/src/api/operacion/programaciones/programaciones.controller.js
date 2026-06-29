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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramacionesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const programaciones_service_1 = require("./programaciones.service");
const programacion_query_dto_1 = require("./dto/programacion-query.dto");
const programacion_response_dto_1 = require("./dto/programacion-response.dto");
const programacion_stats_dto_1 = require("./dto/programacion-stats.dto");
const update_flags_dto_1 = require("./dto/update-flags.dto");
const create_programacion_dto_1 = require("./dto/create-programacion.dto");
const programacion_comparison_dto_1 = require("./dto/programacion-comparison.dto");
let ProgramacionesController = class ProgramacionesController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getStats(query) {
        return this.service.getStats(query);
    }
    async getMonthComparison() {
        return this.service.getMonthComparison();
    }
    async getSedeDistributionByMonth(year, month) {
        return this.service.getSedeDistributionByMonth(Number.parseInt(year), Number.parseInt(month));
    }
    async findAll(query) {
        return this.service.findAll(query);
    }
    async create(dto) {
        return this.service.create(dto);
    }
    async getById(id) {
        return this.service.getById(id);
    }
    async updateFlags(id, dto) {
        return this.service.updateFlags(id, dto);
    }
};
exports.ProgramacionesController = ProgramacionesController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Estadísticas de programaciones' }),
    (0, swagger_1.ApiOkResponse)({ type: programacion_stats_dto_1.ProgramacionStatsDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [programacion_query_dto_1.ProgramacionQueryDto]),
    __metadata("design:returntype", Promise)
], ProgramacionesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('comparison/monthly'),
    (0, swagger_1.ApiOperation)({ summary: 'Comparativa de programaciones por mes y año' }),
    (0, swagger_1.ApiOkResponse)({ type: programacion_comparison_dto_1.ProgramacionComparisonResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProgramacionesController.prototype, "getMonthComparison", null);
__decorate([
    (0, common_1.Get)('sede-distribution/:year/:month'),
    (0, swagger_1.ApiOperation)({ summary: 'Distribución de programaciones por sede para un mes específico' }),
    __param(0, (0, common_1.Param)('year')),
    __param(1, (0, common_1.Param)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProgramacionesController.prototype, "getSedeDistributionByMonth", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar programaciones' }),
    (0, swagger_1.ApiOkResponse)({ type: programacion_response_dto_1.ProgramacionListResponseDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [programacion_query_dto_1.ProgramacionQueryDto]),
    __metadata("design:returntype", Promise)
], ProgramacionesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear nueva programación' }),
    (0, swagger_1.ApiCreatedResponse)({ type: programacion_response_dto_1.ProgramacionListItemDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_programacion_dto_1.CreateProgramacionDto]),
    __metadata("design:returntype", Promise)
], ProgramacionesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener detalles de una programación' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProgramacionesController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)(':id/flags'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar flags de una programación' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_flags_dto_1.UpdateFlagsDto]),
    __metadata("design:returntype", Promise)
], ProgramacionesController.prototype, "updateFlags", null);
exports.ProgramacionesController = ProgramacionesController = __decorate([
    (0, swagger_1.ApiTags)('Operación - Programaciones'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('operacion/programaciones'),
    __metadata("design:paramtypes", [programaciones_service_1.ProgramacionesService])
], ProgramacionesController);
//# sourceMappingURL=programaciones.controller.js.map