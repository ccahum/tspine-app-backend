"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemDetailsResponseDto = exports.ErrorDto = void 0;
class ErrorDto {
    code;
    message;
}
exports.ErrorDto = ErrorDto;
class ProblemDetailsResponseDto {
    title;
    status;
    detail;
    correlationId;
    errors;
}
exports.ProblemDetailsResponseDto = ProblemDetailsResponseDto;
//# sourceMappingURL=problem-details.response.dto.js.map