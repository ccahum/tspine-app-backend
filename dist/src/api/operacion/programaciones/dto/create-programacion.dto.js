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
exports.CreateProgramacionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateProgramacionDto {
    fechaQx;
    horaQx;
    sede;
    hospital;
    observaciones;
    consumo;
    medicos;
}
exports.CreateProgramacionDto = CreateProgramacionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Fecha de la cirugía (yyyy-MM-dd)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateProgramacionDto.prototype, "fechaQx", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hora de la cirugía (HH:mm)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProgramacionDto.prototype, "horaQx", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID o nombre de la sede' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProgramacionDto.prototype, "sede", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID o nombre del hospital' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProgramacionDto.prototype, "hospital", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Observaciones' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProgramacionDto.prototype, "observaciones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Consumo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProgramacionDto.prototype, "consumo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'IDs de médicos' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateProgramacionDto.prototype, "medicos", void 0);
//# sourceMappingURL=create-programacion.dto.js.map