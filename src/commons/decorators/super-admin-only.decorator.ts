import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { SuperAdminGuard } from '../authorization/guards/super-admin.guard';
import { ProblemDetailsResponseDto } from '../filters/problem-details.response.dto';

// Protege un endpoint para que solo usuarios con perfil de super-admin (SA) puedan usarlo.
// Requiere que JwtAuthGuard ya haya corrido antes (global) para poblar request.user.
export const SuperAdminOnly = () =>
  applyDecorators(UseGuards(SuperAdminGuard), ApiForbiddenResponse({ type: ProblemDetailsResponseDto }));
