import { ILog } from './logger';
import { LogLevel } from './log-levels';

export class ConsoleLogger implements ILog {
  log(level: LogLevel, msg: string, _callback?: (err: any, result: any) => void) {
    switch (level) {
      case LogLevel.Error:
        console.error(msg);
        break;
      case LogLevel.Warn:
        console.warn(msg);
        break;
      case LogLevel.Info:
        console.info(msg);
        break;
      default:
        console.log(msg);
        break;
    }
  }
}