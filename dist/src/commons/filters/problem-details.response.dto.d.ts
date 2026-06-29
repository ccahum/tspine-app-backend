export declare class ErrorDto {
    code: string;
    message: string;
}
export declare class ProblemDetailsResponseDto {
    title: string;
    status: number;
    detail: string;
    correlationId?: string;
    errors: ErrorDto[];
}
