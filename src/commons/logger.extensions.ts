import { Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { TraceCorrelationId } from './trace.correlation.id';

export class LoggerExtensions {
  static writeInfo(
    logger: Logger,
    message: string,
    data: any,
    correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>,
  ) {
    LoggerExtensions.writeLogInternal(logger, 'log', message, data, undefined, correlationSource);
  }

  static writeDebug(
    logger: Logger,
    message: string,
    data: any,
    correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>,
  ) {
    LoggerExtensions.writeLogInternal(logger, 'debug', message, data, undefined, correlationSource);
  }

  static writeWarning(
    logger: Logger,
    message: string,
    data: any,
    err?: Error,
    correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>,
  ) {
    LoggerExtensions.writeLogInternal(logger, 'warn', message, data, err, correlationSource);
  }

  static writeError(
    logger: Logger,
    message: string,
    data: any,
    err?: Error,
    correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>,
  ) {
    LoggerExtensions.writeLogInternal(logger, 'error', message, data, err, correlationSource);
  }

  static writeVerbose(
    logger: Logger,
    message: string,
    data?: any,
    correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>,
  ) {
    LoggerExtensions.writeLogInternal(logger, 'verbose', message, data, undefined, correlationSource);
  }

  private static writeLogInternal(
    logger: Logger,
    writer: string,
    message: string,
    data: any,
    error?: Error,
    correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>,
  ) {
    const correlationId = LoggerExtensions.getCorrelationId(correlationSource);

    switch (writer) {
      case 'debug':
        logger.debug({ message, data, correlationId });
        break;
      case 'warn':
        logger.warn({ message, data, correlationId, error });
        break;
      case 'error':
        logger.error({ message, data, correlationId, error });
        break;
      case 'verbose':
        logger.verbose({ message, data, correlationId });
        break;
      default:
        logger.log({ message, data, correlationId });
        break;
    }
  }

  private static getCorrelationId(
    correlationSource?: string | AsyncLocalStorage<TraceCorrelationId>,
  ): string {
    if (!correlationSource) return '';
    if (typeof correlationSource === 'string') return correlationSource;
    if (correlationSource instanceof AsyncLocalStorage)
      return correlationSource.getStore()?.correlationId ?? '';
    return '';
  }
}
