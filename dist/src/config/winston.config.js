"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.winstonConfig = void 0;
const winston = require("winston");
exports.winstonConfig = {
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.timestamp(), winston.format.ms(), winston.format.json(process.env.FORMAT_LOG === 'true'
                ? { space: 2 }
                : {})),
            level: process.env.LOG_LEVEL || 'debug',
        }),
    ],
};
//# sourceMappingURL=winston.config.js.map