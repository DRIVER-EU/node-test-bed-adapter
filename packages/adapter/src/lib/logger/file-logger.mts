import { appendFile } from 'fs';
import { ICanLog, LogLevel } from './index.mjs';

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
    appendFile(this.file, msg + '\n', (err) => {
      if (callback) {
        return callback(err, null);
      }
      if (err) {
        throw err;
      }
    });
  }
}
