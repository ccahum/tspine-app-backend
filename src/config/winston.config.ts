import * as winston from 'winston';

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.json(
          process.env.FORMAT_LOG === 'true'
            ? { space: 2 }
            : {},
        ),
      ),
      level: process.env.LOG_LEVEL || 'debug',
    }),
  ],
};
