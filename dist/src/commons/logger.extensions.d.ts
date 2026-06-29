import { Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { TraceCorrelationId } from './trace.correlation.id';
export declare class LoggerExtensions {
    static writeInfo(logger: Logger, message: string, data: any, correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>): void;
    static writeDebug(logger: Logger, message: string, data: any, correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>): void;
    static writeWarning(logger: Logger, message: string, data: any, err?: Error, correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>): void;
    static writeError(logger: Logger, message: string, data: any, err?: Error, correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>): void;
    static writeVerbose(logger: Logger, message: string, data?: any, correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>): void;
    private static writeLogInternal;
    private static getCorrelationId;
}
