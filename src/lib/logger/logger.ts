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
  private minLevel = LogLevel.Critical;
  private isInitialized = false;

  private constructor() {
    super();
  }

  public static get instance() {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    return Logger._instance;
  }

  public initialize(loggers: ILogger[]) {
    this.loggers = loggers;
    this.setMinLogLevel();
    this.isInitialized = true;
  }

  public addLogger(logger: ILogger) {
    this.loggers.push(logger);
    this.setMinLogLevel();
  }

  public info(msg: string | Object) {
    this.log(LogLevel.Info, msg);
  }

  public debug(msg: string | Object) {
    this.log(LogLevel.Debug, msg);
  }

  public warn(msg: string | Object) {
    this.log(LogLevel.Warn, msg);
  }

  public error(msg: string | Object) {
    this.log(LogLevel.Error, msg);
  }

  public critical(msg: string | Object) {
    this.log(LogLevel.Critical, msg);
  }

  public sill(msg: string | Object) {
    this.log(LogLevel.Sill, msg);
  }

  private setMinLogLevel() {
    this.minLevel = this.loggers.reduce((p, c) => (c.minLevel < p ? c.minLevel : p), Number.MAX_SAFE_INTEGER);
  }

  private log(level: LogLevel, msg: string | Object) {
    if (!this.isInitialized || level > this.minLevel || !this.loggers) {
      return;
    }
    const message = typeof msg === 'object' ? JSON.stringify(msg) : msg;
    this.loggers.filter((logger) => level <= logger.minLevel).forEach((logger) =>
      logger.logger.log(level, message, (err, result) => {
        if (err) {
          this.emit('error', err);
        } else if (result) {
          this.emit('message', result);
        }
      })
    );
  }
}
