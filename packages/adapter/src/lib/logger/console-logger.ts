import { ILog } from './logger';
import { LogLevel } from './log-levels';

/**
 * Console logger.
 *
 * Color codes are taken from [here](https://stackoverflow.com/a/41407246/319711).
 */
export class ConsoleLogger implements ILog {
  log(level: LogLevel, msg: string, _callback?: (err: any, result: any) => void) {
    switch (level) {
      case LogLevel.Critical:
      case LogLevel.Error:
        console.error('\x1b[1;31m%s\x1b[0m', msg);
        break;
      case LogLevel.Warn:
        console.warn('\x1b[33m%s\x1b[0m', msg);
        break;
      case LogLevel.Info:
        console.info('\x1b[1;34m%s\x1b[0m', msg);
        break;
      default:
        console.log(msg);
        break;
    }
  }
}