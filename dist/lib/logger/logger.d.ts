/// <reference types="node" />
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
export declare class Logger extends EventEmitter {
    private static _instance;
    private loggers?;
    private minLevel;
    private isInitialized;
    private constructor();
    static readonly instance: Logger;
    initialize(loggers: ILogger[]): void;
    info(msg?: string, meta?: Object): void;
    debug(msg?: string, meta?: Object): void;
    warn(msg?: string, meta?: Object): void;
    error(msg?: string, meta?: Object): void;
    sill(msg?: string, meta?: Object): void;
    verbose(msg?: string, meta?: Object): void;
    private log(level, msg?, meta?);
    private formatter(msg?, meta?, level?);
}
