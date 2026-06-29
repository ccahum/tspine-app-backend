export class ErrorDto {
  code: string;
  message: string;
}

export class ProblemDetailsResponseDto {
  title: string;
  status: number;
  detail: string;
  correlationId?: string;
  errors: ErrorDto[];
}
