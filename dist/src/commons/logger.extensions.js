"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerExtensions = void 0;
const node_async_hooks_1 = require("node:async_hooks");
class LoggerExtensions {
    static writeInfo(logger, message, data, correlationSource) {
        LoggerExtensions.writeLogInternal(logger, 'log', message, data, undefined, correlationSource);
    }
    static writeDebug(logger, message, data, correlationSource) {
        LoggerExtensions.writeLogInternal(logger, 'debug', message, data, undefined, correlationSource);
    }
    static writeWarning(logger, message, data, err, correlationSource) {
        LoggerExtensions.writeLogInternal(logger, 'warn', message, data, err, correlationSource);
    }
    static writeError(logger, message, data, err, correlationSource) {
        LoggerExtensions.writeLogInternal(logger, 'error', message, data, err, correlationSource);
    }
    static writeVerbose(logger, message, data, correlationSource) {
        LoggerExtensions.writeLogInternal(logger, 'verbose', message, data, undefined, correlationSource);
    }
    static writeLogInternal(logger, writer, message, data, error, correlationSource) {
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
    static getCorrelationId(correlationSource) {
        if (!correlationSource)
            return '';
        if (typeof correlationSource === 'string')
            return correlationSource;
        if (correlationSource instanceof node_async_hooks_1.AsyncLocalStorage)
            return correlationSource.getStore()?.correlationId ?? '';
        return '';
    }
}
exports.LoggerExtensions = LoggerExtensions;
//# sourceMappingURL=logger.extensions.js.map