import { EventEmitter } from 'events';
import { LogLevel } from './log-levels';

export interface ILog {
  log(level: LogLevel, msg: string, callback?: (err?: Error, result?: any) => void): void;
}

export interface ILogger {
  /** The actual logger instance */
  logger: ILog;
  /** The minimum log level: messages with a higher log level will be ignored. */
  minLevel: LogLevel;
}

/**
 * Singleton logger, who is given a list of loggers that do the actual logging.
 *
 * Event emitter:
 * 'error': Returns logger's error
 * 'message': Returns logger's message
 */
export class Logger extends EventEmitter {
  private static _instance: Logger;
  private loggers: ILogger[] = [];
  private minLevel = LogLevel.Error;
  private isInitialized = false;

  private constructor() {
    super();
  }

  public static get instance() {
    if (!Logger._instance) { Logger._instance = new Logger(); }
    return Logger._instance;
  }

  public initialize(loggers: ILogger[]) {
    this.loggers = loggers;
    this.minLevel = loggers.reduce((p, c) => c.minLevel < p ? c.minLevel : p, Number.MAX_SAFE_INTEGER);
    this.isInitialized = true;
  }

  public addLogger(logger: ILogger) {
    this.loggers.push(logger);
    this.minLevel = this.loggers.reduce((p, c) => c.minLevel < p ? c.minLevel : p, Number.MAX_SAFE_INTEGER);
  }

  public info(msg?: string, meta?: Object) { this.log(LogLevel.Info, msg, meta); }

  public debug(msg?: string, meta?: Object) { this.log(LogLevel.Debug, msg, meta); }

  public warn(msg?: string, meta?: Object) { this.log(LogLevel.Warn, msg, meta); }

  public error(msg?: string, meta?: Object) { this.log(LogLevel.Error, msg, meta); }

  public sill(msg?: string, meta?: Object) { this.log(LogLevel.Sill, msg, meta); }

  public verbose(msg?: string, meta?: Object) { this.log(LogLevel.Verbose, msg, meta); }

  private log(level: LogLevel, msg?: string, meta?: Object) {
    if (!this.isInitialized || level > this.minLevel || !this.loggers) { return; }
    const fmtMsg = this.formatter(msg, meta, LogLevel[level]);
    this.loggers.filter(logger => level <= logger.minLevel).forEach(logger => logger.logger.log(level, fmtMsg, (err, result) => {
      if (err) {
        this.emit('error', err);
      } else if (result) {
        this.emit('message', result);
      }
    }));
  }

  private formatter(msg?: string, meta?: Object, level = LogLevel[LogLevel.Info]) {
    if (msg && typeof msg === 'object' && Object.keys(msg).length) { msg = JSON.stringify(msg); }
    const metadata = meta && Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${new Date().toISOString()} [${level.toUpperCase()}] - ${msg ? msg : ''}${metadata ?  ' - ' + metadata : ''}`;
  }

}