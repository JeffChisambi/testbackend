import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize(),
  printf(({ level, message, timestamp: ts, stack }) => `${ts} [${level}]: ${stack ?? message}`)
);

const prodFormat = combine(errors({ stack: true }), timestamp(), winston.format.json());

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
});
