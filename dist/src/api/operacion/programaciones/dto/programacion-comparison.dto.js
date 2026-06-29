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
exports.ProgramacionComparisonResponseDto = exports.MonthComparisonDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class MonthComparisonDto {
    months;
    year;
}
exports.MonthComparisonDto = MonthComparisonDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: Object, example: { '0': 5, '1': 8, '2': 12 } }),
    __metadata("design:type", Object)
], MonthComparisonDto.prototype, "months", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MonthComparisonDto.prototype, "year", void 0);
class ProgramacionComparisonResponseDto {
    data;
}
exports.ProgramacionComparisonResponseDto = ProgramacionComparisonResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MonthComparisonDto] }),
    __metadata("design:type", Array)
], ProgramacionComparisonResponseDto.prototype, "data", void 0);
//# sourceMappingURL=programacion-comparison.dto.js.map