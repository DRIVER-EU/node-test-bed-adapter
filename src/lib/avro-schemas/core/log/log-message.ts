import { LogLevelType } from '../../../logger/log-levels';

/**
 * Log message, especially useful to inform others of errors that are occurring.
 * Implements AVRO schema: system_logging-value.avsc
 * @see https://github.com/DRIVER-EU/avro-schemas/blob/master/core/log/system_logging-value.avsc
 */
export interface ILogMessage {
  /** Client id */
  id: string;
  /** The date and time the distribution message was sent as the number of milliseconds from the unix epoch, 1 January 1970 00:00:00.000 UTC. */
  dateTimeSent: number;
  /** The action-ability of the message. */
  level: LogLevelType;
  /** Actual log message */
  log: string;
}