export enum Level {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  SILLY = 'SILLY'
}

/**
 * Log message, especially useful to inform others of errors that are occurring.
 */
export interface ILog {
  /** Client id */
  id: string;
  /**
   * The date and time the distribution message was sent as the number of
   * milliseconds from the unix epoch, 1 January 1970 00:00:00.000 UTC.
   */
  dateTimeSent: number;
  /** The action-ability of the message. */
  level: Level;
  /** Actual log message */
  log: string;
}
