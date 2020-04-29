import * as fs from 'fs';
import { ICanLog } from './logger';
import { LogLevel } from './log-levels';

/**
 * A simple file logger that appends the text to a log file.
 */
export class FileLogger implements ICanLog {
  constructor(private file: string) {}

  log(
    _level: LogLevel,
    msg: string,
    callback?: (err: any, result: any) => void
  ) {
    fs.appendFile(this.file, msg + '\n', err => {
      if (callback) {
        return callback(err, null);
      }
      if (err) {
        throw err;
      }
    });
  }
}
