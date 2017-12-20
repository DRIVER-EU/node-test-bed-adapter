import { ILog } from './logger';
import { LogLevel } from './log-levels';
/**
 * A simple file logger that appends the text to a log file.
 */
export declare class FileLogger implements ILog {
    private file;
    constructor(file: string);
    log(_level: LogLevel, msg: string, callback?: (err: any, result: any) => void): void;
}
