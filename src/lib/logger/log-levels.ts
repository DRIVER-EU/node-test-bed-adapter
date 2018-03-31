export type LogLevelType = 'SILLY' | 'INFO' | 'DEBUG' | 'WARN' | 'ERROR' | 'CRITICAL';

/**
 * Default log levels, as defined in [RFC5424](https://tools.ietf.org/html/rfc5424).
 */
export enum LogLevel {
  Sill = 0,
  Info = 1,
  Debug = 2,
  Warn = 3,
  Error = 4,
  Critical = 5
}

const LogLevels = [ 'SILLY', 'INFO', 'DEBUG', 'WARN', 'ERROR', 'CRITICAL' ] as LogLevelType[];
export const LogLevelToType = (logLevel?: LogLevel): LogLevelType | undefined => logLevel ? LogLevels[logLevel] : undefined;