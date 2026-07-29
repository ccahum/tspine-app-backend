import * as winston from 'winston';

const isDev = process.env.NODE_ENV !== 'production';

const consoleFormat = isDev
  ? winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.ms(),
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, ms, context, ...meta }) => {
        const ctx = context ? ` [${context}]` : '';
        const keys = Object.keys(meta).filter((k) => k !== 'stack');
        const extra = keys.length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp}${ctx} ${level}: ${message}${extra} ${ms ?? ''}`;
      }),
    )
  : winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
      winston.format.json(),
    );

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'debug',
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      level: process.env.LOG_LEVEL || 'info',
    }),
  ],
};
