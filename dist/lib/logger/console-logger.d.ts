import { ILog } from './logger';
import { LogLevel } from './log-levels';
export declare class ConsoleLogger implements ILog {
    log(level: LogLevel, msg: string, _callback?: (err: any, result: any) => void): void;
}
