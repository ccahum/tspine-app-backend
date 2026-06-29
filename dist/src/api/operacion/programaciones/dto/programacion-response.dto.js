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
exports.ProgramacionListResponseDto = exports.ProgramacionListItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ProgramacionListItemDto {
    id;
    idLegacy;
    fechaQx;
    horaQx;
    sede;
    ciudad;
    medicos;
    hospital;
    observaciones;
    avance;
    sinRemision;
    consumoNoValidado;
    sinComision;
    cerrada;
}
exports.ProgramacionListItemDto = ProgramacionListItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ProgramacionListItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ProgramacionListItemDto.prototype, "idLegacy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ProgramacionListItemDto.prototype, "fechaQx", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ProgramacionListItemDto.prototype, "horaQx", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ProgramacionListItemDto.prototype, "sede", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ProgramacionListItemDto.prototype, "ciudad", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], ProgramacionListItemDto.prototype, "medicos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ProgramacionListItemDto.prototype, "hospital", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ProgramacionListItemDto.prototype, "observaciones", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ProgramacionListItemDto.prototype, "avance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ProgramacionListItemDto.prototype, "sinRemision", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ProgramacionListItemDto.prototype, "consumoNoValidado", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ProgramacionListItemDto.prototype, "sinComision", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ProgramacionListItemDto.prototype, "cerrada", void 0);
class ProgramacionListResponseDto {
    data;
    total;
    page;
    limit;
    totalPages;
}
exports.ProgramacionListResponseDto = ProgramacionListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ProgramacionListItemDto] }),
    __metadata("design:type", Array)
], ProgramacionListResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ProgramacionListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ProgramacionListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ProgramacionListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ProgramacionListResponseDto.prototype, "totalPages", void 0);
//# sourceMappingURL=programacion-response.dto.js.map